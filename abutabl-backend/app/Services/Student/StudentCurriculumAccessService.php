<?php

namespace App\Services\Student;

use App\Models\Student;
use App\Models\subjectsSchools;
use Illuminate\Support\Facades\DB;

/**
 * Free Curriculum Learning — enrollment authorization.
 *
 * Authenticated student → school_id + grade_id → active subjects_schools
 * → active subjects_grades mapping for subject_id.
 *
 * Identical rule to LessonContentCompletionRuntimeService::studentCanAccessSubject().
 * Assignments are not part of this gate.
 */
class StudentCurriculumAccessService
{
    /**
     * Whether the student may view/learn an enrolled subject curriculum.
     */
    public function studentCanAccessSubject(Student $student, int $subjectId): bool
    {
        if ($subjectId <= 0) {
            return false;
        }

        $subjectSchoolIds = subjectsSchools::query()
            ->where('school_id', $student->school_id)
            ->where('status', '1')
            ->pluck('id')
            ->all();

        if ($subjectSchoolIds === []) {
            return false;
        }

        return DB::table('subjects_grades')
            ->whereIn('subjects_schools_id', $subjectSchoolIds)
            ->where('grade_id', $student->grade_id)
            ->where('subject_id', $subjectId)
            ->where('status', '1')
            ->exists();
    }
}
