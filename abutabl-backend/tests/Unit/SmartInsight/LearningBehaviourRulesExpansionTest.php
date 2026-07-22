<?php

namespace Tests\Unit\SmartInsight;

use App\Services\SmartInsight\InsightRuleRegistry;
use App\Services\SmartInsight\Rules\ConsistentLearningPatternRule;
use App\Services\SmartInsight\Rules\ExcellentEngagementRule;
use App\Services\SmartInsight\Rules\InactiveStudentRule;
use App\Services\SmartInsight\Rules\IrregularLearningPatternRule;
use App\Services\SmartInsight\Rules\LowEngagementRule;
use App\Services\SmartInsight\Rules\ReturningStudentRule;
use App\Services\SmartInsight\SmartInsightEngine;
use Carbon\Carbon;
use Tests\TestCase;

/**
 * F-037E — Learning Behaviour rules expansion.
 */
class LearningBehaviourRulesExpansionTest extends TestCase
{
    private function config(): array
    {
        return [
            'inactive' => [
                'days' => 14,
            ],
            'learning_behaviour' => [
                'window_days' => 30,
                'low_engagement_threshold' => 25,
                'excellent_engagement_threshold' => 70,
                'consistent_min_score' => 0.65,
                'irregular_max_score' => 0.35,
                'min_active_days_for_pattern' => 3,
                'return_gap_days' => 14,
                'return_recent_days' => 7,
            ],
            'engine' => [
                'max_insights' => 8,
            ],
        ];
    }

    private function context(array $overrides = []): array
    {
        return array_merge([
            'student_id' => 101,
            'class_id' => 21,
            'has_learning_behaviour_data' => true,
            'engagement_score' => 40.0,
            'engagement_trend' => 'stable',
            'study_days' => 5,
            'active_days' => 5,
            'inactive_days' => 25,
            'weekly_activity' => 3,
            'monthly_activity' => 8,
            'session_count' => 8,
            'average_session_time' => null,
            'learning_consistency' => 0.5,
            'return_after_inactivity' => false,
            'activity_distribution' => ['Mon' => 2, 'Wed' => 3],
            'behaviour_confidence' => 0.7,
            'last_activity_at' => Carbon::now()->subDays(2),
            'now' => Carbon::now(),
            'generated_at' => Carbon::now()->toIso8601String(),
            'config' => $this->config(),
        ], $overrides);
    }

    public function test_registry_includes_all_behaviour_rules(): void
    {
        $registry = app(InsightRuleRegistry::class);
        $ids = $registry->ids();

        foreach ([
            'low_engagement',
            'excellent_engagement',
            'irregular_learning_pattern',
            'consistent_learning_pattern',
            'returning_student',
            'inactive_student',
        ] as $id) {
            $this->assertContains($id, $ids);
        }

        $this->assertSame(45, $registry->count());
    }

    public function test_low_vs_excellent_engagement(): void
    {
        $low = new LowEngagementRule();
        $excellent = new ExcellentEngagementRule();

        $l = $low->evaluate($this->context(['engagement_score' => 10]));
        $this->assertNotNull($l);
        $this->assertSame('low_engagement', $l['id']);
        $this->assertArrayHasKey('recommendations', $l);
        $this->assertSame('reengage', $l['recommendations'][0]['action_type']);
        $this->assertArrayHasKey('confidence', $l);
        $this->assertGreaterThanOrEqual(0, $l['confidence']);
        $this->assertLessThanOrEqual(1, $l['confidence']);

        $e = $excellent->evaluate($this->context(['engagement_score' => 85]));
        $this->assertNotNull($e);
        $this->assertSame('excellent_engagement', $e['id']);
        $this->assertArrayHasKey('recommendations', $e);

        $this->assertNull($low->evaluate($this->context(['engagement_score' => 85])));
        $this->assertNull($excellent->evaluate($this->context(['engagement_score' => 10])));
    }

    public function test_consistent_vs_irregular_pattern(): void
    {
        $consistent = new ConsistentLearningPatternRule();
        $irregular = new IrregularLearningPatternRule();

        $c = $consistent->evaluate($this->context([
            'learning_consistency' => 0.8,
            'active_days' => 5,
        ]));
        $this->assertNotNull($c);

        $i = $irregular->evaluate($this->context([
            'learning_consistency' => 0.2,
            'active_days' => 5,
        ]));
        $this->assertNotNull($i);

        $this->assertNull($consistent->evaluate($this->context([
            'learning_consistency' => 0.2,
            'active_days' => 5,
        ])));
        $this->assertNull($irregular->evaluate($this->context([
            'learning_consistency' => 0.8,
            'active_days' => 5,
        ])));
        $this->assertNull($consistent->evaluate($this->context([
            'learning_consistency' => 0.9,
            'active_days' => 1,
        ])));
    }

    public function test_returning_student_and_insufficient_data(): void
    {
        $returning = new ReturningStudentRule();
        $hit = $returning->evaluate($this->context([
            'return_after_inactivity' => true,
        ]));
        $this->assertNotNull($hit);
        $this->assertSame('returning_student', $hit['id']);
        $this->assertSame('welcome_back', $hit['recommendations'][0]['action_type']);

        $this->assertNull($returning->evaluate($this->context([
            'return_after_inactivity' => false,
        ])));
        $this->assertNull((new LowEngagementRule())->evaluate($this->context([
            'has_learning_behaviour_data' => false,
            'engagement_score' => 5,
        ])));
    }

    public function test_engine_resolves_behaviour_conflicts(): void
    {
        $registry = new InsightRuleRegistry([
            new LowEngagementRule(),
            new ExcellentEngagementRule(),
            new IrregularLearningPatternRule(),
            new ConsistentLearningPatternRule(),
            new ReturningStudentRule(),
            new InactiveStudentRule(),
        ]);
        $engine = new SmartInsightEngine($registry);

        $excellentOut = $engine->generate($this->context([
            'engagement_score' => 90,
            'learning_consistency' => 0.8,
            'active_days' => 8,
            'return_after_inactivity' => true,
            'last_activity_at' => Carbon::now()->subDays(1),
        ]));
        $ids = array_column($excellentOut, 'id');
        $this->assertContains('excellent_engagement', $ids);
        $this->assertNotContains('low_engagement', $ids);
        $this->assertContains('consistent_learning_pattern', $ids);
        $this->assertNotContains('irregular_learning_pattern', $ids);
        // Returning wins over inactive when both eligible (returning priority 29 < inactive 30).
        $this->assertContains('returning_student', $ids);
        $this->assertNotContains('inactive_student', $ids);
    }

    public function test_different_students_different_behaviour_insights(): void
    {
        $registry = app(InsightRuleRegistry::class);
        $engine = new SmartInsightEngine($registry);

        $low = array_column($engine->generate($this->context([
            'student_id' => 1,
            'engagement_score' => 8,
            'learning_consistency' => 0.2,
            'active_days' => 4,
            'return_after_inactivity' => false,
        ])), 'id');

        $high = array_column($engine->generate($this->context([
            'student_id' => 2,
            'engagement_score' => 88,
            'learning_consistency' => 0.85,
            'active_days' => 10,
            'return_after_inactivity' => false,
        ])), 'id');

        $this->assertContains('low_engagement', $low);
        $this->assertContains('excellent_engagement', $high);
        $this->assertNotContains('excellent_engagement', $low);
        $this->assertNotContains('low_engagement', $high);
    }
}
