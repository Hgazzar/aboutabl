<?php

namespace App\Services\Assignment;

use App\Contracts\Assignment\AssignmentTargetResolverInterface;
use App\Models\Student;

/**
 * F-041C — Student / class / grade targeting for assigns (same resolution order as legacy store).
 */
class AssignmentTargetingService implements AssignmentTargetResolverInterface
{
    /**
     * {@inheritdoc}
     *
     * Order preserved: student_id → class_id → grade_id.
     */
    public function resolveStudentIds(array $input): array
    {
        if (! empty($input['student_id'])) {
            return array_values(array_map('intval', (array) $input['student_id']));
        }

        if (! empty($input['class_id'])) {
            return Student::query()
                ->whereIn('class_id', (array) $input['class_id'])
                ->where('status', '1')
                ->pluck('id')
                ->map(fn ($id) => (int) $id)
                ->all();
        }

        if (! empty($input['grade_id'])) {
            return Student::query()
                ->whereIn('grade_id', (array) $input['grade_id'])
                ->where('status', '1')
                ->pluck('id')
                ->map(fn ($id) => (int) $id)
                ->all();
        }

        return [];
    }
}
