<?php

namespace App\Services\Student;

use App\Models\Assigns;
use App\Models\AssignsStudents;
use App\Models\Lessons;
use App\Models\LessonsContents;
use App\Models\Student;
use App\Models\Subject;
use Illuminate\Support\Facades\DB;

class StudentSearchService
{
    /**
     * @return array<int, array<string, mixed>>
     */
    public function search(Student $student, string $query, int $limit = 20): array
    {
        $term = trim($query);
        if ($term === '' || mb_strlen($term) < 2) {
            return [];
        }

        $subjectIds = $this->subjectIdsForStudent($student);
        if ($subjectIds === []) {
            return [];
        }

        $like = '%'.$term.'%';
        $locale = app()->getLocale() === 'ar';
        $results = [];

        $subjects = Subject::query()
            ->whereIn('id', $subjectIds)
            ->where('status', 1)
            ->where(function ($q) use ($like) {
                $q->where('name', 'like', $like)
                    ->orWhere('name_ar', 'like', $like);
            })
            ->limit($limit)
            ->get(['id', 'name', 'name_ar']);

        foreach ($subjects as $subject) {
            $results[] = [
                'kind'  => 'subject',
                'id'    => (int) $subject->id,
                'title' => (string) ($locale ? ($subject->name_ar ?: $subject->name) : ($subject->name ?: $subject->name_ar)),
                'path'  => '/learn/'.$subject->id,
            ];
        }

        $assignIds = AssignsStudents::query()
            ->where('student_id', $student->id)
            ->where('status', 1)
            ->pluck('assign_id')
            ->all();

        if ($assignIds !== []) {
            $assigns = Assigns::query()
                ->whereIn('id', $assignIds)
                ->where('status', '1')
                ->where('assigned_name', 'like', $like)
                ->orderByDesc('created_at')
                ->limit($limit)
                ->get(['id', 'assigned_name', 'subject_id', 'type']);

            foreach ($assigns as $assign) {
                $sid = $assign->subject_id ? (int) $assign->subject_id : 0;
                $results[] = [
                    'kind'       => 'assignment',
                    'id'         => (int) $assign->id,
                    'title'      => (string) $assign->assigned_name,
                    'subject_id' => $sid ?: null,
                    'path'       => $assign->type === 'learning_activities'
                        ? '/todo/assign/'.$assign->id
                        : ($sid > 0 ? '/learn/'.$sid : '/todo'),
                ];
            }
        }

        $lessonIds = Lessons::query()
            ->whereIn('subject_id', $subjectIds)
            ->where('status', '1')
            ->pluck('id')
            ->all();

        if ($lessonIds !== []) {
            $nameCol = $locale ? 'name_ar' : 'name_en';
            $fallbackCol = $locale ? 'name_en' : 'name_ar';

            $contents = LessonsContents::query()
                ->whereIn('lesson_id', $lessonIds)
                ->where(function ($q) {
                    $q->where('status', 1)->orWhere('status', '1');
                })
                ->where(function ($q) use ($like, $nameCol, $fallbackCol) {
                    $q->where($nameCol, 'like', $like)
                        ->orWhere($fallbackCol, 'like', $like);
                })
                ->orderByDesc('created_at')
                ->limit($limit)
                ->get(['id', 'lesson_id', 'name_en', 'name_ar']);

            $lessonSubjectMap = Lessons::query()
                ->whereIn('id', $contents->pluck('lesson_id')->unique()->all())
                ->pluck('subject_id', 'id');

            foreach ($contents as $content) {
                $lessonId = (int) $content->lesson_id;
                $subjectId = (int) ($lessonSubjectMap[$lessonId] ?? 0);
                $title = (string) ($content->{$nameCol} ?? $content->{$fallbackCol} ?? '');
                $results[] = [
                    'kind'       => 'lesson_content',
                    'id'         => (int) $content->id,
                    'title'      => $title,
                    'subject_id' => $subjectId ?: null,
                    'lesson_id'  => $lessonId,
                    'path'       => $subjectId > 0
                        ? '/learn/'.$subjectId.'/details/'.$content->id
                        : null,
                ];
            }
        }

        return array_slice($results, 0, $limit);
    }

    /**
     * @return int[]
     */
    private function subjectIdsForStudent(Student $student): array
    {
        $subjectSchool = DB::table('subjects_schools')
            ->where('school_id', $student->school_id)
            ->where('status', '1')
            ->pluck('id')
            ->toArray();

        return DB::table('subjects_grades')
            ->whereIn('subjects_schools_id', $subjectSchool)
            ->where('grade_id', $student->grade_id)
            ->where('status', '1')
            ->pluck('subject_id')
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values()
            ->all();
    }
}
