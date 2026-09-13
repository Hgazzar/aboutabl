<?php

namespace App\Services\Assignment;

use App\Models\AssignActivity;
use App\Models\Assigns;
use App\Support\Assignment\LearningActivityMap;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Resolves Student Assignment Header curriculum context from authoritative FKs only.
 *
 * - Subject: assigns.subject_id → subjects
 * - Lesson/Unit: only when activity tables expose real FKs (ebook / quiz when set)
 * - Game / worksheet: no Lesson/Unit (omit)
 * - Mixed or missing activity contexts: omit Lesson/Unit line
 */
class AssignmentCurriculumContextResolver
{
    /**
     * @return array{
     *   subject_id: int,
     *   subject_name: string|null,
     *   unit_id: int|null,
     *   unit_name: string|null,
     *   lesson_id: int|null,
     *   lesson_name: string|null,
     *   context_label: string|null
     * }
     */
    public function forAssign(Assigns $assign): array
    {
        $subjectId = (int) ($assign->subject_id ?? 0);
        $subjectName = $subjectId > 0 ? $this->subjectName($subjectId) : null;

        $activities = $assign->relationLoaded('activities')
            ? $assign->activities
            : $assign->activities()->orderBy('sort_order')->orderBy('id')->get();

        $context = $this->commonActivityContext($activities) ?? [
            'unit_id' => null,
            'unit_name' => null,
            'lesson_id' => null,
            'lesson_name' => null,
            'context_label' => null,
        ];

        return [
            'subject_id' => $subjectId,
            'subject_name' => $subjectName,
            'unit_id' => $context['unit_id'],
            'unit_name' => $context['unit_name'],
            'lesson_id' => $context['lesson_id'],
            'lesson_name' => $context['lesson_name'],
            'context_label' => $context['context_label'],
        ];
    }

    /**
     * @param  Collection<int, AssignActivity>|iterable<AssignActivity>  $activities
     * @return array{
     *   unit_id: int|null,
     *   unit_name: string|null,
     *   lesson_id: int|null,
     *   lesson_name: string|null,
     *   context_label: string|null
     * }|null
     */
    public function commonActivityContext(iterable $activities): ?array
    {
        $resolved = [];
        foreach ($activities as $activity) {
            if (! $activity instanceof AssignActivity) {
                continue;
            }
            $ctx = $this->resolveActivityContext(
                (string) $activity->activity_type,
                (int) $activity->activity_id
            );
            if ($ctx === null) {
                // Missing context for any activity → hide Lesson/Unit line.
                return null;
            }
            $resolved[] = $ctx;
        }

        if ($resolved === []) {
            return null;
        }

        $firstKey = $this->contextKey($resolved[0]);
        foreach ($resolved as $ctx) {
            if ($this->contextKey($ctx) !== $firstKey) {
                // Different Lesson/Unit across activities → hide.
                return null;
            }
        }

        return $resolved[0];
    }

    /**
     * @return array{
     *   unit_id: int|null,
     *   unit_name: string|null,
     *   lesson_id: int|null,
     *   lesson_name: string|null,
     *   context_label: string|null
     * }|null
     */
    public function resolveActivityContext(string $activityType, int $activityId): ?array
    {
        if ($activityId <= 0) {
            return null;
        }

        if ($activityType === LearningActivityMap::TYPE_EBOOK) {
            return $this->resolveEbookContext($activityId);
        }

        if ($activityType === LearningActivityMap::TYPE_QUIZ) {
            return $this->resolveQuizContext($activityId);
        }

        // Game / worksheet: no authoritative Lesson/Unit FK in current architecture.
        return null;
    }

    public function subjectName(int $subjectId): ?string
    {
        if ($subjectId <= 0 || ! Schema::hasTable('subjects')) {
            return null;
        }

        $row = DB::table('subjects')->where('id', $subjectId)->first();
        if (! $row) {
            return null;
        }

        // subjects.name / subjects.name_ar (authoritative — never assigned_name).
        $ar = trim((string) ($row->name_ar ?? ''));
        $en = trim((string) ($row->name ?? ''));
        if (app()->getLocale() === 'ar') {
            return $ar !== '' ? $ar : ($en !== '' ? $en : null);
        }

        return $en !== '' ? $en : ($ar !== '' ? $ar : null);
    }

    /**
     * @return array{
     *   unit_id: int|null,
     *   unit_name: string|null,
     *   lesson_id: int|null,
     *   lesson_name: string|null,
     *   context_label: string|null
     * }|null
     */
    private function resolveEbookContext(int $contentId): ?array
    {
        if (! Schema::hasTable('lessons_contents')) {
            return null;
        }

        $row = DB::table('lessons_contents')->where('id', $contentId)->first();
        if (! $row) {
            return null;
        }

        $lessonId = (int) ($row->lesson_id ?? 0);
        $unitId = (int) ($row->unit_id ?? 0);

        $lessonName = null;
        if ($lessonId > 0 && Schema::hasTable('lessons')) {
            $lesson = DB::table('lessons')->where('id', $lessonId)->first();
            if ($lesson) {
                $lessonName = $this->pickLocalizedName(
                    (string) ($lesson->name_en ?? ''),
                    (string) ($lesson->name_ar ?? '')
                );
                if ($unitId <= 0) {
                    $unitId = (int) ($lesson->unit_id ?? 0);
                }
            }
        }

        $unitName = null;
        if ($unitId > 0 && Schema::hasTable('units')) {
            $unit = DB::table('units')->where('id', $unitId)->first();
            if ($unit) {
                $unitName = $this->pickLocalizedName(
                    (string) ($unit->name ?? ''),
                    (string) ($unit->name_ar ?? '')
                );
            }
        }

        $label = $lessonName ?: $unitName;
        if ($label === null || $label === '') {
            return null;
        }

        return [
            'unit_id' => $unitId > 0 ? $unitId : null,
            'unit_name' => $unitName,
            'lesson_id' => $lessonId > 0 ? $lessonId : null,
            'lesson_name' => $lessonName,
            'context_label' => $label,
        ];
    }

    /**
     * @return array{
     *   unit_id: int|null,
     *   unit_name: string|null,
     *   lesson_id: int|null,
     *   lesson_name: string|null,
     *   context_label: string|null
     * }|null
     */
    private function resolveQuizContext(int $quizId): ?array
    {
        if (! Schema::hasTable('quizes')) {
            return null;
        }

        $row = DB::table('quizes')->where('id', $quizId)->first();
        if (! $row) {
            return null;
        }

        $lessonId = (int) ($row->lesson_id ?? 0);
        $unitId = (int) ($row->unit_id ?? 0);

        $lessonName = null;
        if ($lessonId > 0 && Schema::hasTable('lessons')) {
            $lesson = DB::table('lessons')->where('id', $lessonId)->first();
            if ($lesson) {
                $lessonName = $this->pickLocalizedName(
                    (string) ($lesson->name_en ?? ''),
                    (string) ($lesson->name_ar ?? '')
                );
            }
        }

        $unitName = null;
        if ($unitId > 0 && Schema::hasTable('units')) {
            $unit = DB::table('units')->where('id', $unitId)->first();
            if ($unit) {
                $unitName = $this->pickLocalizedName(
                    (string) ($unit->name ?? ''),
                    (string) ($unit->name_ar ?? '')
                );
            }
        }

        $label = $lessonName ?: $unitName;
        if ($label === null || $label === '') {
            // Subject-level quiz with null unit/lesson → omit.
            return null;
        }

        return [
            'unit_id' => $unitId > 0 ? $unitId : null,
            'unit_name' => $unitName,
            'lesson_id' => $lessonId > 0 ? $lessonId : null,
            'lesson_name' => $lessonName,
            'context_label' => $label,
        ];
    }

    private function pickLocalizedName(string $en, string $ar): ?string
    {
        $en = trim($en);
        $ar = trim($ar);
        if (app()->getLocale() === 'ar' && $ar !== '') {
            return $ar;
        }
        if ($en !== '') {
            return $en;
        }

        return $ar !== '' ? $ar : null;
    }

    /**
     * @param  array{
     *   unit_id: int|null,
     *   lesson_id: int|null,
     *   context_label: string|null
     * }  $ctx
     */
    private function contextKey(array $ctx): string
    {
        return ((int) ($ctx['lesson_id'] ?? 0)).':'.((int) ($ctx['unit_id'] ?? 0)).':'.(string) ($ctx['context_label'] ?? '');
    }
}
