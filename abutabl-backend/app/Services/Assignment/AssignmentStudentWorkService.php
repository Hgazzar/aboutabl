<?php

namespace App\Services\Assignment;

use App\Models\AssignmentStudentWork;
use App\Models\Assigns;
use App\Models\AssignsStudents;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use InvalidArgumentException;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Optional Student My Work SSOT (assignment_student_works).
 * Independent of activities, parent submit, rubric, grading, and XP.
 */
class AssignmentStudentWorkService
{
    /** @var AssignmentParentSubmissionService */
    private $parentSubmissions;

    public function __construct(AssignmentParentSubmissionService $parentSubmissions)
    {
        $this->parentSubmissions = $parentSubmissions;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function listForStudent(int $assignId, int $studentId): array
    {
        return AssignmentStudentWork::query()
            ->where('assign_id', $assignId)
            ->where('student_id', $studentId)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->map(static function (AssignmentStudentWork $row) {
                return self::serializeRow($row);
            })
            ->values()
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function listForAssignStudent(int $assignId, int $assignStudentId): array
    {
        return AssignmentStudentWork::query()
            ->where('assign_id', $assignId)
            ->where('assign_student_id', $assignStudentId)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->map(static function (AssignmentStudentWork $row) {
                return self::serializeRow($row);
            })
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    public function create(
        Assigns $assign,
        AssignsStudents $assignStudent,
        string $kind,
        UploadedFile $file,
        ?int $durationMs = null
    ): array {
        $this->assertMutable($assignStudent);

        if ((int) $assignStudent->assign_id !== (int) $assign->id) {
            throw new InvalidArgumentException('forbidden');
        }

        if (! in_array($kind, AssignmentStudentWork::KINDS, true)) {
            throw new InvalidArgumentException('invalid_kind');
        }

        $stored = $this->storeUpload($assign, $assignStudent, $file, $kind);
        $row = AssignmentStudentWork::query()->create([
            'assign_id' => (int) $assign->id,
            'assign_student_id' => (int) $assignStudent->id,
            'student_id' => (int) $assignStudent->student_id,
            'kind' => $kind,
            'original_filename' => $file->getClientOriginalName(),
            'storage_path' => $stored['path'],
            'mime_type' => $file->getClientMimeType() ?: $file->getMimeType(),
            'size_bytes' => $file->getSize() !== false ? (int) $file->getSize() : null,
            'duration_ms' => $kind === AssignmentStudentWork::KIND_VOICE
                && $durationMs !== null
                && $durationMs > 0
                    ? $durationMs
                    : null,
            'sort_order' => $this->nextSortOrder((int) $assignStudent->id),
        ]);

        return self::serializeRow($row);
    }

    public function delete(Assigns $assign, AssignsStudents $assignStudent, int $workId): void
    {
        $this->assertMutable($assignStudent);

        $row = AssignmentStudentWork::query()
            ->where('id', $workId)
            ->where('assign_id', (int) $assign->id)
            ->where('assign_student_id', (int) $assignStudent->id)
            ->where('student_id', (int) $assignStudent->student_id)
            ->first();

        if (! $row) {
            throw new InvalidArgumentException('not_found');
        }

        $path = (string) $row->storage_path;
        $row->delete();

        if ($path !== '' && Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }
    }

    /**
     * Authorized stream for a work file owned by the student membership.
     */
    public function downloadForStudent(
        Assigns $assign,
        AssignsStudents $assignStudent,
        int $workId
    ): StreamedResponse {
        $row = AssignmentStudentWork::query()
            ->where('id', $workId)
            ->where('assign_id', (int) $assign->id)
            ->where('assign_student_id', (int) $assignStudent->id)
            ->where('student_id', (int) $assignStudent->student_id)
            ->first();

        if (! $row) {
            throw new InvalidArgumentException('not_found');
        }

        return $this->streamRow($row);
    }

    /**
     * Teacher/Admin download after assignment authorization (caller enforces policy).
     */
    public function downloadForTeacher(Assigns $assign, int $workId): StreamedResponse
    {
        $row = AssignmentStudentWork::query()
            ->where('id', $workId)
            ->where('assign_id', (int) $assign->id)
            ->first();

        if (! $row) {
            throw new InvalidArgumentException('not_found');
        }

        return $this->streamRow($row);
    }

    /**
     * Resolve membership for the authenticated student on this assign.
     *
     * @throws InvalidArgumentException
     */
    public function requireMembership(int $assignId, int $studentId): AssignsStudents
    {
        $row = AssignsStudents::query()
            ->where('assign_id', $assignId)
            ->where('student_id', $studentId)
            ->first();

        if (! $row) {
            throw new InvalidArgumentException('forbidden');
        }

        return $row;
    }

    public function isLocked(AssignsStudents $assignStudent): bool
    {
        $status = $this->parentSubmissions->resolveParentStatus($assignStudent);

        return $status === AssignmentParentSubmissionService::STATUS_SUBMITTED
            || $status === AssignmentParentSubmissionService::STATUS_GRADED;
    }

    /**
     * @throws InvalidArgumentException my_work_locked
     */
    public function assertMutable(AssignsStudents $assignStudent): void
    {
        if ($this->isLocked($assignStudent)) {
            throw new InvalidArgumentException('my_work_locked');
        }
    }

    /**
     * @return array<string, mixed>
     */
    public static function serializeRow(AssignmentStudentWork $row): array
    {
        $url = null;
        if ($row->storage_path) {
            $url = Storage::disk('public')->url((string) $row->storage_path);
        }

        return [
            'id' => (int) $row->id,
            'assign_id' => (int) $row->assign_id,
            'assign_student_id' => (int) $row->assign_student_id,
            'student_id' => (int) $row->student_id,
            'kind' => (string) $row->kind,
            'original_filename' => $row->original_filename !== null
                ? (string) $row->original_filename
                : null,
            'url' => $url,
            'mime_type' => $row->mime_type !== null ? (string) $row->mime_type : null,
            'size_bytes' => $row->size_bytes !== null ? (int) $row->size_bytes : null,
            'duration_ms' => $row->duration_ms !== null ? (int) $row->duration_ms : null,
            'sort_order' => (int) $row->sort_order,
        ];
    }

    /**
     * @return array{path: string}
     */
    private function storeUpload(
        Assigns $assign,
        AssignsStudents $assignStudent,
        UploadedFile $file,
        string $kind
    ): array {
        $assignId = (int) $assign->id;
        $studentId = (int) $assignStudent->student_id;
        $ext = strtolower((string) $file->getClientOriginalExtension());
        $name = (string) Str::uuid();
        if ($ext !== '') {
            $name .= '.'.$ext;
        }

        $directory = $kind === AssignmentStudentWork::KIND_VOICE
            ? "assignments/{$assignId}/students/{$studentId}/work/voice"
            : "assignments/{$assignId}/students/{$studentId}/work";

        $path = $file->storeAs($directory, $name, 'public');
        if (! is_string($path) || $path === '') {
            throw new InvalidArgumentException('upload_failed');
        }

        return ['path' => $path];
    }

    private function nextSortOrder(int $assignStudentId): int
    {
        $max = AssignmentStudentWork::query()
            ->where('assign_student_id', $assignStudentId)
            ->max('sort_order');

        return $max === null ? 0 : ((int) $max + 1);
    }

    private function streamRow(AssignmentStudentWork $row): StreamedResponse
    {
        $path = (string) $row->storage_path;
        if ($path === '' || ! Storage::disk('public')->exists($path)) {
            throw new InvalidArgumentException('not_found');
        }

        // Refuse path traversal / absolute paths — only relative assignment work paths.
        if (Str::contains($path, '..') || Str::startsWith($path, '/') || ! Str::startsWith($path, 'assignments/')) {
            throw new InvalidArgumentException('forbidden');
        }

        $filename = $row->original_filename ?: basename($path);
        $mime = $row->mime_type ?: 'application/octet-stream';

        return Storage::disk('public')->response($path, $filename, [
            'Content-Type' => $mime,
            'Content-Disposition' => 'inline; filename="'.addslashes($filename).'"',
        ]);
    }
}
