<?php

namespace App\Services\Student;

use App\Models\Assigns;
use App\Models\AssignsStudents;
use App\Models\Quizes;
use App\Models\QuizesQuestions;
use App\Models\StudentSubjectProgress;
use App\Services\StudentMetricsService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Shared progress overview for student dashboard and GET /progress.
 * Single source — avoids duplicating tier/stats logic in controllers.
 */
class StudentProgressOverviewService
{
    /** @var StudentMetricsService */
    private $metrics;

    public function __construct(StudentMetricsService $metrics)
    {
        $this->metrics = $metrics;
    }

    /**
     * @param  int[]  $subjectIds
     * @return array<string, mixed>
     */
    public function build(int $studentId, array $subjectIds): array
    {
        $totalSubjects = count(array_unique($subjectIds));
        $progressRows = StudentSubjectProgress::query()
            ->where('student_id', $studentId)
            ->when($subjectIds !== [], fn ($q) => $q->whereIn('subject_id', $subjectIds))
            ->get();

        $subjectsWithProgress = $progressRows
            ->filter(fn ($row) => (float) $row->value > 0)
            ->count();

        $overallProgress = $totalSubjects > 0
            ? (int) $this->metrics->computeAveragePercent(
                $progressRows->pluck('value')->all(),
                0,
                true
            )
            : 0;

        $totalQuizes = $totalSubjects > 0
            ? Quizes::whereIn('subject_id', $subjectIds)->count()
            : 0;

        $totalQuestions = $totalQuizes > 0
            ? QuizesQuestions::whereIn(
                'quize_id',
                Quizes::whereIn('subject_id', $subjectIds)->pluck('id')
            )->count()
            : 0;

        $assignStudentQuery = AssignsStudents::query()
            ->where('student_id', $studentId)
            ->where('status', 1);

        $assignIds = $assignStudentQuery->pluck('assign_id')->filter()->unique()->values()->all();

        $totalHomework = $assignIds !== []
            ? Assigns::whereIn('id', $assignIds)->where('status', '1')->count()
            : 0;

        $homeworkFinished = (int) (clone $assignStudentQuery)
            ->whereNotNull('opened_at')
            ->count();

        $assessmentFinished = 0;
        $questionsSolved = 0;

        if ($assignIds !== [] && Schema::hasTable('quiz_attempts')) {
            $assessmentFinished = (int) DB::table('quiz_attempts')
                ->where('student_id', $studentId)
                ->whereIn('assign_id', $assignIds)
                ->whereNotNull('submitted_at')
                ->distinct('assign_id')
                ->count('assign_id');
        }

        if (Schema::hasTable('quiz_results') && Schema::hasTable('quiz_attempts')) {
            $questionsSolved = (int) DB::table('quiz_results')
                ->where('student_id', $studentId)
                ->whereNotNull('percent')
                ->count();
        }

        $tierInfo = $this->resolveTier($overallProgress);

        return [
            'tier'             => $tierInfo['tier'],
            'next_tier'        => $tierInfo['next_tier'],
            'progress_percent' => $overallProgress,
            'stats'            => [
                'subjects_finished'   => $subjectsWithProgress,
                'subjects_total'      => $totalSubjects,
                'assessment_total'    => $totalQuizes,
                'assessment_finished' => $assessmentFinished,
                'questions_total'     => $totalQuestions,
                'questions_solved'    => $questionsSolved,
                'homework_total'      => $totalHomework,
                'homework_finished'   => $homeworkFinished,
            ],
        ];
    }

    /**
     * Profile page shape (GET /progress).
     *
     * @param  int[]  $subjectIds
     * @return array<string, mixed>
     */
    public function buildForProfile(int $studentId, array $subjectIds): array
    {
        $core = $this->build($studentId, $subjectIds);
        $tier = (string) $core['tier'];
        $nextTier = $core['next_tier'];
        $overallProgress = (int) $core['progress_percent'];

        return [
            'classification' => [
                'tier'              => $tier,
                'tier_key'          => $tier === 'Bronze' ? 'Bronze-Tire' : ($tier === 'Silver' ? 'Silver-Tire' : 'Golden-Tire'),
                'description'       => $tier === 'Silver'
                    ? 'Submit on time , complete your task and homework to increase the progress'
                    : ($tier === 'Bronze'
                        ? 'Complete subjects and assignments to reach Silver tier.'
                        : 'You reached the Golden tier!'),
                'next_tier'         => $nextTier,
                'next_tier_message' => $nextTier ? 'Next tire is the '.$nextTier.' tire' : null,
                'progress_percent'  => $overallProgress,
                'badge_image'       => null,
            ],
            'stats' => [
                'assessment_finished' => (int) ($core['stats']['assessment_finished'] ?? 0),
                'assessment_total'    => (int) ($core['stats']['assessment_total'] ?? 0),
                'subjects_finished'   => (int) ($core['stats']['subjects_finished'] ?? 0),
                'subjects_total'      => (int) ($core['stats']['subjects_total'] ?? 0),
                'questions_solved'    => (int) ($core['stats']['questions_solved'] ?? 0),
                'questions_total'     => (int) ($core['stats']['questions_total'] ?? 0),
                'homework_finished'   => (int) ($core['stats']['homework_finished'] ?? 0),
                'homework_total'      => (int) ($core['stats']['homework_total'] ?? 0),
            ],
        ];
    }

    /**
     * @return array{tier: string, next_tier: ?string}
     */
    public function resolveTier(int $overallProgress): array
    {
        $tier = 'Silver';
        $nextTier = 'Golden';

        if ($overallProgress < 33) {
            $tier = 'Bronze';
            $nextTier = 'Silver';
        } elseif ($overallProgress >= 66) {
            $tier = 'Golden';
            $nextTier = null;
        }

        return [
            'tier'      => $tier,
            'next_tier' => $nextTier,
        ];
    }
}
