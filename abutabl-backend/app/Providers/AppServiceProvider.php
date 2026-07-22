<?php

namespace App\Providers;

use Laravel\Passport\Passport;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Schema;
use App\Contracts\Assignment\AssignmentAnalyticsInterface;
use App\Contracts\Assignment\AssignmentMaterialResolverInterface;
use App\Contracts\Assignment\AssignmentTargetResolverInterface;
use App\Contracts\StudentInsightProviderInterface;
use App\Models\AssignsStudents;
use App\Services\Assignment\AssignmentAnalyticsService;
use App\Services\Assignment\AssignmentLifecycleService;
use App\Services\Assignment\AssignmentMaterialResolver;
use App\Services\Assignment\AssignmentPermissionService;
use App\Services\Assignment\AssignmentService;
use App\Services\Assignment\AssignmentTargetingService;
use App\Models\Lessons;
use App\Models\Quizes;
use App\Models\StudentSubjectProgress;
use App\Observers\AssignsStudentsObserver;
use App\Observers\LessonsObserver;
use App\Observers\QuizesObserver;
use App\Observers\StudentSubjectProgressObserver;
use App\Repositories\StudentSubjectProgressRepository;
use App\Services\Progress\CurriculumCompletionEventCoverageSource;
use App\Services\Progress\LessonCompletionCoverageSource;
use App\Services\Progress\ProgressWriterService;
use App\Services\Progress\ScormCompletionCoverageSource;
use App\Services\SmartInsight\InsightRuleRegistry;
use App\Services\SmartInsight\Rules\AtRiskRule;
use App\Services\SmartInsight\Rules\AveragePerformanceRule;
use App\Services\SmartInsight\Rules\ConsistentExcellenceRule;
use App\Services\SmartInsight\Rules\ConsistentLearningPatternRule;
use App\Services\SmartInsight\Rules\CriticalRiskRule;
use App\Services\SmartInsight\Rules\DropoutRiskRule;
use App\Services\SmartInsight\Rules\ExcellentEngagementRule;
use App\Services\SmartInsight\Rules\ExcellentPerformanceRule;
use App\Services\SmartInsight\Rules\FastLearnerRule;
use App\Services\SmartInsight\Rules\FastProgressRule;
use App\Services\SmartInsight\Rules\HighAchieverRule;
use App\Services\SmartInsight\Rules\HighProgressRule;
use App\Services\SmartInsight\Rules\HighQuizAccuracyRule;
use App\Services\SmartInsight\Rules\HighRiskRule;
use App\Services\SmartInsight\Rules\InactiveStudentRule;
use App\Services\SmartInsight\Rules\InconsistentPerformanceRule;
use App\Services\SmartInsight\Rules\InterventionRequiredRule;
use App\Services\SmartInsight\Rules\IrregularLearningPatternRule;
use App\Services\SmartInsight\Rules\LearningExcellenceRule;
use App\Services\SmartInsight\Rules\LowEngagementRule;
use App\Services\SmartInsight\Rules\LowProgressRule;
use App\Services\SmartInsight\Rules\LowQuizAccuracyRule;
use App\Services\SmartInsight\Rules\MediumProgressRule;
use App\Services\SmartInsight\Rules\MilestoneAchievedRule;
use App\Services\SmartInsight\Rules\NoProgressRule;
use App\Services\SmartInsight\Rules\OutstandingImprovementRule;
use App\Services\SmartInsight\Rules\OutstandingStudentRule;
use App\Services\SmartInsight\Rules\PerformanceDeclineRule;
use App\Services\SmartInsight\Rules\PerformanceDecliningRule;
use App\Services\SmartInsight\Rules\PerformanceImprovingRule;
use App\Services\SmartInsight\Rules\ProgressImprovementRule;
use App\Services\SmartInsight\Rules\ProgressRegressionRule;
use App\Services\SmartInsight\Rules\QuizImprovementRule;
use App\Services\SmartInsight\Rules\RapidImprovementRule;
use App\Services\SmartInsight\Rules\RepeatedFailuresRule;
use App\Services\SmartInsight\Rules\RepeatedSuccessRule;
use App\Services\SmartInsight\Rules\ReturningStudentRule;
use App\Services\SmartInsight\Rules\SlowProgressRule;
use App\Services\SmartInsight\Rules\StandardsGapRule;
use App\Services\SmartInsight\Rules\StandardsImprovementRule;
use App\Services\SmartInsight\Rules\StrongStandardsRule;
use App\Services\SmartInsight\Rules\SubjectMasteryRule;
use App\Services\SmartInsight\Rules\TopPerformerRule;
use App\Services\SmartInsight\Rules\WeakPerformanceRule;
use App\Services\SmartInsight\Rules\WeakStandardsRule;
use App\Services\SmartInsight\SmartInsightProvider;


class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     *
     * @return void
     */
    public function register()
    {
        // F-032: sole Smart Insight provider (rule engine).
        $this->app->singleton(InsightRuleRegistry::class, function ($app) {
            return new InsightRuleRegistry([
                // Existing F-032 order preserved.
                $app->make(LowProgressRule::class),
                $app->make(HighProgressRule::class),
                $app->make(PerformanceImprovingRule::class),
                $app->make(PerformanceDecliningRule::class),
                $app->make(InactiveStudentRule::class),
                $app->make(OutstandingStudentRule::class),
                // F-037A — Progress rules expansion (append only).
                $app->make(MediumProgressRule::class),
                $app->make(FastProgressRule::class),
                $app->make(SlowProgressRule::class),
                $app->make(NoProgressRule::class),
                $app->make(ProgressImprovementRule::class),
                $app->make(ProgressRegressionRule::class),
                // F-037B — Performance rules expansion (append only).
                $app->make(ExcellentPerformanceRule::class),
                $app->make(AveragePerformanceRule::class),
                $app->make(WeakPerformanceRule::class),
                $app->make(RapidImprovementRule::class),
                $app->make(PerformanceDeclineRule::class),
                $app->make(InconsistentPerformanceRule::class),
                // F-037C — Standards rules expansion (append only).
                $app->make(StrongStandardsRule::class),
                $app->make(WeakStandardsRule::class),
                $app->make(StandardsGapRule::class),
                $app->make(StandardsImprovementRule::class),
                // F-037D — Assessment rules expansion (append only).
                $app->make(HighQuizAccuracyRule::class),
                $app->make(LowQuizAccuracyRule::class),
                $app->make(QuizImprovementRule::class),
                $app->make(RepeatedFailuresRule::class),
                $app->make(RepeatedSuccessRule::class),
                // F-037E — Learning Behaviour rules expansion (append only).
                $app->make(LowEngagementRule::class),
                $app->make(ExcellentEngagementRule::class),
                $app->make(IrregularLearningPatternRule::class),
                $app->make(ConsistentLearningPatternRule::class),
                $app->make(ReturningStudentRule::class),
                // F-037F — Risk rules expansion (append only).
                $app->make(AtRiskRule::class),
                $app->make(HighRiskRule::class),
                $app->make(CriticalRiskRule::class),
                $app->make(DropoutRiskRule::class),
                $app->make(InterventionRequiredRule::class),
                // F-037G — Achievement rules expansion (append only).
                $app->make(TopPerformerRule::class),
                $app->make(SubjectMasteryRule::class),
                $app->make(FastLearnerRule::class),
                $app->make(HighAchieverRule::class),
                $app->make(ConsistentExcellenceRule::class),
                $app->make(MilestoneAchievedRule::class),
                $app->make(LearningExcellenceRule::class),
                $app->make(OutstandingImprovementRule::class),
            ]);
        });

        $this->app->bind(
            StudentInsightProviderInterface::class,
            SmartInsightProvider::class
        );

        // F-022/F-025: ProgressWriter; lesson coverage is the first live source.
        $this->app->singleton(ProgressWriterService::class, function ($app) {
            return new ProgressWriterService(
                $app->make(StudentSubjectProgressRepository::class),
                [
                    $app->make(LessonCompletionCoverageSource::class),
                    $app->make(ScormCompletionCoverageSource::class),
                    $app->make(CurriculumCompletionEventCoverageSource::class),
                ]
            );
        });

        // F-041C/D — Assignment domain foundation (no Statistics / Notification services).
        $this->app->bind(AssignmentTargetResolverInterface::class, AssignmentTargetingService::class);
        $this->app->bind(AssignmentMaterialResolverInterface::class, AssignmentMaterialResolver::class);
        $this->app->bind(AssignmentAnalyticsInterface::class, AssignmentAnalyticsService::class);
        $this->app->singleton(AssignmentPermissionService::class);
        $this->app->singleton(AssignmentLifecycleService::class);
        $this->app->singleton(AssignmentService::class);
    }

    /**
     * Bootstrap any application services.
     *
     * @return void
     */
    public function boot()
    {
        Schema::defaultStringLength(191);
        Passport::routes();

        Lessons::observe(LessonsObserver::class);
        Quizes::observe(QuizesObserver::class);
        AssignsStudents::observe(AssignsStudentsObserver::class);
        StudentSubjectProgress::observe(StudentSubjectProgressObserver::class);
    }
}
