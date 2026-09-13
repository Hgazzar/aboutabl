<?php

namespace App\Services\Assignment;

use App\Contracts\Assignment\AssignmentMaterialResolverInterface;
use App\Models\AssignmentMaterial;
use App\Models\Assigns;
use App\Models\AssignsStudents;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use InvalidArgumentException;

/**
 * Teacher CRUD for assignment_materials (optional extras on assign_id).
 * Does not affect activity completion, parent submit, rubric, or grading.
 */
class AssignmentMaterialService
{
    /** @var AssignmentMaterialResolverInterface */
    private $resolver;

    public function __construct(AssignmentMaterialResolverInterface $resolver)
    {
        $this->resolver = $resolver;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function listForAssign(int $assignId): array
    {
        return $this->resolver->resolveForAssign($assignId);
    }

    /**
     * Teacher Screen #8 bucket shape (backward compatible).
     *
     * @return array{files: array<int, mixed>, voice_recordings: array<int, mixed>, links: array<int, mixed>}
     */
    public function bucketedForAssign(int $assignId): array
    {
        $files = [];
        $voices = [];
        $links = [];

        foreach ($this->listForAssign($assignId) as $item) {
            $kind = (string) ($item['kind'] ?? '');
            if ($kind === AssignmentMaterial::KIND_VOICE) {
                $voices[] = $item;
            } elseif ($kind === AssignmentMaterial::KIND_LINK) {
                $links[] = $item;
            } else {
                $files[] = $item;
            }
        }

        return [
            'files' => $files,
            'voice_recordings' => $voices,
            'links' => $links,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function createFile(Assigns $assign, UploadedFile $file, ?string $label, int $createdBy): array
    {
        $this->assertMutable($assign);

        $stored = $this->storeUpload($assign, $file, AssignmentMaterial::KIND_FILE);
        $row = AssignmentMaterial::query()->create([
            'assign_id' => (int) $assign->id,
            'kind' => AssignmentMaterial::KIND_FILE,
            'label' => $this->nullableLabel($label),
            'original_filename' => $file->getClientOriginalName(),
            'storage_path' => $stored['path'],
            'external_url' => null,
            'mime_type' => $file->getClientMimeType() ?: $file->getMimeType(),
            'size_bytes' => $file->getSize() !== false ? (int) $file->getSize() : null,
            'duration_ms' => null,
            'sort_order' => $this->nextSortOrder((int) $assign->id),
            'created_by' => $createdBy,
        ]);

        return AssignmentMaterialResolver::serializeRow($row);
    }

    /**
     * @return array<string, mixed>
     */
    public function createVoice(
        Assigns $assign,
        UploadedFile $file,
        ?string $label,
        int $createdBy,
        ?int $durationMs = null
    ): array {
        $this->assertMutable($assign);

        $stored = $this->storeUpload($assign, $file, AssignmentMaterial::KIND_VOICE);
        $row = AssignmentMaterial::query()->create([
            'assign_id' => (int) $assign->id,
            'kind' => AssignmentMaterial::KIND_VOICE,
            'label' => $this->nullableLabel($label),
            'original_filename' => $file->getClientOriginalName(),
            'storage_path' => $stored['path'],
            'external_url' => null,
            'mime_type' => $file->getClientMimeType() ?: $file->getMimeType(),
            'size_bytes' => $file->getSize() !== false ? (int) $file->getSize() : null,
            'duration_ms' => $durationMs !== null && $durationMs > 0 ? $durationMs : null,
            'sort_order' => $this->nextSortOrder((int) $assign->id),
            'created_by' => $createdBy,
        ]);

        return AssignmentMaterialResolver::serializeRow($row);
    }

    /**
     * @return array<string, mixed>
     */
    public function createLink(Assigns $assign, string $url, ?string $label, int $createdBy): array
    {
        $this->assertMutable($assign);

        $trimmed = trim($url);
        if ($trimmed === '') {
            throw new InvalidArgumentException('invalid_link');
        }

        $row = AssignmentMaterial::query()->create([
            'assign_id' => (int) $assign->id,
            'kind' => AssignmentMaterial::KIND_LINK,
            'label' => $this->nullableLabel($label),
            'original_filename' => null,
            'storage_path' => null,
            'external_url' => $trimmed,
            'mime_type' => null,
            'size_bytes' => null,
            'duration_ms' => null,
            'sort_order' => $this->nextSortOrder((int) $assign->id),
            'created_by' => $createdBy,
        ]);

        return AssignmentMaterialResolver::serializeRow($row);
    }

    public function delete(Assigns $assign, int $materialId): void
    {
        $this->assertMutable($assign);

        $row = AssignmentMaterial::query()
            ->where('id', $materialId)
            ->where('assign_id', (int) $assign->id)
            ->first();

        if (! $row) {
            throw new InvalidArgumentException('not_found');
        }

        $path = $row->storage_path ? (string) $row->storage_path : null;
        $row->delete();

        if ($path && Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }
    }

    /**
     * Freeze materials when any student has parent submitted/graded.
     *
     * @throws InvalidArgumentException materials_locked
     */
    public function assertMutable(Assigns $assign): void
    {
        if ($this->isFrozen((int) $assign->id)) {
            throw new InvalidArgumentException('materials_locked');
        }
    }

    public function isFrozen(int $assignId): bool
    {
        if (! Schema::hasTable('assigns_students')) {
            return false;
        }

        $query = AssignsStudents::query()->where('assign_id', $assignId);

        if (Schema::hasColumn('assigns_students', 'submission_status')) {
            $query->where(function ($q) {
                $q->whereIn('submission_status', [
                    AssignmentParentSubmissionService::STATUS_SUBMITTED,
                    AssignmentParentSubmissionService::STATUS_GRADED,
                ]);
                if (Schema::hasColumn('assigns_students', 'submitted_at')) {
                    $q->orWhereNotNull('submitted_at');
                }
                if (Schema::hasColumn('assigns_students', 'graded_at')) {
                    $q->orWhereNotNull('graded_at');
                }
            });
        } elseif (Schema::hasColumn('assigns_students', 'submitted_at')) {
            $query->where(function ($q) {
                $q->whereNotNull('submitted_at');
                if (Schema::hasColumn('assigns_students', 'graded_at')) {
                    $q->orWhereNotNull('graded_at');
                }
            });
        } else {
            return false;
        }

        return $query->exists();
    }

    /**
     * @return array{path: string}
     */
    private function storeUpload(Assigns $assign, UploadedFile $file, string $kind): array
    {
        $assignId = (int) $assign->id;
        $ext = strtolower((string) $file->getClientOriginalExtension());
        $name = (string) Str::uuid();
        if ($ext !== '') {
            $name .= '.'.$ext;
        }

        $directory = $kind === AssignmentMaterial::KIND_VOICE
            ? "assignments/{$assignId}/materials/voice"
            : "assignments/{$assignId}/materials";

        $path = $file->storeAs($directory, $name, 'public');
        if (! is_string($path) || $path === '') {
            throw new InvalidArgumentException('upload_failed');
        }

        return ['path' => $path];
    }

    private function nextSortOrder(int $assignId): int
    {
        $max = AssignmentMaterial::query()
            ->where('assign_id', $assignId)
            ->max('sort_order');

        return $max === null ? 0 : ((int) $max + 1);
    }

    private function nullableLabel(?string $label): ?string
    {
        if ($label === null) {
            return null;
        }
        $trimmed = trim($label);

        return $trimmed === '' ? null : $trimmed;
    }
}
