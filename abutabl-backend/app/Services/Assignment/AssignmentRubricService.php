<?php

namespace App\Services\Assignment;

use App\Models\AssignmentRubric;
use App\Models\AssignmentRubricCriterion;
use App\Models\Assigns;
use App\Models\AssignsStudents;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use InvalidArgumentException;

/**
 * Phase 3A — Assignment Rubric + possible_xp configuration.
 * Does not score students, award XP, or compute badges.
 */
class AssignmentRubricService
{
    public const MAX_POINTS = 4;

    /** Absolute tolerance for weight sum vs 100% (handles 33.33×3 style decimals). */
    public const WEIGHT_SUM_TOLERANCE = 0.02;

    public function isRubricLocked(int $assignId): bool
    {
        if (! Schema::hasColumn('assigns_students', 'submission_status')) {
            return false;
        }

        return AssignsStudents::query()
            ->where('assign_id', $assignId)
            ->where('status', 1)
            ->whereIn('submission_status', [
                AssignsStudents::SUBMISSION_SUBMITTED,
                AssignsStudents::SUBMISSION_GRADED,
            ])
            ->exists();
    }

    /**
     * @param  array{title?: string|null, criteria: array<int, array{label: string, weight: float|int|string}>}  $input
     * @return array<string, mixed>
     */
    public function upsertRubric(int $assignId, array $input): array
    {
        return DB::transaction(function () use ($assignId, $input) {
            /** @var Assigns|null $assign */
            $assign = Assigns::query()->where('id', $assignId)->lockForUpdate()->first();
            if (! $assign) {
                throw new InvalidArgumentException('assignment_not_found');
            }

            if ($this->isRubricLocked($assignId)) {
                throw new InvalidArgumentException('rubric_locked');
            }

            $criteria = $input['criteria'] ?? null;
            if (! is_array($criteria) || $criteria === []) {
                throw new InvalidArgumentException('criteria_required');
            }

            $normalized = $this->normalizeCriteria($criteria);
            $this->assertWeightsSumTo100($normalized);

            $title = isset($input['title']) ? trim((string) $input['title']) : '';
            if ($title === '') {
                $title = 'Assignment Rubric';
            }

            /** @var AssignmentRubric $rubric */
            $rubric = AssignmentRubric::query()->firstOrNew(['assign_id' => $assignId]);
            $rubric->title = $title;
            $rubric->save();

            AssignmentRubricCriterion::query()
                ->where('assignment_rubric_id', $rubric->id)
                ->delete();

            foreach ($normalized as $index => $row) {
                AssignmentRubricCriterion::query()->create([
                    'assignment_rubric_id' => $rubric->id,
                    'label' => $row['label'],
                    'weight' => $row['weight'],
                    'max_points' => self::MAX_POINTS,
                    'sort_order' => $index,
                ]);
            }

            return $this->payloadForAssign($assign->fresh(['rubric.criteria']));
        });
    }

    /**
     * @return array<string, mixed>|null
     */
    public function showForAssign(int $assignId): ?array
    {
        $assign = Assigns::query()->with(['rubric.criteria'])->find($assignId);
        if (! $assign) {
            throw new InvalidArgumentException('assignment_not_found');
        }

        return $this->payloadForAssign($assign);
    }

    /**
     * Student-safe rubric definition for Assignment Detail (Phase 4D).
     * Assignment-scoped; caller must enforce student ownership.
     * Does not include grades, drafts, or teacher-only lock metadata.
     *
     * @return array<string, mixed>|null
     */
    public function studentDefinitionForAssign(Assigns $assign): ?array
    {
        if (! $assign->relationLoaded('rubric')) {
            $assign->load(['rubric.criteria']);
        } elseif ($assign->rubric && ! $assign->rubric->relationLoaded('criteria')) {
            $assign->rubric->load('criteria');
        }

        $rubric = $assign->rubric;
        if (! $rubric) {
            return null;
        }

        $criteria = [];
        foreach ($rubric->criteria as $criterion) {
            $criteria[] = [
                'id' => (int) $criterion->id,
                'label' => (string) $criterion->label,
                'weight' => round((float) $criterion->weight, 4),
                'max_points' => (int) $criterion->max_points,
                'sort_order' => (int) $criterion->sort_order,
            ];
        }

        return [
            'id' => (int) $rubric->id,
            'title' => (string) $rubric->title,
            // SSOT: assigns.possible_xp (nullable; never invent a default).
            'points_possible' => $assign->possible_xp !== null ? (int) $assign->possible_xp : null,
            'criteria' => $criteria,
            'levels' => $this->localizedPerformanceLevels(),
        ];
    }

    /**
     * Generic 4→1 performance catalog (not overall assignment badges).
     *
     * @return array<int, array{points: int, key: string, label: string, descriptor: string|null}>
     */
    public function localizedPerformanceLevels(): array
    {
        $catalog = config('assignment_rubric.performance_levels', []);
        if (! is_array($catalog) || $catalog === []) {
            return [];
        }

        $levels = [];
        foreach ($catalog as $row) {
            if (! is_array($row)) {
                continue;
            }
            $points = (int) ($row['points'] ?? 0);
            $key = strtolower(trim((string) ($row['key'] ?? '')));
            if ($points < 1 || $key === '') {
                continue;
            }

            $label = (string) __('assignment_rubric.levels.'.$key.'.label');
            // Fall back to stable key if translation missing (avoid empty UI labels).
            if ($label === 'assignment_rubric.levels.'.$key.'.label') {
                $label = $key;
            }

            $descriptorKey = 'assignment_rubric.levels.'.$key.'.descriptor';
            $descriptorRaw = __('assignment_rubric.levels.'.$key.'.descriptor');
            $descriptor = null;
            if (is_string($descriptorRaw)
                && $descriptorRaw !== $descriptorKey
                && trim($descriptorRaw) !== ''
            ) {
                $descriptor = trim($descriptorRaw);
            }

            $levels[] = [
                'points' => $points,
                'key' => $key,
                'label' => $label,
                'descriptor' => $descriptor,
            ];
        }

        return $levels;
    }

    public function deleteRubric(int $assignId): void
    {
        DB::transaction(function () use ($assignId) {
            $assign = Assigns::query()->where('id', $assignId)->lockForUpdate()->first();
            if (! $assign) {
                throw new InvalidArgumentException('assignment_not_found');
            }

            if ($this->isRubricLocked($assignId)) {
                throw new InvalidArgumentException('rubric_locked');
            }

            $rubric = AssignmentRubric::query()->where('assign_id', $assignId)->first();
            if (! $rubric) {
                throw new InvalidArgumentException('rubric_not_found');
            }

            AssignmentRubricCriterion::query()
                ->where('assignment_rubric_id', $rubric->id)
                ->delete();
            $rubric->delete();
        });
    }

    /**
     * @return array{possible_xp: int|null}
     */
    public function updatePossibleXp(int $assignId, $possibleXp): array
    {
        return DB::transaction(function () use ($assignId, $possibleXp) {
            $assign = Assigns::query()->where('id', $assignId)->lockForUpdate()->first();
            if (! $assign) {
                throw new InvalidArgumentException('assignment_not_found');
            }

            if ($possibleXp === null || $possibleXp === '') {
                $assign->possible_xp = null;
            } else {
                if (! is_numeric($possibleXp) || (float) $possibleXp != (int) $possibleXp) {
                    throw new InvalidArgumentException('possible_xp_invalid');
                }
                $value = (int) $possibleXp;
                if ($value < 0) {
                    throw new InvalidArgumentException('possible_xp_negative');
                }
                $assign->possible_xp = $value;
            }

            $assign->save();

            return [
                'assign_id' => (int) $assign->id,
                'possible_xp' => $assign->possible_xp !== null ? (int) $assign->possible_xp : null,
            ];
        });
    }

    /**
     * @param  array<int, array{label: string, weight: float}>  $criteria
     */
    public function assertWeightsSumTo100(array $criteria): void
    {
        $sum = 0.0;
        foreach ($criteria as $row) {
            $sum += (float) $row['weight'];
        }

        if (abs($sum - 100.0) > self::WEIGHT_SUM_TOLERANCE) {
            throw new InvalidArgumentException('criteria_weights_must_sum_to_100');
        }
    }

    /**
     * @param  array<int, mixed>  $criteria
     * @return array<int, array{label: string, weight: float}>
     */
    private function normalizeCriteria(array $criteria): array
    {
        $out = [];
        foreach ($criteria as $row) {
            if (! is_array($row)) {
                throw new InvalidArgumentException('criteria_invalid');
            }
            $label = trim((string) ($row['label'] ?? ''));
            if ($label === '') {
                throw new InvalidArgumentException('criteria_label_required');
            }
            if (! isset($row['weight']) || ! is_numeric($row['weight'])) {
                throw new InvalidArgumentException('criteria_weight_invalid');
            }
            $weight = round((float) $row['weight'], 4);
            if ($weight <= 0) {
                throw new InvalidArgumentException('criteria_weight_invalid');
            }
            $out[] = [
                'label' => $label,
                'weight' => $weight,
            ];
        }

        if ($out === []) {
            throw new InvalidArgumentException('criteria_required');
        }

        return $out;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function payloadForAssign(Assigns $assign): ?array
    {
        $rubric = $assign->rubric;
        if (! $rubric) {
            return [
                'assign_id' => (int) $assign->id,
                'possible_xp' => $assign->possible_xp !== null ? (int) $assign->possible_xp : null,
                'rubric' => null,
                'rubric_locked' => $this->isRubricLocked((int) $assign->id),
            ];
        }

        $criteria = [];
        foreach ($rubric->criteria as $criterion) {
            $criteria[] = [
                'id' => (int) $criterion->id,
                'label' => (string) $criterion->label,
                'weight' => round((float) $criterion->weight, 4),
                'max_points' => (int) $criterion->max_points,
                'sort_order' => (int) $criterion->sort_order,
            ];
        }

        return [
            'assign_id' => (int) $assign->id,
            'possible_xp' => $assign->possible_xp !== null ? (int) $assign->possible_xp : null,
            'rubric' => [
                'id' => (int) $rubric->id,
                'title' => (string) $rubric->title,
                'criteria' => $criteria,
            ],
            'rubric_locked' => $this->isRubricLocked((int) $assign->id),
        ];
    }
}
