<?php

namespace App\Services\Assignment;

use App\Models\AssignmentGrade;
use App\Models\AssignmentGradeCriterion;
use App\Models\AssignmentRubric;
use App\Models\AssignmentRubricCriterion;
use App\Models\Assigns;
use App\Models\AssignsStudents;
use App\Models\User;
use App\Services\Student\StudentXpService;
use App\Support\Assignment\LearningActivityMap;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

/**
 * Phase 3B/3C — Assignment Grade Draft + Finalize (badge, XP, feedback).
 */
class AssignmentGradeService
{
    public const VALID_POINTS = [1, 2, 3, 4];

    public const BADGE_EXCELLENT = 'excellent';

    public const BADGE_GOOD = 'good';

    public const BADGE_FAIR = 'fair';

    public const BADGE_NEEDS_IMPROVEMENT = 'needs_improvement';

    /** @var StudentXpService */
    private $xp;

    public function __construct(StudentXpService $xp)
    {
        $this->xp = $xp;
    }

    /**
     * @param  array{criteria: array<int, array{criterion_id: int|string, points: int|string}>, teacher_feedback?: string|null}  $input
     * @return array<string, mixed>
     */
    public function upsertDraft(int $assignId, int $studentId, array $input): array
    {
        return DB::transaction(function () use ($assignId, $studentId, $input) {
            $assign = Assigns::query()->where('id', $assignId)->lockForUpdate()->first();
            if (! $assign) {
                throw new InvalidArgumentException('assignment_not_found');
            }

            /** @var AssignsStudents|null $assignStudent */
            $assignStudent = AssignsStudents::query()
                ->where('assign_id', $assignId)
                ->where('student_id', $studentId)
                ->lockForUpdate()
                ->first();

            if (! $assignStudent) {
                throw new InvalidArgumentException('assign_student_not_found');
            }

            if ((int) $assignStudent->assign_id !== $assignId) {
                throw new InvalidArgumentException('assign_student_mismatch');
            }

            $parentStatus = strtolower((string) ($assignStudent->submission_status ?? AssignsStudents::SUBMISSION_ACTIVE));

            /** @var AssignmentGrade|null $existing */
            $existing = AssignmentGrade::query()
                ->where('assign_student_id', (int) $assignStudent->id)
                ->first();

            if ($existing && $existing->status === AssignmentGrade::STATUS_FINALIZED) {
                throw new InvalidArgumentException('assignment_grade_already_finalized');
            }

            if ($parentStatus === AssignsStudents::SUBMISSION_GRADED) {
                throw new InvalidArgumentException('assignment_already_graded');
            }

            if ($parentStatus !== AssignsStudents::SUBMISSION_SUBMITTED) {
                throw new InvalidArgumentException('assignment_not_submitted');
            }

            /** @var AssignmentRubric|null $rubric */
            $rubric = AssignmentRubric::query()
                ->where('assign_id', $assignId)
                ->with('criteria')
                ->first();

            if (! $rubric || $rubric->criteria->isEmpty()) {
                throw new InvalidArgumentException('assignment_rubric_required');
            }

            $normalizedScores = $this->normalizeAndValidateCriteriaInput(
                $input['criteria'] ?? null,
                $rubric
            );

            $finalPercent = $this->calculateFinalPercent($rubric->criteria, $normalizedScores);

            /** @var AssignmentGrade $grade */
            $grade = $existing ?? new AssignmentGrade([
                'assign_student_id' => (int) $assignStudent->id,
            ]);

            if ($grade->exists && (int) $grade->assign_id !== $assignId) {
                throw new InvalidArgumentException('assign_student_mismatch');
            }

            $grade->assign_id = $assignId;
            $grade->assign_student_id = (int) $assignStudent->id;
            $grade->final_percent = $finalPercent;
            $grade->status = AssignmentGrade::STATUS_DRAFT;
            if (array_key_exists('teacher_feedback', $input)) {
                $feedback = $input['teacher_feedback'];
                $grade->teacher_feedback = is_string($feedback) ? trim($feedback) : null;
                if ($grade->teacher_feedback === '') {
                    $grade->teacher_feedback = null;
                }
            }
            $grade->save();

            AssignmentGradeCriterion::query()
                ->where('assignment_grade_id', $grade->id)
                ->delete();

            foreach ($normalizedScores as $criterionId => $points) {
                AssignmentGradeCriterion::query()->create([
                    'assignment_grade_id' => $grade->id,
                    'assignment_rubric_criterion_id' => $criterionId,
                    'points' => $points,
                ]);
            }

            return $this->payloadForGrade($grade->fresh(['criteria']));
        });
    }

    /**
     * Phase 3C — Return Assignment: finalize grade + parent graded + XP.
     *
     * @return array{assign_student: AssignsStudents, grade: array<string, mixed>}
     */
    public function finalizeReturn(int $assignId, int $studentId, int $teacherId, ?string $teacherFeedback = null): array
    {
        return DB::transaction(function () use ($assignId, $studentId, $teacherId, $teacherFeedback) {
            $assign = Assigns::query()->where('id', $assignId)->lockForUpdate()->first();
            if (! $assign) {
                throw new InvalidArgumentException('assignment_not_found');
            }

            if ((string) $assign->type !== LearningActivityMap::ASSIGN_TYPE) {
                throw new InvalidArgumentException('assignment_type_unsupported');
            }

            /** @var AssignsStudents|null $assignStudent */
            $assignStudent = AssignsStudents::query()
                ->where('assign_id', $assignId)
                ->where('student_id', $studentId)
                ->lockForUpdate()
                ->first();

            if (! $assignStudent) {
                throw new InvalidArgumentException('assign_student_not_found');
            }

            $parentStatus = strtolower((string) ($assignStudent->submission_status ?? AssignsStudents::SUBMISSION_ACTIVE));
            if ($parentStatus === AssignsStudents::SUBMISSION_GRADED) {
                throw new InvalidArgumentException('assignment_already_graded');
            }
            if ($parentStatus !== AssignsStudents::SUBMISSION_SUBMITTED) {
                throw new InvalidArgumentException('assignment_not_submitted');
            }

            /** @var AssignmentGrade|null $grade */
            $grade = AssignmentGrade::query()
                ->where('assign_id', $assignId)
                ->where('assign_student_id', (int) $assignStudent->id)
                ->lockForUpdate()
                ->with('criteria')
                ->first();

            if (! $grade) {
                throw new InvalidArgumentException('assignment_grade_required');
            }

            if ($grade->status === AssignmentGrade::STATUS_FINALIZED) {
                throw new InvalidArgumentException('assignment_grade_already_finalized');
            }

            if ($grade->status !== AssignmentGrade::STATUS_DRAFT) {
                throw new InvalidArgumentException('assignment_grade_required');
            }

            /** @var AssignmentRubric|null $rubric */
            $rubric = AssignmentRubric::query()
                ->where('assign_id', $assignId)
                ->with('criteria')
                ->first();

            if (! $rubric || $rubric->criteria->isEmpty()) {
                throw new InvalidArgumentException('assignment_rubric_required');
            }

            $scores = [];
            foreach ($grade->criteria as $row) {
                $scores[(int) $row->assignment_rubric_criterion_id] = (int) $row->points;
            }

            // Ensure every rubric criterion has a score (complete draft).
            $expectedIds = $rubric->criteria->pluck('id')->map(static fn ($id) => (int) $id)->sort()->values()->all();
            $providedIds = array_keys($scores);
            sort($providedIds);
            if ($providedIds !== $expectedIds) {
                throw new InvalidArgumentException('assignment_grade_incomplete');
            }

            $finalPercent = $this->calculateFinalPercent($rubric->criteria, $scores);
            $badgeKey = $this->resolveBadgeKey($finalPercent);
            $possibleXp = $assign->possible_xp !== null ? (int) $assign->possible_xp : null;
            $earnedXp = $this->calculateEarnedXp($possibleXp, $finalPercent);

            $now = now();
            $grade->final_percent = $finalPercent;
            $grade->badge_key = $badgeKey;
            $grade->possible_xp = $possibleXp;
            $grade->earned_xp = $earnedXp;
            $grade->status = AssignmentGrade::STATUS_FINALIZED;
            $grade->graded_by = $teacherId > 0 ? $teacherId : null;
            $grade->finalized_at = $now;
            if ($teacherFeedback !== null) {
                $trimmed = trim($teacherFeedback);
                $grade->teacher_feedback = $trimmed === '' ? null : $trimmed;
            }
            $grade->save();

            $assignStudent->submission_status = AssignsStudents::SUBMISSION_GRADED;
            $assignStudent->graded_at = $now;
            $assignStudent->save();

            if ($earnedXp !== null && $earnedXp > 0) {
                $this->xp->awardAssignmentXp(
                    (int) $assignStudent->student_id,
                    (int) $assignStudent->id,
                    $earnedXp,
                    $now
                );
            }

            return [
                'assign_student' => $assignStudent->fresh(),
                'grade' => $this->payloadForGrade($grade->fresh(['criteria'])),
            ];
        });
    }

    /**
     * @return array<string, mixed>|null
     */
    public function showForStudent(int $assignId, int $studentId): ?array
    {
        $assignStudent = AssignsStudents::query()
            ->where('assign_id', $assignId)
            ->where('student_id', $studentId)
            ->first();

        if (! $assignStudent) {
            throw new InvalidArgumentException('assign_student_not_found');
        }

        $grade = AssignmentGrade::query()
            ->with(['criteria', 'grader', 'assign'])
            ->where('assign_id', $assignId)
            ->where('assign_student_id', (int) $assignStudent->id)
            ->first();

        if (! $grade) {
            return null;
        }

        return $this->payloadForGrade($grade);
    }

    /**
     * @param  iterable<int, AssignmentRubricCriterion>  $rubricCriteria
     * @param  array<int, int>  $scoresByCriterionId
     */
    public function calculateFinalPercent($rubricCriteria, array $scoresByCriterionId): float
    {
        $sum = 0.0;

        foreach ($rubricCriteria as $criterion) {
            $criterionId = (int) $criterion->id;
            if (! array_key_exists($criterionId, $scoresByCriterionId)) {
                throw new InvalidArgumentException('criteria_incomplete');
            }

            $points = (int) $scoresByCriterionId[$criterionId];
            $maxPoints = (int) ($criterion->max_points ?: AssignmentRubricService::MAX_POINTS);
            if ($maxPoints <= 0) {
                throw new InvalidArgumentException('criteria_max_points_invalid');
            }

            $weight = (float) $criterion->weight;
            $sum += ($points / $maxPoints) * $weight;
        }

        return round($sum, 2);
    }

    public function resolveBadgeKey(float $finalPercent): string
    {
        $percent = round($finalPercent, 2);

        if ($percent >= 90.0) {
            return self::BADGE_EXCELLENT;
        }
        if ($percent >= 75.0) {
            return self::BADGE_GOOD;
        }
        if ($percent >= 50.0) {
            return self::BADGE_FAIR;
        }

        return self::BADGE_NEEDS_IMPROVEMENT;
    }

    public function badgeLabel(string $key): string
    {
        $badges = config('assignment_grade.badges', []);
        if (isset($badges[$key]['label'])) {
            return (string) $badges[$key]['label'];
        }

        return str_replace('_', ' ', ucfirst($key));
    }

    public function calculateEarnedXp(?int $possibleXp, float $finalPercent): ?int
    {
        if ($possibleXp === null) {
            return null;
        }

        if ($possibleXp <= 0) {
            return 0;
        }

        // Match StudentXpService integer ledger convention (quiz uses round).
        return (int) round($possibleXp * (round($finalPercent, 2) / 100.0));
    }

    /**
     * @param  mixed  $criteriaInput
     * @return array<int, int> criterion_id => points
     */
    private function normalizeAndValidateCriteriaInput($criteriaInput, AssignmentRubric $rubric): array
    {
        if (! is_array($criteriaInput) || $criteriaInput === []) {
            throw new InvalidArgumentException('criteria_required');
        }

        $expectedIds = $rubric->criteria
            ->pluck('id')
            ->map(static fn ($id) => (int) $id)
            ->sort()
            ->values()
            ->all();

        $scores = [];
        foreach ($criteriaInput as $row) {
            if (! is_array($row)) {
                throw new InvalidArgumentException('criteria_invalid');
            }

            if (! isset($row['criterion_id']) || ! is_numeric($row['criterion_id'])) {
                throw new InvalidArgumentException('criteria_criterion_id_invalid');
            }

            $criterionId = (int) $row['criterion_id'];
            if (array_key_exists($criterionId, $scores)) {
                throw new InvalidArgumentException('criteria_duplicate');
            }

            if (! isset($row['points']) || ! is_numeric($row['points'])) {
                throw new InvalidArgumentException('criteria_points_invalid');
            }

            if ((float) $row['points'] != (int) $row['points']) {
                throw new InvalidArgumentException('criteria_points_invalid');
            }

            $points = (int) $row['points'];
            if (! in_array($points, self::VALID_POINTS, true)) {
                throw new InvalidArgumentException('criteria_points_invalid');
            }

            $scores[$criterionId] = $points;
        }

        $providedIds = array_keys($scores);
        sort($providedIds);

        foreach ($providedIds as $id) {
            if (! in_array($id, $expectedIds, true)) {
                throw new InvalidArgumentException('criteria_unknown_or_foreign');
            }
        }

        if ($providedIds !== $expectedIds) {
            throw new InvalidArgumentException('criteria_incomplete');
        }

        return $scores;
    }

    /**
     * @return array<string, mixed>
     */
    private function payloadForGrade(AssignmentGrade $grade): array
    {
        $criteria = [];
        foreach ($grade->criteria as $row) {
            $criteria[] = [
                'criterion_id' => (int) $row->assignment_rubric_criterion_id,
                'points' => (int) $row->points,
            ];
        }

        usort($criteria, static function (array $a, array $b) {
            return $a['criterion_id'] <=> $b['criterion_id'];
        });

        $badgeKey = $grade->badge_key ? (string) $grade->badge_key : null;
        $badge = null;
        if ($badgeKey !== null && $badgeKey !== '') {
            $badge = [
                'key' => $badgeKey,
                'label' => $this->badgeLabel($badgeKey),
            ];
        }

        $teacher = $this->resolveTeacherProfile($grade);

        return [
            'id' => (int) $grade->id,
            'assign_id' => (int) $grade->assign_id,
            'assign_student_id' => (int) $grade->assign_student_id,
            'status' => (string) $grade->status,
            'final_percent' => round((float) $grade->final_percent, 2),
            'possible_xp' => $grade->possible_xp !== null ? (int) $grade->possible_xp : null,
            'earned_xp' => $grade->earned_xp !== null ? (int) $grade->earned_xp : null,
            'badge' => $badge,
            'teacher_feedback' => $grade->teacher_feedback !== null
                ? (string) $grade->teacher_feedback
                : null,
            'graded_by' => $grade->graded_by !== null ? (int) $grade->graded_by : null,
            'teacher_id' => $teacher['teacher_id'],
            'teacher_name' => $teacher['teacher_name'],
            'teacher_photo_url' => $teacher['teacher_photo_url'],
            'finalized_at' => $grade->finalized_at
                ? $grade->finalized_at->toIso8601String()
                : null,
            'criteria' => $criteria,
        ];
    }

    /**
     * Prefer the grading teacher photo; fall back to assignment creator (class teacher).
     *
     * @return array{teacher_id: int|null, teacher_name: string|null, teacher_photo_url: string|null}
     */
    private function resolveTeacherProfile(AssignmentGrade $grade): array
    {
        $candidateIds = [];
        if ($grade->graded_by !== null && (int) $grade->graded_by > 0) {
            $candidateIds[] = (int) $grade->graded_by;
        }

        $assign = $grade->relationLoaded('assign')
            ? $grade->assign
            : Assigns::query()->find((int) $grade->assign_id);
        $createdBy = $assign ? (int) ($assign->created_by ?? 0) : 0;
        if ($createdBy > 0) {
            $candidateIds[] = $createdBy;
        }

        $candidateIds = array_values(array_unique($candidateIds));

        $teacherId = null;
        $teacherName = null;
        $teacherPhotoUrl = null;

        foreach ($candidateIds as $userId) {
            /** @var User|null $user */
            $user = null;
            if (
                $grade->relationLoaded('grader')
                && $grade->grader
                && (int) $grade->grader->id === $userId
            ) {
                $user = $grade->grader;
            } else {
                $user = User::query()->find($userId);
            }

            if (! $user) {
                continue;
            }

            if ($teacherId === null) {
                $teacherId = $userId;
                $teacherName = $this->teacherDisplayName($user);
            }

            $rawPhoto = $user->getRawOriginal('photo');
            if (is_string($rawPhoto) && trim($rawPhoto) !== '') {
                $photoUrl = $user->photo;
                if (is_string($photoUrl) && $photoUrl !== '') {
                    $teacherId = $userId;
                    $teacherName = $this->teacherDisplayName($user);
                    $teacherPhotoUrl = $photoUrl;
                    break;
                }
            }
        }

        return [
            'teacher_id' => $teacherId,
            'teacher_name' => $teacherName,
            'teacher_photo_url' => $teacherPhotoUrl,
        ];
    }

    private function teacherDisplayName(User $user): ?string
    {
        $name = trim((string) ($user->name ?? ''));
        if ($name !== '') {
            return $name;
        }

        $en = trim(trim((string) ($user->fname_en ?? '')).' '.trim((string) ($user->lname_en ?? '')));
        if ($en !== '') {
            return $en;
        }

        $ar = trim(trim((string) ($user->fname_ar ?? '')).' '.trim((string) ($user->lname_ar ?? '')));
        if ($ar !== '') {
            return $ar;
        }

        return null;
    }
}
