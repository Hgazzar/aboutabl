<?php

namespace App\Services;

use App\Models\Classes;
use App\Models\SchoolsRoles;
use App\Models\Student;
use App\Models\TeacherEvaluation;
use App\Models\TeachersGrades;
use App\Models\User;
use Illuminate\Support\Collection;
use InvalidArgumentException;

/**
 * Teacher Note & Evaluation — independent of Smart Insight.
 * Authorization: teacher must own the class assignment; mutations only on own rows.
 * Tenant scope: evaluations filtered by student/class + school_id when known.
 */
class TeacherEvaluationService
{
    /** @var TeacherDashboardService */
    private $dashboardService;

    public function __construct(TeacherDashboardService $dashboardService)
    {
        $this->dashboardService = $dashboardService;
    }

    /**
     * @param  int[]  $schoolIds
     * @return array<string, mixed>
     */
    public function listForStudent(
        int $teacherId,
        array $schoolIds,
        int $classId,
        int $studentId,
        bool $accessVerified = false
    ): array {
        $student = $this->assertTeacherCanAccessStudent(
            $teacherId,
            $schoolIds,
            $classId,
            $studentId,
            $accessVerified
        );

        $rows = $this->evaluationsQueryForStudent($student, $classId)
            ->with('teacher:id,name,fname_en,lname_en,fname_ar,lname_ar')
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->limit(100)
            ->get();

        $items = $this->mapRows($rows);

        return [
            'available' => $items !== [],
            'items'     => $items,
            // Same loaded set — first row after ORDER BY created_at DESC (no extra query).
            'latest'    => $items[0] ?? null,
        ];
    }

    /**
     * @param  int[]  $schoolIds
     * @return array<string, mixed>|null
     */
    public function latestForStudent(
        int $teacherId,
        array $schoolIds,
        int $classId,
        int $studentId
    ): ?array {
        $payload = $this->listForStudent($teacherId, $schoolIds, $classId, $studentId);

        return $payload['latest'];
    }

    /**
     * Profile provider path — same authorization as list.
     *
     * @param  int[]  $schoolIds
     * @return array{available: bool, notes: array<int, array<string, mixed>>, latest_feedback: array<string, mixed>|null}
     */
    public function buildProfilePayload(
        int $teacherId,
        array $schoolIds,
        int $classId,
        int $studentId,
        bool $accessVerified = false
    ): array {
        $payload = $this->listForStudent(
            $teacherId,
            $schoolIds,
            $classId,
            $studentId,
            $accessVerified
        );

        return [
            'available'       => $payload['available'],
            'notes'           => $payload['items'],
            'latest_feedback' => $payload['latest'],
        ];
    }

    /**
     * @param  int[]  $schoolIds
     * @return array<string, mixed>
     */
    public function create(
        int $teacherId,
        array $schoolIds,
        int $classId,
        int $studentId,
        string $note
    ): array {
        $student = $this->assertTeacherCanAccessStudent($teacherId, $schoolIds, $classId, $studentId);

        $evaluation = TeacherEvaluation::query()->create([
            'school_id'  => $this->resolveSchoolId($student, $classId),
            'teacher_id' => $teacherId,
            'class_id'   => $classId,
            'student_id' => $studentId,
            'note'       => $note,
        ]);

        $evaluation->load('teacher:id,name,fname_en,lname_en,fname_ar,lname_ar');

        return $this->mapRow($evaluation, true);
    }

    /**
     * @param  int[]  $schoolIds
     * @return array<string, mixed>
     */
    public function update(
        int $teacherId,
        array $schoolIds,
        int $classId,
        int $studentId,
        int $evaluationId,
        string $note
    ): array {
        $student = $this->assertTeacherCanAccessStudent($teacherId, $schoolIds, $classId, $studentId);

        $evaluation = $this->findOwnedEvaluation($teacherId, $student, $classId, $evaluationId);
        // Note edits do not change created_at ordering — compute flag before save from DB order.
        $isLatest = $this->rowIsLatest($evaluation, $student, $classId);
        $evaluation->note = $note;
        $evaluation->save();
        $evaluation->load('teacher:id,name,fname_en,lname_en,fname_ar,lname_ar');

        return $this->mapRow($evaluation, $isLatest);
    }

    /**
     * @param  int[]  $schoolIds
     */
    public function delete(
        int $teacherId,
        array $schoolIds,
        int $classId,
        int $studentId,
        int $evaluationId
    ): void {
        $student = $this->assertTeacherCanAccessStudent($teacherId, $schoolIds, $classId, $studentId);

        $evaluation = $this->findOwnedEvaluation($teacherId, $student, $classId, $evaluationId);
        $evaluation->delete();
    }

    /**
     * @param  int[]  $schoolIds
     */
    private function assertTeacherCanAccessStudent(
        int $teacherId,
        array $schoolIds,
        int $classId,
        int $studentId,
        bool $accessVerified = false
    ): Student {
        // When Student Profile already resolved class membership + scope, skip
        // a second full teacher-scope hydrate (F-040A). Mutations keep full checks.
        if (! $accessVerified) {
            $scope = $this->dashboardService->resolveClassAccess($teacherId, $schoolIds, $classId);

            if ($scope === null) {
                throw new InvalidArgumentException('The selected class is not assigned to this teacher.');
            }
        } else {
            // Profile already verified class access; resolve school IDs without a full hydrate.
            $scope = [
                'school_ids' => $schoolIds !== []
                    ? $schoolIds
                    : $this->teacherSchoolIds($teacherId),
            ];
        }

        /** @var Student|null $student */
        $student = Student::query()
            ->activeInClasses(collect([$classId]))
            ->where('id', $studentId)
            ->first(['id', 'class_id', 'school_id', 'name', 'status']);

        if ($student === null) {
            throw new InvalidArgumentException('The selected student is not in this class.');
        }

        $scopeSchoolIds = collect($scope['school_ids'] ?? [])
            ->map(fn ($id) => (int) $id)
            ->filter()
            ->values()
            ->all();

        $requestSchoolIds = collect($schoolIds)
            ->map(fn ($id) => (int) $id)
            ->filter()
            ->values()
            ->all();

        $allowedSchoolIds = $requestSchoolIds !== [] ? $requestSchoolIds : $scopeSchoolIds;

        // F-040B: fail closed — never skip school scoping when the student has a school_id.
        if ($student->school_id) {
            if (
                $allowedSchoolIds === []
                || ! in_array((int) $student->school_id, $allowedSchoolIds, true)
            ) {
                throw new InvalidArgumentException('The selected student is outside your school scope.');
            }
        }

        return $student;
    }

    /**
     * Lightweight school list for the teacher (no full dashboard hydrate).
     *
     * @return int[]
     */
    private function teacherSchoolIds(int $teacherId): array
    {
        $fromRoles = SchoolsRoles::where('user_id', $teacherId)
            ->pluck('school_id')
            ->all();
        $fromAssignments = TeachersGrades::where('user_id', $teacherId)
            ->distinct()
            ->pluck('school_id')
            ->all();

        return array_values(array_unique(array_map('intval', array_merge($fromRoles, $fromAssignments))));
    }

    private function findOwnedEvaluation(
        int $teacherId,
        Student $student,
        int $classId,
        int $evaluationId
    ): TeacherEvaluation {
        /** @var TeacherEvaluation|null $evaluation */
        $evaluation = $this->evaluationsQueryForStudent($student, $classId)
            ->where('id', $evaluationId)
            ->first();

        if ($evaluation === null) {
            throw new InvalidArgumentException('Evaluation not found for this student.');
        }

        if ((int) $evaluation->teacher_id !== $teacherId) {
            throw new InvalidArgumentException('You can only edit or delete your own evaluations.');
        }

        return $evaluation;
    }

    /**
     * Shared lookup — always scoped to student + class + school_id.
     *
     * @return \Illuminate\Database\Eloquent\Builder
     */
    private function evaluationsQueryForStudent(Student $student, int $classId)
    {
        $query = TeacherEvaluation::query()
            ->forStudentInClass((int) $student->id, $classId);

        if ($student->school_id) {
            $query->where('school_id', (int) $student->school_id);
        }

        return $query;
    }

    private function resolveSchoolId(Student $student, int $classId): ?int
    {
        if ($student->school_id) {
            return (int) $student->school_id;
        }

        $classSchoolId = Classes::query()->where('id', $classId)->value('school_id');

        return $classSchoolId !== null ? (int) $classSchoolId : null;
    }

    /**
     * Flag for update response only — not used for profile latest_feedback.
     */
    private function rowIsLatest(
        TeacherEvaluation $evaluation,
        Student $student,
        int $classId
    ): bool {
        $latestId = $this->evaluationsQueryForStudent($student, $classId)
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->value('id');

        return $latestId !== null && (int) $latestId === (int) $evaluation->id;
    }

    /**
     * @param  Collection<int, TeacherEvaluation>  $rows
     * @return array<int, array<string, mixed>>
     */
    private function mapRows(Collection $rows): array
    {
        if ($rows->isEmpty()) {
            return [];
        }

        $latestId = (int) $rows->first()->id;
        $items = [];

        foreach ($rows as $row) {
            $items[] = $this->mapRow($row, (int) $row->id === $latestId);
        }

        return $items;
    }

    /**
     * @return array<string, mixed>
     */
    private function mapRow(TeacherEvaluation $row, bool $isLatest): array
    {
        return [
            'id'           => (int) $row->id,
            'school_id'    => $row->school_id !== null ? (int) $row->school_id : null,
            'teacher_id'   => (int) $row->teacher_id,
            'teacher_name' => $this->teacherDisplayName($row->teacher),
            'class_id'     => (int) $row->class_id,
            'student_id'   => (int) $row->student_id,
            'note'         => (string) $row->note,
            'created_at'   => optional($row->created_at)->toIso8601String(),
            'updated_at'   => optional($row->updated_at)->toIso8601String(),
            'is_latest'    => $isLatest,
        ];
    }

    private function teacherDisplayName(?User $teacher): string
    {
        if ($teacher === null) {
            return '';
        }

        $name = trim((string) ($teacher->name ?? ''));
        if ($name !== '') {
            return $name;
        }

        $en = trim(((string) ($teacher->fname_en ?? '')).' '.((string) ($teacher->lname_en ?? '')));
        if ($en !== '') {
            return $en;
        }

        $ar = trim(((string) ($teacher->fname_ar ?? '')).' '.((string) ($teacher->lname_ar ?? '')));

        return $ar !== '' ? $ar : '';
    }
}
