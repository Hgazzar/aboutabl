<?php

namespace Tests\Unit\SmartInsight;

use App\Contracts\InsightRuleInterface;
use App\Services\SmartInsight\InsightRuleRegistry;
use App\Services\SmartInsight\SmartInsightEngine;
use Carbon\Carbon;
use Tests\TestCase;

/**
 * F-038 — Smart Insight rule coverage & production validation.
 */
class ProductionValidationTest extends TestCase
{
    private const ALLOWED_CATEGORIES = [
        'progress',
        'performance',
        'standards',
        'assessment',
        'learning_behaviour',
        'risk',
        'achievement',
    ];

    /** @var array<string, array{category: string, trigger: string}> */
    private const RULE_META = [
        'low_progress' => ['category' => 'progress', 'trigger' => 'has_progress_data && progress < low_threshold'],
        'high_progress' => ['category' => 'progress', 'trigger' => 'has_progress_data && progress >= high_threshold'],
        'performance_improving' => ['category' => 'performance', 'trigger' => 'snapshots delta >= improving_delta'],
        'performance_declining' => ['category' => 'performance', 'trigger' => 'snapshots delta <= -declining_delta'],
        'inactive_student' => ['category' => 'learning_behaviour', 'trigger' => 'days_since_activity >= inactive.days OR no activity'],
        'outstanding_student' => ['category' => 'achievement', 'trigger' => 'progress & performance >= outstanding mins'],
        'medium_progress' => ['category' => 'progress', 'trigger' => 'progress in [low, high)'],
        'fast_progress' => ['category' => 'progress', 'trigger' => 'progress_change >= fast_delta'],
        'slow_progress' => ['category' => 'progress', 'trigger' => '0 < progress_change <= slow_delta'],
        'no_progress' => ['category' => 'progress', 'trigger' => 'progress <= no_progress_max'],
        'progress_improvement' => ['category' => 'progress', 'trigger' => 'progress_change >= improve_delta'],
        'progress_regression' => ['category' => 'progress', 'trigger' => 'progress_change <= -regress_delta'],
        'excellent_performance' => ['category' => 'performance', 'trigger' => 'performance >= excellent_threshold'],
        'average_performance' => ['category' => 'performance', 'trigger' => 'performance in [average_low, excellent)'],
        'weak_performance' => ['category' => 'performance', 'trigger' => 'performance < weak_threshold'],
        'rapid_improvement' => ['category' => 'performance', 'trigger' => 'performance_delta >= rapid_improve_delta'],
        'performance_decline' => ['category' => 'performance', 'trigger' => 'performance_delta <= -strong_decline'],
        'inconsistent_performance' => ['category' => 'performance', 'trigger' => 'performance_stddev >= threshold'],
        'strong_standards' => ['category' => 'standards', 'trigger' => 'standards_average >= strong_average'],
        'weak_standards' => ['category' => 'standards', 'trigger' => 'standards_average < weak_average'],
        'standards_gap' => ['category' => 'standards', 'trigger' => 'standards_gap >= gap_ratio'],
        'standards_improvement' => ['category' => 'standards', 'trigger' => 'healthy average + mastery, low gap'],
        'high_quiz_accuracy' => ['category' => 'assessment', 'trigger' => 'quiz_accuracy >= high_accuracy'],
        'low_quiz_accuracy' => ['category' => 'assessment', 'trigger' => 'quiz_accuracy < low_accuracy'],
        'quiz_improvement' => ['category' => 'assessment', 'trigger' => 'quiz_improvement >= improve_delta'],
        'repeated_failures' => ['category' => 'assessment', 'trigger' => 'consecutive_failures >= threshold'],
        'repeated_success' => ['category' => 'assessment', 'trigger' => 'consecutive_successes >= threshold'],
        'low_engagement' => ['category' => 'learning_behaviour', 'trigger' => 'engagement_score < low_engagement'],
        'excellent_engagement' => ['category' => 'learning_behaviour', 'trigger' => 'engagement_score >= excellent_engagement'],
        'irregular_learning_pattern' => ['category' => 'learning_behaviour', 'trigger' => 'learning_consistency <= irregular_max'],
        'consistent_learning_pattern' => ['category' => 'learning_behaviour', 'trigger' => 'learning_consistency >= consistent_min'],
        'returning_student' => ['category' => 'learning_behaviour', 'trigger' => 'return_after_inactivity'],
        'at_risk' => ['category' => 'risk', 'trigger' => 'has_risk_data && risk_level=at_risk'],
        'high_risk' => ['category' => 'risk', 'trigger' => 'has_risk_data && risk_level=high'],
        'critical_risk' => ['category' => 'risk', 'trigger' => 'has_risk_data && risk_level=critical'],
        'dropout_risk' => ['category' => 'risk', 'trigger' => 'has_risk_data && dropout_signal'],
        'intervention_required' => ['category' => 'risk', 'trigger' => 'has_risk_data && intervention_signal'],
        'top_performer' => ['category' => 'achievement', 'trigger' => 'has_achievement_data && top_performer_signal'],
        'subject_mastery' => ['category' => 'achievement', 'trigger' => 'has_achievement_data && subject_mastery_signal'],
        'fast_learner' => ['category' => 'achievement', 'trigger' => 'has_achievement_data && fast_learner_signal'],
        'high_achiever' => ['category' => 'achievement', 'trigger' => 'has_achievement_data && achievement_level=high'],
        'consistent_excellence' => ['category' => 'achievement', 'trigger' => 'has_achievement_data && consistent_excellence_signal'],
        'milestone_achieved' => ['category' => 'achievement', 'trigger' => 'has_achievement_data && milestone_count > 0'],
        'learning_excellence' => ['category' => 'achievement', 'trigger' => 'has_achievement_data && achievement_level=excellence'],
        'outstanding_improvement' => ['category' => 'achievement', 'trigger' => 'has_achievement_data && outstanding_improvement_signal'],
    ];

    private function config(): array
    {
        return config('smart_insight');
    }

    private function baseContext(array $overrides = []): array
    {
        return array_merge([
            'student_id' => 100,
            'class_id' => 1,
            'teacher_id' => 1,
            'subject_ids' => [10, 11],
            'has_progress_data' => false,
            'has_performance_data' => false,
            'has_standards_data' => false,
            'has_assessment_data' => false,
            'has_learning_behaviour_data' => false,
            'has_risk_data' => false,
            'has_achievement_data' => false,
            'progress' => 0,
            'progress_percent' => 0,
            'performance' => 0,
            'performance_percent' => 0,
            'snapshots' => [],
            'generated_at' => Carbon::now()->toIso8601String(),
            'now' => Carbon::now(),
            'last_activity_at' => Carbon::now(),
            'config' => $this->config(),
        ], $overrides);
    }

    /**
     * Minimal context that should fire exactly the target rule when evaluated in isolation.
     *
     * @return array<string, array<string, mixed>>
     */
    private function triggerContexts(): array
    {
        $now = Carbon::now();

        return [
            'low_progress' => $this->baseContext([
                'has_progress_data' => true,
                'progress' => 20,
                'progress_percent' => 20,
            ]),
            'high_progress' => $this->baseContext([
                'has_progress_data' => true,
                'progress' => 80,
                'progress_percent' => 80,
                'performance_percent' => 50,
            ]),
            'performance_improving' => $this->baseContext([
                'snapshots' => [
                    ['performance_percent' => 50],
                    ['performance_percent' => 70],
                ],
            ]),
            'performance_declining' => $this->baseContext([
                'snapshots' => [
                    ['performance_percent' => 70],
                    ['performance_percent' => 50],
                ],
            ]),
            'inactive_student' => $this->baseContext([
                'last_activity_at' => $now->copy()->subDays(30),
                'now' => $now,
            ]),
            'outstanding_student' => $this->baseContext([
                'has_progress_data' => true,
                'progress' => 90,
                'progress_percent' => 90,
                'performance_percent' => 90,
            ]),
            'medium_progress' => $this->baseContext([
                'has_progress_data' => true,
                'progress' => 55,
                'progress_percent' => 55,
            ]),
            'fast_progress' => $this->baseContext([
                'has_progress_data' => true,
                'progress' => 50,
                'progress_percent' => 50,
                'progress_change' => 20,
            ]),
            'slow_progress' => $this->baseContext([
                'has_progress_data' => true,
                'progress' => 50,
                'progress_percent' => 50,
                'progress_change' => 2,
            ]),
            'no_progress' => $this->baseContext([
                'has_progress_data' => true,
                'progress' => 0,
                'progress_percent' => 0,
            ]),
            'progress_improvement' => $this->baseContext([
                'has_progress_data' => true,
                'progress' => 50,
                'progress_percent' => 50,
                'progress_change' => 8,
            ]),
            'progress_regression' => $this->baseContext([
                'has_progress_data' => true,
                'progress' => 50,
                'progress_percent' => 50,
                'progress_change' => -8,
            ]),
            'excellent_performance' => $this->baseContext([
                'has_performance_data' => true,
                'performance' => 90,
                'performance_percent' => 90,
            ]),
            'average_performance' => $this->baseContext([
                'has_performance_data' => true,
                'performance' => 65,
                'performance_percent' => 65,
            ]),
            'weak_performance' => $this->baseContext([
                'has_performance_data' => true,
                'performance' => 30,
                'performance_percent' => 30,
            ]),
            'rapid_improvement' => $this->baseContext([
                'has_performance_data' => true,
                'performance' => 70,
                'performance_delta' => 20,
                'performance_snapshot_count' => 3,
            ]),
            'performance_decline' => $this->baseContext([
                'has_performance_data' => true,
                'performance' => 40,
                'performance_delta' => -15,
                'performance_snapshot_count' => 3,
            ]),
            'inconsistent_performance' => $this->baseContext([
                'has_performance_data' => true,
                'performance' => 60,
                'performance_stddev' => 18,
                'performance_snapshot_count' => 4,
            ]),
            'strong_standards' => $this->baseContext([
                'has_standards_data' => true,
                'standards_average' => 85,
                'standards_mastered_ratio' => 0.8,
                'standards_gap' => 0.1,
            ]),
            'weak_standards' => $this->baseContext([
                'has_standards_data' => true,
                'standards_average' => 35,
                'standards_mastered_ratio' => 0.2,
                'standards_gap' => 0.6,
            ]),
            'standards_gap' => $this->baseContext([
                'has_standards_data' => true,
                'standards_average' => 55,
                'standards_mastered_ratio' => 0.3,
                'standards_gap' => 0.55,
                'weak_standards_count' => 5,
                'standards_total_count' => 9,
            ]),
            'standards_improvement' => $this->baseContext([
                'has_standards_data' => true,
                'standards_average' => 75,
                'standards_mastered_ratio' => 0.6,
                'standards_gap' => 0.2,
            ]),
            'high_quiz_accuracy' => $this->baseContext([
                'has_assessment_data' => true,
                'quiz_accuracy' => 90,
                'quiz_attempt_count' => 5,
            ]),
            'low_quiz_accuracy' => $this->baseContext([
                'has_assessment_data' => true,
                'quiz_accuracy' => 35,
                'quiz_attempt_count' => 5,
            ]),
            'quiz_improvement' => $this->baseContext([
                'has_assessment_data' => true,
                'quiz_accuracy' => 70,
                'quiz_improvement' => 15,
                'consecutive_failures' => 0,
            ]),
            'repeated_failures' => $this->baseContext([
                'has_assessment_data' => true,
                'quiz_accuracy' => 40,
                'consecutive_failures' => 4,
            ]),
            'repeated_success' => $this->baseContext([
                'has_assessment_data' => true,
                'quiz_accuracy' => 88,
                'consecutive_successes' => 4,
            ]),
            'low_engagement' => $this->baseContext([
                'has_learning_behaviour_data' => true,
                'engagement_score' => 10,
                'active_days' => 1,
                'learning_consistency' => 0.2,
            ]),
            'excellent_engagement' => $this->baseContext([
                'has_learning_behaviour_data' => true,
                'engagement_score' => 80,
                'active_days' => 10,
                'learning_consistency' => 0.8,
            ]),
            'irregular_learning_pattern' => $this->baseContext([
                'has_learning_behaviour_data' => true,
                'engagement_score' => 40,
                'active_days' => 4,
                'learning_consistency' => 0.2,
            ]),
            'consistent_learning_pattern' => $this->baseContext([
                'has_learning_behaviour_data' => true,
                'engagement_score' => 55,
                'active_days' => 8,
                'learning_consistency' => 0.8,
            ]),
            'returning_student' => $this->baseContext([
                'has_learning_behaviour_data' => true,
                'engagement_score' => 40,
                'return_after_inactivity' => true,
                'active_days' => 3,
                'last_activity_at' => $now->copy()->subDays(2),
            ]),
            'at_risk' => $this->baseContext([
                'has_risk_data' => true,
                'risk_level' => 'at_risk',
                'educational_risk_score' => 0.4,
                'risk_confidence' => 0.7,
            ]),
            'high_risk' => $this->baseContext([
                'has_risk_data' => true,
                'risk_level' => 'high',
                'educational_risk_score' => 0.6,
                'risk_confidence' => 0.75,
            ]),
            'critical_risk' => $this->baseContext([
                'has_risk_data' => true,
                'risk_level' => 'critical',
                'educational_risk_score' => 0.9,
                'risk_confidence' => 0.85,
            ]),
            'dropout_risk' => $this->baseContext([
                'has_risk_data' => true,
                'risk_level' => 'high',
                'educational_risk_score' => 0.8,
                'dropout_signal' => true,
                'risk_confidence' => 0.8,
            ]),
            'intervention_required' => $this->baseContext([
                'has_risk_data' => true,
                'risk_level' => 'high',
                'educational_risk_score' => 0.8,
                'intervention_signal' => true,
                'risk_confidence' => 0.8,
            ]),
            'top_performer' => $this->baseContext([
                'has_achievement_data' => true,
                'achievement_level' => 'high',
                'achievement_score' => 0.6,
                'top_performer_signal' => true,
                'achievement_confidence' => 0.8,
            ]),
            'subject_mastery' => $this->baseContext([
                'has_achievement_data' => true,
                'achievement_level' => 'high',
                'achievement_score' => 0.6,
                'subject_mastery_signal' => true,
                'mastery_ratio' => 0.85,
                'achievement_confidence' => 0.8,
            ]),
            'fast_learner' => $this->baseContext([
                'has_achievement_data' => true,
                'achievement_level' => 'high',
                'achievement_score' => 0.55,
                'fast_learner_signal' => true,
                'learning_velocity' => 0.9,
                'achievement_confidence' => 0.75,
            ]),
            'high_achiever' => $this->baseContext([
                'has_achievement_data' => true,
                'achievement_level' => 'high',
                'achievement_score' => 0.55,
                'achievement_confidence' => 0.75,
            ]),
            'consistent_excellence' => $this->baseContext([
                'has_achievement_data' => true,
                'achievement_level' => 'high',
                'achievement_score' => 0.6,
                'consistent_excellence_signal' => true,
                'consistency_score' => 0.8,
                'excellence_score' => 0.75,
                'achievement_confidence' => 0.8,
            ]),
            'milestone_achieved' => $this->baseContext([
                'has_achievement_data' => true,
                'achievement_level' => 'high',
                'achievement_score' => 0.5,
                'milestone_count' => 2,
                'achievement_confidence' => 0.7,
            ]),
            'learning_excellence' => $this->baseContext([
                'has_achievement_data' => true,
                'achievement_level' => 'excellence',
                'achievement_score' => 0.85,
                'achievement_confidence' => 0.85,
            ]),
            'outstanding_improvement' => $this->baseContext([
                'has_achievement_data' => true,
                'achievement_level' => 'high',
                'achievement_score' => 0.55,
                'outstanding_improvement_signal' => true,
                'improvement_score' => 0.8,
                'achievement_confidence' => 0.8,
            ]),
        ];
    }

    public function test_registry_has_exactly_45_production_rules(): void
    {
        $registry = app(InsightRuleRegistry::class);
        $this->assertSame(45, $registry->count());
        $this->assertSame(45, count(self::RULE_META));
        foreach (array_keys(self::RULE_META) as $id) {
            $this->assertTrue($registry->has($id), 'Missing registration: '.$id);
        }
    }

    public function test_every_production_rule_triggers_at_least_once(): void
    {
        $registry = app(InsightRuleRegistry::class);
        $triggers = $this->triggerContexts();
        $coverage = [];

        foreach ($registry->all() as $rule) {
            $this->assertInstanceOf(InsightRuleInterface::class, $rule);
            $id = $rule->id();
            $this->assertArrayHasKey($id, $triggers, 'No trigger context for '.$id);

            $executions = 0;
            $hit = $rule->evaluate($triggers[$id]);
            $executions++;
            $this->assertNotNull($hit, 'Rule never triggered: '.$id.' — '.$this->metaTrigger($id));
            $this->assertSame($id, $hit['id']);
            $this->assertContains($hit['category'], self::ALLOWED_CATEGORIES, 'Orphan category for '.$id.': '.$hit['category']);
            $this->assertSame(self::RULE_META[$id]['category'], $hit['category']);

            // Second execution confirms deterministic re-fire.
            $hit2 = $rule->evaluate($triggers[$id]);
            $executions++;
            $this->assertNotNull($hit2);

            $coverage[$id] = [
                'rule_name' => class_basename($rule),
                'rule_id' => $id,
                'category' => $hit['category'],
                'triggered' => true,
                'executions' => $executions,
                'trigger_conditions' => $this->metaTrigger($id),
                'reason_if_never_triggered' => null,
            ];
        }

        $this->assertCount(45, $coverage);
        foreach ($coverage as $row) {
            $this->assertTrue($row['triggered']);
            $this->assertGreaterThanOrEqual(2, $row['executions']);
        }
    }

    public function test_categories_have_no_orphans(): void
    {
        $registry = app(InsightRuleRegistry::class);
        $seen = [];
        foreach ($registry->all() as $rule) {
            $hit = $rule->evaluate($this->triggerContexts()[$rule->id()]);
            $this->assertNotNull($hit);
            $seen[$hit['category']] = true;
        }
        foreach (self::ALLOWED_CATEGORIES as $cat) {
            $this->assertArrayHasKey($cat, $seen, 'Missing category coverage: '.$cat);
        }
        $this->assertSame(count(self::ALLOWED_CATEGORIES), count($seen));
    }

    public function test_engine_rejects_contradictory_pairs(): void
    {
        $engine = new SmartInsightEngine(app(InsightRuleRegistry::class));
        $forbiddenPairs = [
            ['no_progress', 'high_progress'],
            ['low_progress', 'high_progress'],
            ['medium_progress', 'high_progress'],
            ['fast_progress', 'slow_progress'],
            ['progress_improvement', 'progress_regression'],
            ['excellent_performance', 'weak_performance'],
            ['excellent_performance', 'average_performance'],
            ['weak_performance', 'average_performance'],
            ['performance_improving', 'performance_declining'],
            ['rapid_improvement', 'performance_decline'],
            ['strong_standards', 'weak_standards'],
            ['standards_gap', 'standards_improvement'],
            ['high_quiz_accuracy', 'low_quiz_accuracy'],
            ['repeated_failures', 'repeated_success'],
            ['low_engagement', 'excellent_engagement'],
            ['irregular_learning_pattern', 'consistent_learning_pattern'],
            ['returning_student', 'inactive_student'],
            ['at_risk', 'high_risk'],
            ['at_risk', 'critical_risk'],
            ['high_risk', 'critical_risk'],
            ['learning_excellence', 'high_achiever'],
            ['learning_excellence', 'outstanding_student'],
            ['critical_risk', 'outstanding_student'],
            ['critical_risk', 'learning_excellence'],
            ['critical_risk', 'high_achiever'],
            ['critical_risk', 'top_performer'],
            ['fast_learner', 'fast_progress'],
        ];

        $students = [
            $this->baseContext([
                'student_id' => 1,
                'has_progress_data' => true,
                'progress' => 0,
                'progress_percent' => 0,
                'progress_change' => -10,
                'has_performance_data' => true,
                'performance' => 20,
                'performance_percent' => 20,
                'performance_delta' => -20,
                'performance_snapshot_count' => 4,
                'performance_stddev' => 20,
                'has_standards_data' => true,
                'standards_average' => 30,
                'standards_mastered_ratio' => 0.1,
                'standards_gap' => 0.7,
                'has_assessment_data' => true,
                'quiz_accuracy' => 25,
                'consecutive_failures' => 4,
                'has_learning_behaviour_data' => true,
                'engagement_score' => 5,
                'learning_consistency' => 0.1,
                'active_days' => 1,
                'last_activity_at' => Carbon::now()->subDays(40),
                'has_risk_data' => true,
                'risk_level' => 'critical',
                'educational_risk_score' => 0.95,
                'dropout_signal' => true,
                'intervention_signal' => true,
                'risk_confidence' => 0.9,
                'has_achievement_data' => true,
                'achievement_level' => 'excellence',
                'achievement_score' => 0.9,
                'top_performer_signal' => true,
                'consistent_excellence_signal' => true,
                'milestone_count' => 3,
                'config' => array_merge($this->config(), ['engine' => ['max_insights' => 50]]),
            ]),
            $this->baseContext([
                'student_id' => 2,
                'has_progress_data' => true,
                'progress' => 92,
                'progress_percent' => 92,
                'progress_change' => 20,
                'performance_percent' => 92,
                'has_performance_data' => true,
                'performance' => 92,
                'performance_delta' => 18,
                'performance_snapshot_count' => 3,
                'snapshots' => [
                    ['performance_percent' => 70],
                    ['performance_percent' => 92],
                ],
                'has_standards_data' => true,
                'standards_average' => 88,
                'standards_mastered_ratio' => 0.85,
                'standards_gap' => 0.1,
                'has_assessment_data' => true,
                'quiz_accuracy' => 95,
                'consecutive_successes' => 4,
                'quiz_improvement' => 12,
                'has_learning_behaviour_data' => true,
                'engagement_score' => 85,
                'learning_consistency' => 0.9,
                'active_days' => 12,
                'has_achievement_data' => true,
                'achievement_level' => 'excellence',
                'achievement_score' => 0.9,
                'top_performer_signal' => true,
                'subject_mastery_signal' => true,
                'fast_learner_signal' => true,
                'consistent_excellence_signal' => true,
                'outstanding_improvement_signal' => true,
                'milestone_count' => 4,
                'achievement_confidence' => 0.9,
                'config' => array_merge($this->config(), ['engine' => ['max_insights' => 50]]),
            ]),
            $this->baseContext([
                'student_id' => 3,
                'has_progress_data' => true,
                'progress' => 55,
                'progress_percent' => 55,
                'progress_change' => 2,
                'has_performance_data' => true,
                'performance' => 60,
                'performance_percent' => 60,
                'has_risk_data' => true,
                'risk_level' => 'at_risk',
                'educational_risk_score' => 0.4,
                'risk_confidence' => 0.6,
                'has_achievement_data' => true,
                'achievement_level' => 'high',
                'achievement_score' => 0.5,
                'milestone_count' => 1,
                'config' => array_merge($this->config(), ['engine' => ['max_insights' => 50]]),
            ]),
        ];

        $allIds = [];
        foreach ($students as $ctx) {
            $ids = array_column($engine->generate($ctx), 'id');
            $allIds[$ctx['student_id']] = $ids;
            $set = array_flip($ids);
            foreach ($forbiddenPairs as [$a, $b]) {
                $this->assertFalse(
                    isset($set[$a]) && isset($set[$b]),
                    "Student {$ctx['student_id']} received contradictory pair {$a} + {$b}"
                );
            }
        }

        $this->assertNotEquals($allIds[1], $allIds[2]);
        $this->assertNotEquals($allIds[2], $allIds[3]);
    }

    public function test_critical_risk_suppresses_celebratory_achievement(): void
    {
        $engine = new SmartInsightEngine(app(InsightRuleRegistry::class));
        $ids = array_column($engine->generate($this->baseContext([
            'has_risk_data' => true,
            'risk_level' => 'critical',
            'educational_risk_score' => 0.95,
            'risk_confidence' => 0.9,
            'has_progress_data' => true,
            'progress' => 90,
            'progress_percent' => 90,
            'performance_percent' => 90,
            'has_achievement_data' => true,
            'achievement_level' => 'excellence',
            'achievement_score' => 0.9,
            'top_performer_signal' => true,
            'consistent_excellence_signal' => true,
            'config' => array_merge($this->config(), ['engine' => ['max_insights' => 50]]),
        ])), 'id');

        $this->assertContains('critical_risk', $ids);
        $this->assertNotContains('learning_excellence', $ids);
        $this->assertNotContains('outstanding_student', $ids);
        $this->assertNotContains('high_achiever', $ids);
        $this->assertNotContains('top_performer', $ids);
        $this->assertNotContains('consistent_excellence', $ids);
    }

    public function test_rules_are_context_only_no_write_imports(): void
    {
        $dir = app_path('Services/SmartInsight');
        $iterator = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($dir));
        $forbidden = [
            'ProgressWriterService',
            'StudentSubjectProgressRepository',
            'PerformanceSnapshotRecorder',
            'PerformanceSnapshotTrigger',
            '->save(',
            '->update(',
            '->delete(',
            '::insert(',
            'DB::table',
        ];

        foreach ($iterator as $file) {
            if (! $file->isFile() || $file->getExtension() !== 'php') {
                continue;
            }
            $path = $file->getPathname();
            if (strpos($path, DIRECTORY_SEPARATOR.'Rules'.DIRECTORY_SEPARATOR) === false
                && basename($path) !== 'SmartInsightProvider.php'
                && basename($path) !== 'SmartInsightEngine.php'
                && basename($path) !== 'InsightQualityCalibrator.php'
                && substr(basename($path), -strlen('RuleSupport.php')) !== 'RuleSupport.php'
                && basename($path) !== 'InsightDto.php'
                && basename($path) !== 'InsightRuleRegistry.php'
            ) {
                // InsightMetricsReader may read models; still must not write.
                if (basename($path) === 'InsightMetricsReader.php') {
                    $src = file_get_contents($path);
                    foreach (['->save(', '->update(', '->delete(', '::insert(', 'ProgressWriterService'] as $needle) {
                        $this->assertStringNotContainsString($needle, $src, $path);
                    }
                }
                continue;
            }

            $src = file_get_contents($path);
            foreach ($forbidden as $needle) {
                $this->assertStringNotContainsString($needle, $src, $path.' contains '.$needle);
            }
        }
    }

    public function test_rules_do_not_import_repositories(): void
    {
        $rulesDir = app_path('Services/SmartInsight/Rules');
        foreach (glob($rulesDir.'/*.php') as $path) {
            $src = file_get_contents($path);
            $this->assertStringNotContainsString('Repository', $src, basename($path));
            $this->assertStringNotContainsString('ProgressWriter', $src, basename($path));
            $this->assertStringNotContainsString('DB::', $src, basename($path));
            $this->assertDoesNotMatchRegularExpression('/use App\\\\Models\\\\/', $src, basename($path));
        }
    }

    private function metaTrigger(string $id): string
    {
        return self::RULE_META[$id]['trigger'] ?? 'unknown';
    }
}
