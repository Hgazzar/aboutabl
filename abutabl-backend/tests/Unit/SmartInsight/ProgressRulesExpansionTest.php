<?php

namespace Tests\Unit\SmartInsight;

use App\Services\SmartInsight\InsightRuleRegistry;
use App\Services\SmartInsight\Rules\FastProgressRule;
use App\Services\SmartInsight\Rules\HighProgressRule;
use App\Services\SmartInsight\Rules\LowProgressRule;
use App\Services\SmartInsight\Rules\MediumProgressRule;
use App\Services\SmartInsight\Rules\NoProgressRule;
use App\Services\SmartInsight\Rules\ProgressImprovementRule;
use App\Services\SmartInsight\Rules\ProgressRegressionRule;
use App\Services\SmartInsight\Rules\SlowProgressRule;
use App\Services\SmartInsight\SmartInsightEngine;
use Carbon\Carbon;
use Tests\TestCase;

/**
 * F-037A — Progress rules expansion.
 */
class ProgressRulesExpansionTest extends TestCase
{
    private function config(): array
    {
        return [
            'progress' => [
                'low_threshold' => 40,
                'high_threshold' => 70,
                'no_progress_max' => 0,
                'fast_delta_percent' => 15,
                'slow_delta_percent' => 3,
                'improve_delta_percent' => 5,
                'regress_delta_percent' => 5,
                'trend_min_snapshots' => 2,
            ],
            'outstanding' => [
                'min_progress_percent' => 85,
                'min_performance_percent' => 85,
            ],
            'engine' => [
                'max_insights' => 8,
            ],
        ];
    }

    private function context(array $overrides = []): array
    {
        return array_merge([
            'student_id' => 1,
            'class_id' => 21,
            'progress' => 50.0,
            'progress_percent' => 50.0,
            'has_progress_data' => true,
            'progress_change' => null,
            'progress_trend' => null,
            'progress_from' => null,
            'progress_to' => null,
            'progress_snapshot_count' => 0,
            'completed_lessons' => 2,
            'total_lessons' => 10,
            'completion_percentage' => 20.0,
            'lesson_completion' => [
                'completed_lessons' => 2,
                'total_lessons' => 10,
                'completion_percentage' => 20.0,
            ],
            'ssp_row_count' => 1,
            'snapshots' => [],
            'last_activity_at' => Carbon::now(),
            'now' => Carbon::now(),
            'generated_at' => Carbon::now()->toIso8601String(),
            'config' => $this->config(),
        ], $overrides);
    }

    public function test_registry_includes_all_progress_rules(): void
    {
        $registry = app(InsightRuleRegistry::class);
        $ids = $registry->ids();

        foreach ([
            'low_progress',
            'medium_progress',
            'high_progress',
            'fast_progress',
            'slow_progress',
            'no_progress',
            'progress_improvement',
            'progress_regression',
        ] as $id) {
            $this->assertContains($id, $ids);
        }

        $this->assertSame(45, $registry->count());
    }

    public function test_medium_progress_band(): void
    {
        $rule = new MediumProgressRule();
        $hit = $rule->evaluate($this->context(['progress' => 55, 'progress_percent' => 55]));
        $this->assertNotNull($hit);
        $this->assertSame('medium_progress', $hit['id']);
        $this->assertSame('progress', $hit['category']);
        $this->assertArrayHasKey('confidence', $hit);
        $this->assertGreaterThanOrEqual(0, $hit['confidence']);
        $this->assertLessThanOrEqual(1, $hit['confidence']);
        $this->assertArrayHasKey('progress', $hit['supporting_metrics']);

        $this->assertNull($rule->evaluate($this->context(['progress' => 20, 'progress_percent' => 20])));
        $this->assertNull($rule->evaluate($this->context(['progress' => 75, 'progress_percent' => 75])));
    }

    public function test_no_progress_rule(): void
    {
        $rule = new NoProgressRule();
        $hit = $rule->evaluate($this->context(['progress' => 0, 'progress_percent' => 0]));
        $this->assertNotNull($hit);
        $this->assertSame('no_progress', $hit['id']);
        $this->assertSame('critical', $hit['severity']);
        $this->assertNull($rule->evaluate($this->context(['progress' => 1, 'progress_percent' => 1])));
    }

    public function test_fast_and_slow_progress_pace(): void
    {
        $fast = new FastProgressRule();
        $slow = new SlowProgressRule();

        $fastHit = $fast->evaluate($this->context([
            'progress_change' => 20,
            'progress_trend' => 'improving',
            'progress_from' => 10,
            'progress_to' => 30,
            'progress_snapshot_count' => 3,
        ]));
        $this->assertNotNull($fastHit);
        $this->assertSame('improving', $fastHit['trend']);
        $this->assertNull($slow->evaluate($this->context([
            'progress_change' => 20,
            'progress_snapshot_count' => 3,
        ])));

        $slowHit = $slow->evaluate($this->context([
            'progress_change' => 2,
            'progress_trend' => 'stable',
            'progress_snapshot_count' => 2,
        ]));
        $this->assertNotNull($slowHit);
        $this->assertSame('stable', $slowHit['trend']);
        $this->assertNull($fast->evaluate($this->context([
            'progress_change' => 2,
            'progress_snapshot_count' => 2,
        ])));
    }

    public function test_progress_improvement_and_regression(): void
    {
        $improve = new ProgressImprovementRule();
        $regress = new ProgressRegressionRule();

        $up = $improve->evaluate($this->context([
            'progress_change' => 8,
            'progress_trend' => 'improving',
            'progress_snapshot_count' => 2,
        ]));
        $this->assertNotNull($up);
        $this->assertSame('improving', $up['trend']);

        $down = $regress->evaluate($this->context([
            'progress_change' => -8,
            'progress_trend' => 'declining',
            'progress_snapshot_count' => 2,
        ]));
        $this->assertNotNull($down);
        $this->assertSame('declining', $down['trend']);

        $this->assertNull($improve->evaluate($this->context(['progress_change' => -8])));
        $this->assertNull($regress->evaluate($this->context(['progress_change' => 8])));
    }

    public function test_engine_resolves_progress_band_conflicts(): void
    {
        $registry = new InsightRuleRegistry([
            new LowProgressRule(),
            new MediumProgressRule(),
            new HighProgressRule(),
            new NoProgressRule(),
        ]);
        $engine = new SmartInsightEngine($registry);

        // Zero progress: no_progress wins over low_progress.
        $zero = $engine->generate($this->context([
            'progress' => 0,
            'progress_percent' => 0,
        ]));
        $ids = array_column($zero, 'id');
        $this->assertContains('no_progress', $ids);
        $this->assertNotContains('low_progress', $ids);
        $this->assertNotContains('medium_progress', $ids);

        // Medium band only.
        $mid = $engine->generate($this->context([
            'progress' => 55,
            'progress_percent' => 55,
        ]));
        $this->assertSame(['medium_progress'], array_column($mid, 'id'));
    }

    public function test_engine_resolves_pace_and_trend_conflicts(): void
    {
        $registry = new InsightRuleRegistry([
            new FastProgressRule(),
            new SlowProgressRule(),
            new ProgressImprovementRule(),
            new ProgressRegressionRule(),
        ]);
        $engine = new SmartInsightEngine($registry);

        $fast = $engine->generate($this->context([
            'progress_change' => 20,
            'progress_trend' => 'improving',
            'progress_snapshot_count' => 3,
        ]));
        $ids = array_column($fast, 'id');
        $this->assertContains('fast_progress', $ids);
        $this->assertNotContains('slow_progress', $ids);
        // Improvement can coexist with fast (different dimension).
        $this->assertContains('progress_improvement', $ids);

        $regress = $engine->generate($this->context([
            'progress_change' => -10,
            'progress_trend' => 'declining',
            'progress_snapshot_count' => 2,
        ]));
        $rIds = array_column($regress, 'id');
        $this->assertContains('progress_regression', $rIds);
        $this->assertNotContains('progress_improvement', $rIds);
    }

    public function test_failing_rule_does_not_stop_others(): void
    {
        $broken = new class implements \App\Contracts\InsightRuleInterface {
            public function id(): string
            {
                return 'broken_rule';
            }

            public function evaluate(array $context): ?array
            {
                throw new \RuntimeException('boom');
            }
        };

        $registry = new InsightRuleRegistry([
            $broken,
            new MediumProgressRule(),
        ]);
        $engine = new SmartInsightEngine($registry);
        $out = $engine->generate($this->context([
            'progress' => 55,
            'progress_percent' => 55,
        ]));

        $this->assertSame(['medium_progress'], array_column($out, 'id'));
    }

    public function test_different_progress_values_yield_different_insights(): void
    {
        $registry = app(InsightRuleRegistry::class);
        $engine = new SmartInsightEngine($registry);

        $low = array_column($engine->generate($this->context([
            'progress' => 15,
            'progress_percent' => 15,
            'progress_change' => null,
        ])), 'id');

        $mid = array_column($engine->generate($this->context([
            'progress' => 55,
            'progress_percent' => 55,
            'progress_change' => null,
        ])), 'id');

        $high = array_column($engine->generate($this->context([
            'progress' => 75,
            'progress_percent' => 75,
            'progress_change' => null,
        ])), 'id');

        $this->assertContains('low_progress', $low);
        $this->assertContains('medium_progress', $mid);
        $this->assertContains('high_progress', $high);
        $this->assertNotSame($low, $mid);
        $this->assertNotSame($mid, $high);
    }
}
