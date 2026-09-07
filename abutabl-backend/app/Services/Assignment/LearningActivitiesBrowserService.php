<?php

namespace App\Services\Assignment;

use App\Support\Assignment\LearningActivityMap;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

/**
 * Browse existing content hierarchy for Learning Activities picker.
 * Book = Subject → Section (ebooks/games/worksheets/quizzes) → Activities.
 * No new content hierarchy.
 */
class LearningActivitiesBrowserService
{
    /**
     * Subjects (Books) available for the school subject IDs.
     *
     * @param  array<int, int>  $subjectIds
     * @return array<int, array<string, mixed>>
     */
    public function books(array $subjectIds): array
    {
        if ($subjectIds === []) {
            return [];
        }

        return DB::table('subjects')
            ->whereIn('id', $subjectIds)
            ->orderBy('name_en')
            ->get(['id', 'name_en', 'name_ar'])
            ->map(function ($row) {
                return [
                    'id' => (int) $row->id,
                    'name' => (string) ($row->name_en ?: $row->name_ar ?: ('Subject #'.$row->id)),
                    'name_ar' => (string) ($row->name_ar ?? ''),
                    'name_en' => (string) ($row->name_en ?? ''),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * Section categories under a book (subject).
     *
     * @return array<int, array<string, mixed>>
     */
    public function sections(int $subjectId, array $subjectIds): array
    {
        $this->assertSubjectAllowed($subjectId, $subjectIds);

        return array_map(function (array $section) use ($subjectId) {
            return [
                'key' => $section['key'],
                'activity_type' => $section['activity_type'],
                'label' => $section['label'],
                'subject_id' => $subjectId,
                'count' => $this->countActivities($subjectId, $section['activity_type']),
            ];
        }, LearningActivityMap::sections());
    }

    /**
     * Activities in a section under a subject.
     *
     * @return array<int, array<string, mixed>>
     */
    public function activities(int $subjectId, string $sectionKey, array $subjectIds): array
    {
        $this->assertSubjectAllowed($subjectId, $subjectIds);

        $section = collect(LearningActivityMap::sections())
            ->firstWhere('key', $sectionKey);

        if ($section === null) {
            throw new InvalidArgumentException('invalid_section');
        }

        $activityType = $section['activity_type'];

        return $this->listActivities($subjectId, $activityType);
    }

    /**
     * Resolve and validate selected activities for store.
     *
     * @param  array<int, array<string, mixed>>  $rawActivities
     * @param  array<int, int>  $subjectIds
     * @return array<int, array<string, mixed>>
     */
    public function resolveForStore(array $rawActivities, array $subjectIds, ?int $preferredSubjectId = null): array
    {
        if (count($rawActivities) < 1) {
            throw new InvalidArgumentException('activities_required');
        }

        if (count($rawActivities) > LearningActivityMap::MAX_PER_ASSIGN) {
            throw new InvalidArgumentException('activities_max_exceeded');
        }

        $resolved = [];
        $seen = [];
        $subjectId = null;

        foreach (array_values($rawActivities) as $index => $row) {
            $type = (string) ($row['activity_type'] ?? '');
            $activityId = (int) ($row['activity_id'] ?? 0);

            if (! LearningActivityMap::isValidType($type) || $activityId <= 0) {
                throw new InvalidArgumentException('invalid_activity');
            }

            $key = $type.':'.$activityId;
            if (isset($seen[$key])) {
                throw new InvalidArgumentException('duplicate_activity');
            }
            $seen[$key] = true;

            $source = $this->findActivityRow($type, $activityId);
            if ($source === null) {
                throw new InvalidArgumentException('activity_not_found');
            }

            $rowSubjectId = (int) ($source->subject_id ?? 0);
            if ($rowSubjectId <= 0 || ! in_array($rowSubjectId, $subjectIds, true)) {
                throw new InvalidArgumentException('activity_not_in_scope');
            }

            if ($preferredSubjectId !== null && $preferredSubjectId > 0 && $rowSubjectId !== $preferredSubjectId) {
                throw new InvalidArgumentException('activity_subject_mismatch');
            }

            if ($subjectId === null) {
                $subjectId = $rowSubjectId;
            } elseif ($subjectId !== $rowSubjectId) {
                throw new InvalidArgumentException('mixed_subjects_not_allowed');
            }

            $resolved[] = [
                'activity_type' => $type,
                'activity_id' => $activityId,
                'source_table' => LearningActivityMap::sourceTable($type),
                'grading_mode' => LearningActivityMap::gradingMode($type),
                'title_snapshot' => $this->titleFromRow($type, $source),
                'sort_order' => $index + 1,
                'subject_id' => $rowSubjectId,
            ];
        }

        return $resolved;
    }

    private function assertSubjectAllowed(int $subjectId, array $subjectIds): void
    {
        if ($subjectId <= 0 || ! in_array($subjectId, $subjectIds, true)) {
            throw new InvalidArgumentException('subject_not_allowed');
        }
    }

    private function countActivities(int $subjectId, string $activityType): int
    {
        return count($this->listActivities($subjectId, $activityType));
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function listActivities(int $subjectId, string $activityType): array
    {
        $table = LearningActivityMap::sourceTable($activityType);
        $query = DB::table($table)->where('subject_id', $subjectId);

        if ($activityType === LearningActivityMap::TYPE_EBOOK) {
            $query->whereIn('type', LearningActivityMap::EBOOK_CONTENT_TYPES);
        }

        if ($this->tableHasStatus($table)) {
            $query->where(function ($q) {
                $q->where('status', 1)->orWhere('status', '1');
            });
        }

        $nameColumn = $activityType === LearningActivityMap::TYPE_QUIZ ? 'title_ar' : 'name_ar';
        $enColumn = $activityType === LearningActivityMap::TYPE_QUIZ ? 'title_en' : 'name_en';

        $select = ['id', 'subject_id', $nameColumn.' as name_ar'];
        if ($this->tableHasColumn($table, $enColumn)) {
            $select[] = $enColumn.' as name_en';
        }
        if ($activityType === LearningActivityMap::TYPE_EBOOK && $this->tableHasColumn($table, 'type')) {
            $select[] = 'type';
        }

        return $query
            ->orderBy('id')
            ->get($select)
            ->map(function ($row) use ($activityType) {
                $title = $this->titleFromRow($activityType, $row);

                return [
                    'activity_type' => $activityType,
                    'activity_id' => (int) $row->id,
                    'source_table' => LearningActivityMap::sourceTable($activityType),
                    'grading_mode' => LearningActivityMap::gradingMode($activityType),
                    'title' => $title,
                    'subject_id' => (int) $row->subject_id,
                    'content_type' => isset($row->type) ? (string) $row->type : null,
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @return object|null
     */
    private function findActivityRow(string $activityType, int $activityId)
    {
        $table = LearningActivityMap::sourceTable($activityType);
        $query = DB::table($table)->where('id', $activityId);

        if ($activityType === LearningActivityMap::TYPE_EBOOK) {
            $query->whereIn('type', LearningActivityMap::EBOOK_CONTENT_TYPES);
        }

        return $query->first();
    }

    private function titleFromRow(string $activityType, object $row): string
    {
        if ($activityType === LearningActivityMap::TYPE_QUIZ) {
            $title = (string) ($row->title_en ?? $row->title_ar ?? $row->name_en ?? $row->name_ar ?? '');
        } else {
            $title = (string) ($row->name_en ?? $row->name_ar ?? $row->title_en ?? $row->title_ar ?? '');
        }

        if ($title === '') {
            $title = ucfirst($activityType).' #'.((int) ($row->id ?? 0));
        }

        return $title;
    }

    private function tableHasStatus(string $table): bool
    {
        return $this->tableHasColumn($table, 'status');
    }

    private function tableHasColumn(string $table, string $column): bool
    {
        static $cache = [];
        $key = $table.'.'.$column;
        if (! array_key_exists($key, $cache)) {
            $cache[$key] = \Illuminate\Support\Facades\Schema::hasColumn($table, $column);
        }

        return $cache[$key];
    }
}
