<?php

namespace App\Services\Assignment;

use App\Models\Assigns;
use App\Models\AssignsStudents;
use App\Models\Notification;
use App\Services\PerformanceAnalytics\PerformanceSnapshotSource;
use App\Services\PerformanceAnalytics\PerformanceSnapshotTrigger;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

/**
 * F-041C — Sole write path for Assigns / AssignsStudents lifecycle.
 *
 * Preserves legacy store/destroy/markOpened semantics including Notification::create
 * (no AssignmentNotificationService in foundation).
 */
class AssignmentLifecycleService
{
    /** @var AssignmentPermissionService */
    private $permissions;

    /** @var PerformanceSnapshotTrigger */
    private $snapshotTrigger;

    public function __construct(
        AssignmentPermissionService $permissions,
        PerformanceSnapshotTrigger $snapshotTrigger
    ) {
        $this->permissions = $permissions;
        $this->snapshotTrigger = $snapshotTrigger;
    }

    /**
     * Create assign + student rows + notifications + performance snapshot.
     *
     * @param  array<string, mixed>  $input
     * @param  array<int, int>  $studentIds
     * @return array{assign: Assigns, student_ids: array<int, int>}
     */
    public function create(array $input, array $studentIds, int $authUserId): array
    {
        $type = (string) $input['type'];
        $typeId = (int) $input['type_id'];
        $schoolId = (int) $input['school_id'];
        $dueAtInput = $input['due_at'] ?? $input['due_date'] ?? null;

        if (empty($dueAtInput)) {
            throw new InvalidArgumentException('due_at_required');
        }

        $dueAt = Carbon::parse($dueAtInput);

        $columns = [
            'subjects' => 'name_ar',
            'units' => 'name_ar',
            'lessons' => 'name_ar',
            'lessons_contents' => 'name_ar',
            'quizes' => 'title_ar',
            'games' => 'name_ar',
        ];

        $paths = [
            'subjects' => url('/api/subject/show/'.$typeId),
            'units' => url('/api/units/show/'.$typeId),
            'lessons' => url('/api/lessons/show/'.$typeId),
            'lessons_contents' => url('/api/contents/show/'.$typeId),
            'quizes' => url('/api/quizes/show/'.$typeId),
            'games' => url('/api/games/show/'.$typeId),
        ];

        $module = DB::table($type)->where('id', $typeId)
            ->select('id', $columns[$type].' as name', $type === 'subjects' ? 'id' : 'subject_id')
            ->first();

        if (! $module) {
            throw new InvalidArgumentException('module_not_found');
        }

        $createdBy = $this->permissions->resolveCreatedBy(
            isset($input['teacher_id']) ? (int) $input['teacher_id'] : null,
            $authUserId
        );

        $subjectId = $type === 'subjects' ? (int) $module->id : (int) $module->subject_id;

        DB::beginTransaction();

        try {
            $assign = Assigns::create([
                'type' => $type,
                'type_id' => $typeId,
                'assigned_name' => $module->name,
                'assigned_path' => $paths[$type],
                'school_id' => $schoolId,
                'status' => 1,
                'created_by' => $createdBy,
                'subject_id' => $subjectId,
                'due_at' => $dueAt,
                'possible_xp' => $this->normalizePossibleXp($input['possible_xp'] ?? null),
            ]);

            // Preserve legacy delete filter exactly (uses request student_id array, not loop $student).
            $legacyStudentIdFilter = $input['student_id'] ?? null;

            foreach ($studentIds as $student) {
                AssignsStudents::where([
                    ['type', $type],
                    ['type_id', $typeId],
                    ['student_id', $legacyStudentIdFilter],
                ])->delete();

                AssignsStudents::create([
                    'assign_id' => $assign->id,
                    'type' => $type,
                    'type_id' => $typeId,
                    'student_id' => $student,
                    'school_id' => $schoolId,
                    'status' => 1,
                    'created_by' => $createdBy,
                ]);

                // Existing notification path — do not abstract in foundation (F-041B refinement).
                Notification::create([
                    'title' => $module->name,
                    'description' => 'New Assign For '.$module->name,
                    'from_user_type' => 'teacher',
                    'from_user_id' => $authUserId,
                    'to_user_type' => 'student',
                    'to_user_id' => $student,
                    'url' => '/todo',
                    'type' => $type,
                    'type_id' => $typeId,
                ]);
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }

        $this->snapshotTrigger->captureStudents(
            $studentIds,
            PerformanceSnapshotSource::ASSIGN_CREATED,
            (int) $createdBy,
            $schoolId,
            Assigns::class,
            (int) $assign->id
        );

        return [
            'assign' => $assign,
            'student_ids' => $studentIds,
        ];
    }

    /**
     * Delete assign + student rows + performance snapshot (legacy destroy).
     *
     * @return array{student_ids: array<int, int>, teacher_id: int|null, school_id: int|null}
     */
    public function delete(int $assignId): array
    {
        $assign = Assigns::find($assignId);

        if (! $assign) {
            throw new InvalidArgumentException('assign_not_found');
        }

        $affectedStudentIds = AssignsStudents::where('assign_id', $assignId)
            ->pluck('student_id')
            ->map(fn ($studentId) => (int) $studentId)
            ->unique()
            ->values()
            ->all();

        $teacherId = (int) ($assign->created_by ?? 0);
        $schoolId = (int) ($assign->school_id ?? 0);

        Assigns::where('id', $assignId)->delete();
        AssignsStudents::where('assign_id', $assignId)->delete();

        $this->snapshotTrigger->captureStudents(
            $affectedStudentIds,
            PerformanceSnapshotSource::ASSIGN_DELETED,
            $teacherId > 0 ? $teacherId : null,
            $schoolId > 0 ? $schoolId : null,
            Assigns::class,
            $assignId
        );

        return [
            'student_ids' => $affectedStudentIds,
            'teacher_id' => $teacherId > 0 ? $teacherId : null,
            'school_id' => $schoolId > 0 ? $schoolId : null,
        ];
    }

    /**
     * Mark student assign row opened (idempotent). Triggers observer → snapshot.
     */
    public function markOpened(int $assignId, int $studentId): AssignsStudents
    {
        $row = AssignsStudents::where('assign_id', $assignId)
            ->where('student_id', $studentId)
            ->first();

        if (! $row) {
            throw new InvalidArgumentException('assign_student_not_found');
        }

        if (! $row->opened_at) {
            $row->opened_at = now();
            $row->save();
        }

        return $row;
    }

    /**
     * Create multi-activity assignment (Learning Activities).
     * Parent assigns.type = learning_activities; children in assign_activities.
     *
     * @param  array<string, mixed>  $input
     * @param  array<int, int>  $studentIds
     * @param  array<int, array<string, mixed>>  $resolvedActivities
     * @return array{assign: Assigns, student_ids: array<int, int>}
     */
    public function createLearningActivities(
        array $input,
        array $studentIds,
        array $resolvedActivities,
        int $authUserId
    ): array {
        if ($resolvedActivities === []) {
            throw new InvalidArgumentException('activities_required');
        }

        $schoolId = (int) $input['school_id'];
        $dueAtInput = $input['due_at'] ?? $input['due_date'] ?? null;

        if (empty($dueAtInput)) {
            throw new InvalidArgumentException('due_at_required');
        }

        $dueAt = Carbon::parse($dueAtInput);
        $subjectId = (int) ($resolvedActivities[0]['subject_id'] ?? 0);
        $title = trim((string) ($input['title'] ?? $input['assigned_name'] ?? ''));

        if ($title === '') {
            $title = (string) ($resolvedActivities[0]['title_snapshot'] ?? 'Assignment');
        }

        $createdBy = $this->permissions->resolveCreatedBy(
            isset($input['teacher_id']) ? (int) $input['teacher_id'] : null,
            $authUserId
        );

        $type = \App\Support\Assignment\LearningActivityMap::ASSIGN_TYPE;
        $typeId = 0;

        DB::beginTransaction();

        try {
            $possibleXp = $this->normalizePossibleXp($input['possible_xp'] ?? null);

            $assign = Assigns::create([
                'type' => $type,
                'type_id' => $typeId,
                'assigned_name' => $title,
                'assigned_path' => url('/todo'),
                'school_id' => $schoolId,
                'status' => 1,
                'created_by' => $createdBy,
                'subject_id' => $subjectId > 0 ? $subjectId : null,
                'due_at' => $dueAt,
                'possible_xp' => $possibleXp,
            ]);

            foreach ($resolvedActivities as $activity) {
                \App\Models\AssignActivity::create([
                    'assign_id' => $assign->id,
                    'activity_type' => $activity['activity_type'],
                    'activity_id' => $activity['activity_id'],
                    'source_table' => $activity['source_table'],
                    'grading_mode' => $activity['grading_mode'],
                    'title_snapshot' => $activity['title_snapshot'],
                    'sort_order' => $activity['sort_order'],
                ]);
            }

            $legacyStudentIdFilter = $input['student_id'] ?? null;

            foreach ($studentIds as $student) {
                AssignsStudents::where([
                    ['type', $type],
                    ['type_id', $typeId],
                    ['student_id', $legacyStudentIdFilter],
                ])->delete();

                AssignsStudents::create([
                    'assign_id' => $assign->id,
                    'type' => $type,
                    'type_id' => $typeId,
                    'student_id' => $student,
                    'school_id' => $schoolId,
                    'status' => 1,
                    'created_by' => $createdBy,
                ]);

                Notification::create([
                    'title' => $title,
                    'description' => 'New Assign For '.$title,
                    'from_user_type' => 'teacher',
                    'from_user_id' => $authUserId,
                    'to_user_type' => 'student',
                    'to_user_id' => $student,
                    'url' => '/todo',
                    'type' => $type,
                    'type_id' => $typeId,
                ]);
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }

        $this->snapshotTrigger->captureStudents(
            $studentIds,
            PerformanceSnapshotSource::ASSIGN_CREATED,
            (int) $createdBy,
            $schoolId,
            Assigns::class,
            (int) $assign->id
        );

        return [
            'assign' => $assign->fresh(['activities']),
            'student_ids' => $studentIds,
        ];
    }

    /**
     * @param  mixed  $value
     */
    private function normalizePossibleXp($value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (! is_numeric($value)) {
            throw new InvalidArgumentException('possible_xp_invalid');
        }

        if ((float) $value != (int) $value) {
            throw new InvalidArgumentException('possible_xp_invalid');
        }

        $int = (int) $value;
        if ($int < 0) {
            throw new InvalidArgumentException('possible_xp_negative');
        }

        return $int;
    }
}
