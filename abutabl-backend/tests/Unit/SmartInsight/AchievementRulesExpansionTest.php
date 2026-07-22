<?php

namespace Tests\Unit\SmartInsight;

use App\Services\SmartInsight\InsightRuleRegistry;
use App\Services\SmartInsight\Rules\ConsistentExcellenceRule;
use App\Services\SmartInsight\Rules\FastLearnerRule;
use App\Services\SmartInsight\Rules\HighAchieverRule;
use App\Services\SmartInsight\Rules\LearningExcellenceRule;
use App\Services\SmartInsight\Rules\MilestoneAchievedRule;
use App\Services\SmartInsight\Rules\OutstandingImprovementRule;
use App\Services\SmartInsight\Rules\SubjectMasteryRule;
use App\Services\SmartInsight\Rules\TopPerformerRule;
use App\Services\SmartInsight\SmartInsightEngine;
use Carbon\Carbon;
use Tests\TestCase;

/**
 * F-037G — Achievement rules expansion.
 */
class AchievementRulesExpansionTest extends TestCase
{
    private function config(): array
    {
        return [
            'achievement' => [
                'high_min' => 0.45,
                'excellence_min' => 0.7,
                'mastery_ratio_min' => 0.7,
                'fast_velocity_min' => 0.7,
                'improvement_min' => 0.55,
                'excellence_composite_min' => 0.65,
                'consistency_min' => 0.65,
            ],
            'engine' => [
                'max_insights' => 12,
            ],
        ];
    }

    private function context(array $overrides = []): array
    {
        return array_merge([
            'student_id' => 77,
            'class_id' => 21,
            'has_achievement_data' => true,
            'achievement_score' => 0.55,
            'achievement_level' => 'high',
            'achievement_confidence' => 0.72,
            'mastery_ratio' => 0.75,
            'mastered_subjects' => 2,
            'mastered_standards' => [],
            'improvement_score' => 0.6,
            'consistency_score' => 0.7,
            'learning_velocity' => 0.8,
            'excellence_score' => 0.7,
            'milestone_count' => 2,
            'achievement_positive_findings' => ['high_progress', 'excellent_performance'],
            'achievement_contributing_factors' => ['high_progress:80'],
            'top_performer_signal' => false,
            'subject_mastery_signal' => false,
            'fast_learner_signal' => false,
            'consistent_excellence_signal' => false,
            'outstanding_improvement_signal' => false,
            'progress' => 80,
            'performance' => 88,
            'quiz_accuracy' => 90,
            'engagement_score' => 75,
            'generated_at' => Carbon::now()->toIso8601String(),
            'config' => $this->config(),
        ], $overrides);
    }

    public function test_registry_includes_all_achievement_rules(): void
    {
        $registry = app(InsightRuleRegistry::class);
        $ids = $registry->ids();

        foreach ([
            'top_performer',
            'subject_mastery',
            'fast_learner',
            'high_achiever',
            'consistent_excellence',
            'milestone_achieved',
            'learning_excellence',
            'outstanding_improvement',
        ] as $id) {
            $this->assertContains($id, $ids);
        }

        $this->assertSame(45, $registry->count());
    }

    public function test_achievement_level_bands(): void
    {
        $high = (new HighAchieverRule())->evaluate($this->context([
            'achievement_level' => 'high',
            'achievement_score' => 0.55,
        ]));
        $this->assertNotNull($high);
        $this->assertSame('high_achiever', $high['id']);
        $this->assertArrayHasKey('recommendations', $high);
        $this->assertArrayHasKey('achievement_score', $high['supporting_metrics']);
        $this->assertArrayHasKey('confidence', $high);
        $this->assertGreaterThanOrEqual(0, $high['confidence']);
        $this->assertLessThanOrEqual(1, $high['confidence']);

        $excellence = (new LearningExcellenceRule())->evaluate($this->context([
            'achievement_level' => 'excellence',
            'achievement_score' => 0.85,
        ]));
        $this->assertNotNull($excellence);
        $this->assertSame('success', $excellence['severity']);

        $this->assertNull((new HighAchieverRule())->evaluate($this->context([
            'achievement_level' => 'excellence',
        ])));
        $this->assertNull((new LearningExcellenceRule())->evaluate($this->context([
            'achievement_level' => 'high',
        ])));
    }

    public function test_signal_based_achievement_rules(): void
    {
        $top = (new TopPerformerRule())->evaluate($this->context([
            'top_performer_signal' => true,
        ]));
        $this->assertNotNull($top);
        $this->assertSame('recognize_top_performer', $top['recommendations'][0]['action_type']);

        $mastery = (new SubjectMasteryRule())->evaluate($this->context([
            'subject_mastery_signal' => true,
        ]));
        $this->assertNotNull($mastery);

        $fast = (new FastLearnerRule())->evaluate($this->context([
            'fast_learner_signal' => true,
        ]));
        $this->assertNotNull($fast);

        $consistent = (new ConsistentExcellenceRule())->evaluate($this->context([
            'consistent_excellence_signal' => true,
        ]));
        $this->assertNotNull($consistent);

        $milestone = (new MilestoneAchievedRule())->evaluate($this->context([
            'milestone_count' => 3,
        ]));
        $this->assertNotNull($milestone);
        $this->assertSame(3, $milestone['supporting_metrics']['milestone_count']);

        $improve = (new OutstandingImprovementRule())->evaluate($this->context([
            'outstanding_improvement_signal' => true,
        ]));
        $this->assertNotNull($improve);

        $this->assertNull((new TopPerformerRule())->evaluate($this->context([
            'top_performer_signal' => false,
        ])));
        $this->assertNull((new MilestoneAchievedRule())->evaluate($this->context([
            'milestone_count' => 0,
        ])));
    }

    public function test_engine_resolves_achievement_level_conflicts(): void
    {
        $registry = new InsightRuleRegistry([
            new HighAchieverRule(),
            new LearningExcellenceRule(),
            new TopPerformerRule(),
            new MilestoneAchievedRule(),
        ]);
        $engine = new SmartInsightEngine($registry);

        $out = $engine->generate($this->context([
            'achievement_level' => 'excellence',
            'achievement_score' => 0.9,
            'top_performer_signal' => true,
            'milestone_count' => 2,
        ]));
        $ids = array_column($out, 'id');

        $this->assertContains('learning_excellence', $ids);
        $this->assertNotContains('high_achiever', $ids);
        $this->assertContains('top_performer', $ids);
        $this->assertContains('milestone_achieved', $ids);
    }

    public function test_different_students_different_achievement_insights(): void
    {
        $registry = app(InsightRuleRegistry::class);
        $engine = new SmartInsightEngine($registry);

        $high = array_column($engine->generate($this->context([
            'student_id' => 1,
            'achievement_level' => 'high',
            'achievement_score' => 0.5,
            'top_performer_signal' => false,
            'subject_mastery_signal' => false,
            'fast_learner_signal' => false,
            'consistent_excellence_signal' => false,
            'outstanding_improvement_signal' => false,
            'milestone_count' => 1,
        ])), 'id');

        $excellent = array_column($engine->generate($this->context([
            'student_id' => 2,
            'achievement_level' => 'excellence',
            'achievement_score' => 0.9,
            'top_performer_signal' => true,
            'subject_mastery_signal' => true,
            'fast_learner_signal' => true,
            'consistent_excellence_signal' => true,
            'outstanding_improvement_signal' => true,
            'milestone_count' => 4,
        ])), 'id');

        $this->assertContains('high_achiever', $high);
        $this->assertContains('learning_excellence', $excellent);
        $this->assertNotContains('learning_excellence', $high);
        $this->assertNotContains('high_achiever', $excellent);
    }

    public function test_insufficient_achievement_data_returns_null(): void
    {
        $this->assertNull((new HighAchieverRule())->evaluate($this->context([
            'has_achievement_data' => false,
            'achievement_level' => 'high',
        ])));
    }

    public function test_supporting_metrics_expose_achievement_fields(): void
    {
        $insight = (new LearningExcellenceRule())->evaluate($this->context([
            'achievement_level' => 'excellence',
            'achievement_score' => 0.88,
        ]));
        $this->assertNotNull($insight);
        $m = $insight['supporting_metrics'];

        foreach ([
            'achievement_score',
            'achievement_level',
            'achievement_confidence',
            'mastery_ratio',
            'mastered_subjects',
            'improvement_score',
            'consistency_score',
            'learning_velocity',
            'excellence_score',
            'milestone_count',
            'positive_findings',
            'contributing_factors',
        ] as $key) {
            $this->assertArrayHasKey($key, $m);
        }
    }
}
