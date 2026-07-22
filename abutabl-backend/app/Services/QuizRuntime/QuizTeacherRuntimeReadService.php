<?php

namespace App\Services\QuizRuntime;

use App\Models\QuizRuntime\QuizAttempt;
use App\Models\Schools;
use App\Models\SchoolsRoles;
use App\Models\TeachersGrades;
use App\Models\User;
use App\Support\Ownership\OwnershipGate;
use App\Repositories\QuizRuntime\AnswerRepository;
use App\Repositories\QuizRuntime\AttemptRepository;
use App\Repositories\QuizRuntime\ResultRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use RuntimeException;

/**
 * F-009D Sprint 2 Step 1 — Teacher Runtime READ (list / show attempts).
 * Owns school scope, assignment visibility, and safe payload assembly.
 * Does not grade, finalize, regrade, or mutate Runtime state.
 */
class QuizTeacherRuntimeReadService
{
    /** @var AttemptRepository */
    private $attempts;

    /** @var AnswerRepository */
    private $answers;

    /** @var ResultRepository */
    private $results;

    public function __construct(
        AttemptRepository $attempts,
        AnswerRepository $answers,
        ResultRepository $results
    ) {
        $this->attempts = $attempts;
        $this->answers = $answers;
        $this->results = $results;
    }

    /**
     * @param  array<string, mixed>  $input
     * @return LengthAwarePaginator
     */
    public function listAttempts(array $input): LengthAwarePaginator
    {
        $teacher = $this->requireTeacher($input);
        $scope = $this->buildVisibilityScope($teacher);

        $perPage = (int) ($input['per_page'] ?? 20);
        $perPage = max(1, min($perPage, 100));

        $filters = [
            'quiz_id' => isset($input['quiz_id']) ? (int) $input['quiz_id'] : null,
            'student_id' => isset($input['student_id']) ? (int) $input['student_id'] : null,
            'assign_id' => isset($input['assign_id']) ? (int) $input['assign_id'] : null,
            'status' => isset($input['status']) ? (string) $input['status'] : null,
        ];

        return $this->attempts->paginateForTeacherVisibility(
            $scope['school_ids'],
            $scope['student_ids'],
            $scope['assign_ids'],
            $filters,
            $perPage,
            ! empty($scope['admin_unrestricted'])
        );
    }

    /**
     * @param  array<string, mixed>  $input
     * @return array{attempt: QuizAttempt, answers: mixed, result: mixed, snapshot_questions: array<int, array<string, mixed>>}
     */
    public function getAttempt(array $input): array
    {
        $teacher = $this->requireTeacher($input);
        $attemptId = (int) ($input['attempt_id'] ?? 0);

        $attempt = $this->attempts->findById($attemptId);
        if ($attempt === null) {
            throw new RuntimeException('Attempt not found.', 404);
        }

        $this->assertCanAccessAttempt($teacher, $attempt);

        $attempt->loadMissing(['snapshot', 'version']);

        $answers = $this->answers->findByAttempt((int) $attempt->id);
        $result = $this->results->findAuthoritative((int) $attempt->id);
        if ($result === null) {
            $result = $this->results->findLatest((int) $attempt->id);
        }

        $orderedSnapshotQuestions = \App\Support\QuizRuntime\SnapshotQuestionOrder::forAttempt($attempt);
        $snapshotQuestions = \App\Support\QuizRuntime\TeacherSnapshotReviewMapper::mapQuestions(
            $orderedSnapshotQuestions
        );

        return [
            'attempt' => $attempt,
            'answers' => $answers,
            'result' => $result,
            'snapshot_questions' => $snapshotQuestions,
        ];
    }

    /**
     * Shared teacher visibility gate for read + manual grade.
     */
    public function assertCanAccessAttempt(User $teacher, QuizAttempt $attempt): void
    {
        $scope = $this->buildVisibilityScope($teacher);
        if (! $this->attemptVisible($attempt, $scope)) {
            throw new RuntimeException('Forbidden.', 403);
        }
    }

    /**
     * @param  array<string, mixed>  $input
     */
    private function requireTeacher(array $input): User
    {
        /** @var User|null $teacher */
        $teacher = $input['teacher'] ?? Auth::guard('admin-api')->user();
        if ($teacher === null) {
            throw new RuntimeException('Unauthenticated.', 401);
        }

        return $teacher;
    }

    /**
     * @return array{
     *   school_ids: int[],
     *   student_ids: int[],
     *   assign_ids: int[],
     *   admin_unrestricted: bool
     * }
     */
    private function buildVisibilityScope(User $teacher): array
    {
        $schoolIds = $this->resolveSchoolIds($teacher);
        if ($schoolIds === []) {
            throw new RuntimeException('Forbidden.', 403);
        }

        if ($teacher->type === 'admin') {
            return [
                'school_ids' => $schoolIds,
                'student_ids' => [],
                'assign_ids' => [],
                'admin_unrestricted' => true,
            ];
        }

        $assignIds = OwnershipGate::ownedQuizAssignIds($teacher, $schoolIds);

        return [
            'school_ids' => $schoolIds,
            'student_ids' => [],
            'assign_ids' => $assignIds,
            'admin_unrestricted' => false,
        ];
    }

    /**
     * @param  array<string, mixed>  $scope
     */
    private function attemptVisible(QuizAttempt $attempt, array $scope): bool
    {
        if ($attempt->school_id !== null
            && ! in_array((int) $attempt->school_id, $scope['school_ids'], true)) {
            return false;
        }

        if (! empty($scope['admin_unrestricted'])) {
            return true;
        }

        if ($attempt->assign_id !== null
            && in_array((int) $attempt->assign_id, $scope['assign_ids'], true)) {
            return true;
        }

        return false;
    }

    /**
     * Mirror GeneralTrait::SchoolsIDs for admin-api teachers (service-owned).
     *
     * @return int[]
     */
    private function resolveSchoolIds(User $teacher): array
    {
        if ($teacher->type === 'admin') {
            return Schools::query()->orderBy('id')->pluck('id')->map(function ($id) {
                return (int) $id;
            })->all();
        }

        $fromRoles = SchoolsRoles::query()
            ->where('user_id', (int) $teacher->id)
            ->pluck('school_id')
            ->map(function ($id) {
                return (int) $id;
            })
            ->all();

        $fromGrades = TeachersGrades::query()
            ->where('user_id', (int) $teacher->id)
            ->distinct()
            ->pluck('school_id')
            ->map(function ($id) {
                return (int) $id;
            })
            ->all();

        $schoolIds = array_values(array_unique(array_merge($fromRoles, $fromGrades)));

        if ($schoolIds === [] && $teacher->school_id) {
            $schoolIds = [(int) $teacher->school_id];
        }

        return $schoolIds;
    }
}
