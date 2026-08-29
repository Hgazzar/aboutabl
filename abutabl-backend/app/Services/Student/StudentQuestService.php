<?php

namespace App\Services\Student;

use App\Models\Lessons;
use App\Models\StudentLessonCompletion;
use App\Models\StudentQuest;
use App\Models\Subject;
use App\Models\Units;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Schema;

/**
 * Syncs unit-lesson quests from real lesson completion data (not assignments).
 */
class StudentQuestService
{
    private const MAX_SYNC_DEPTH = 8;

    /**
     * @param  int[]  $subjectIds
     * @return array<string, mixed>
     */
    public function buildDashboardPayload(int $studentId, ?int $schoolId, array $subjectIds): array
    {
        try {
            if (! Schema::hasTable('student_quests')) {
                return $this->emptyPayload();
            }

            return $this->buildDashboardPayloadInternal($studentId, $schoolId, $subjectIds);
        } catch (\Throwable $e) {
            report($e);

            return $this->emptyPayload();
        }
    }

    /**
     * @param  int[]  $subjectIds
     * @return array<string, mixed>
     */
    private function buildDashboardPayloadInternal(
        int $studentId,
        ?int $schoolId,
        array $subjectIds,
        int $depth = 0
    ): array {
        if ($depth >= self::MAX_SYNC_DEPTH) {
            return $this->emptyPayload();
        }

        if ($subjectIds === []) {
            return $this->emptyPayload();
        }

        $candidate = $this->resolvePrimaryUnitQuest($studentId, $subjectIds);
        if ($candidate === null) {
            $this->completeStaleActiveQuests($studentId);

            return $this->emptyPayload();
        }

        $quest = $this->upsertQuest($studentId, $schoolId, $candidate);
        if ($quest->status === StudentQuest::STATUS_COMPLETED) {
            $this->completeStaleActiveQuests($studentId);

            return $this->buildDashboardPayloadInternal($studentId, $schoolId, $subjectIds, $depth + 1);
        }

        $this->completeStaleActiveQuests($studentId, (int) $quest->id);

        $limit = max(1, (int) config('student_quests.dashboard_quest_limit', 1));
        $items = [$this->mapQuestRow($quest)];

        return [
            'available' => true,
            'items' => array_slice($items, 0, $limit),
            'limit' => $limit,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function emptyPayload(): array
    {
        return [
            'available' => false,
            'items' => [],
            'limit' => max(1, (int) config('student_quests.dashboard_quest_limit', 1)),
        ];
    }

    /**
     * @param  int[]  $subjectIds
     */
    public function buildCtaPath(int $subjectId, int $unitId): string
    {
        return sprintf('/learn/%d?focusUnit=%d', $subjectId, $unitId);
    }

    /**
     * @param  int[]  $subjectIds
     * @return array<string, mixed>|null
     */
    private function resolvePrimaryUnitQuest(int $studentId, array $subjectIds): ?array
    {
        $localeAr = app()->getLocale() === 'ar';

        foreach ($subjectIds as $subjectId) {
            $subjectId = (int) $subjectId;
            $subject = Subject::query()->find($subjectId);
            if (! $subject) {
                continue;
            }

            $subjectName = (string) ($localeAr
                ? ($subject->name_ar ?: $subject->name)
                : ($subject->name ?: $subject->name_ar));

            $units = Units::query()
                ->where('subject_id', $subjectId)
                ->where(function ($q) {
                    $q->where('status', 1)->orWhere('status', '1');
                })
                ->orderBy('id')
                ->get(['id', 'name', 'name_ar']);

            foreach ($units as $unit) {
                $progress = $this->unitLessonProgress($studentId, $subjectId, (int) $unit->id);
                if ($progress['target'] <= 0) {
                    continue;
                }
                if ($progress['current'] >= $progress['target']) {
                    continue;
                }

                $unitLabel = (string) ($localeAr
                    ? ($unit->name_ar ?: $unit->name)
                    : ($unit->name ?: $unit->name_ar));

                return [
                    'quest_key' => sprintf('unit_lessons:%d:%d', $subjectId, (int) $unit->id),
                    'quest_type' => StudentQuest::TYPE_UNIT_LESSONS,
                    'subject_id' => $subjectId,
                    'unit_id' => (int) $unit->id,
                    'unit_label' => $unitLabel,
                    'subject_name' => $subjectName,
                    'progress_current' => $progress['current'],
                    'progress_target' => $progress['target'],
                    'cta_path' => $this->buildCtaPath($subjectId, (int) $unit->id),
                ];
            }
        }

        return null;
    }

    /**
     * @return array{current: int, target: int}
     */
    private function unitLessonProgress(int $studentId, int $subjectId, int $unitId): array
    {
        $lessonIds = Lessons::query()
            ->where('subject_id', $subjectId)
            ->where('unit_id', $unitId)
            ->where(function ($q) {
                $q->where('status', 1)->orWhere('status', '1');
            })
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();

        $target = count($lessonIds);
        if ($target === 0) {
            return ['current' => 0, 'target' => 0];
        }

        $current = (int) StudentLessonCompletion::query()
            ->where('student_id', $studentId)
            ->where('subject_id', $subjectId)
            ->whereIn('lesson_id', $lessonIds)
            ->distinct()
            ->count('lesson_id');

        if ($current > $target) {
            $current = $target;
        }

        return ['current' => $current, 'target' => $target];
    }

    /**
     * @param  array<string, mixed>  $candidate
     */
    private function upsertQuest(int $studentId, ?int $schoolId, array $candidate): StudentQuest
    {
        $isComplete = $candidate['progress_current'] >= $candidate['progress_target'];
        $status = $isComplete ? StudentQuest::STATUS_COMPLETED : StudentQuest::STATUS_ACTIVE;

        /** @var StudentQuest $quest */
        $quest = StudentQuest::query()->updateOrCreate(
            [
                'student_id' => $studentId,
                'quest_key'  => (string) $candidate['quest_key'],
            ],
            [
                'school_id'        => $schoolId,
                'quest_type'       => (string) $candidate['quest_type'],
                'subject_id'       => (int) $candidate['subject_id'],
                'unit_id'          => (int) $candidate['unit_id'],
                'unit_label'       => (string) $candidate['unit_label'],
                'subject_name'     => (string) $candidate['subject_name'],
                'reward_label'     => null,
                'progress_current' => (int) $candidate['progress_current'],
                'progress_target'  => (int) $candidate['progress_target'],
                'status'           => $status,
                'cta_path'         => (string) $candidate['cta_path'],
                'completed_at'     => $isComplete ? Carbon::now() : null,
            ]
        );

        return $quest->refresh();
    }

    private function completeStaleActiveQuests(int $studentId, ?int $exceptQuestId = null): void
    {
        $query = StudentQuest::query()
            ->where('student_id', $studentId)
            ->where('status', StudentQuest::STATUS_ACTIVE);

        if ($exceptQuestId !== null) {
            $query->where('id', '!=', $exceptQuestId);
        }

        $query->update([
            'status' => StudentQuest::STATUS_COMPLETED,
            'completed_at' => Carbon::now(),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function mapQuestRow(StudentQuest $quest): array
    {
        $target = max(1, (int) $quest->progress_target);
        $current = min((int) $quest->progress_current, $target);
        $percent = (int) round(($current / $target) * 100);

        return [
            'id'               => (int) $quest->id,
            'quest_type'       => (string) $quest->quest_type,
            'unit_label'       => (string) $quest->unit_label,
            'subject_name'     => (string) $quest->subject_name,
            'subject_id'       => (int) $quest->subject_id,
            'unit_id'          => (int) $quest->unit_id,
            'reward_label'     => null,
            'reward_type'      => 'xp',
            'progress_current' => $current,
            'progress_target'  => $target,
            'progress_percent' => $percent,
            'status'           => (string) $quest->status,
            'cta_path'         => $quest->cta_path,
            'completed_at'     => $quest->completed_at?->toIso8601String(),
        ];
    }
}
