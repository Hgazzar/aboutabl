<?php

namespace Tests\Unit\SmartInsight;

use App\Services\SmartInsight\InsightRuleRegistry;
use App\Services\SmartInsight\Rules\AveragePerformanceRule;
use App\Services\SmartInsight\Rules\ExcellentPerformanceRule;
use App\Services\SmartInsight\Rules\InconsistentPerformanceRule;
use App\Services\SmartInsight\Rules\PerformanceDeclineRule;
use App\Services\SmartInsight\Rules\PerformanceDecliningRule;
use App\Services\SmartInsight\Rules\PerformanceImprovingRule;
use App\Services\SmartInsight\Rules\RapidImprovementRule;
use App\Services\SmartInsight\Rules\WeakPerformanceRule;
use App\Services\SmartInsight\SmartInsightEngine;
use Carbon\Carbon;
use Tests\TestCase;

/**
 * F-037B — Performance rules expansion.
 */
class PerformanceRulesExpansionTest extends TestCase
{
    private function config(): array
    {
        return [
            'performance' => [
                'improving_delta_percent' => 5,
                'declining_delta_percent' => 5,
                'decline_min_snapshots' => 2,
                'improve_min_snapshots' => 2,
                'excellent_threshold' => 85,
                'average_low_threshold' => 50,
                'weak_threshold' => 50,
                'rapid_improve_delta_percent' => 15,
                'strong_decline_delta_percent' => 10,
                'strong_decline_min_snapshots' => 3,
                'inconsistent_stddev_threshold' => 12,
                'inconsistent_min_snapshots' => 3,
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
            'has_performance_data' => true,
            'performance' => 60.0,
            'performance_percent' => 60.0,
            'performance_average' => 60.0,
            'performance_trend' => 'stable',
            'performance_delta' => 0.0,
            'performance_history' => [60.0, 60.0],
            'performance_snapshot_count' => 2,
            'performance_stddev' => 0.0,
            'risk_score' => 0.0,
            'snapshots' => [],
            'generated_at' => Carbon::now()->toIso8601String(),
            'config' => $this->config(),
        ], $overrides);
    }

    public function test_registry_includes_all_performance_rules(): void
    {
        $registry = app(InsightRuleRegistry::class);
        $ids = $registry->ids();

        foreach ([
            'excellent_performance',
            'average_performance',
            'weak_performance',
            'rapid_improvement',
            'performance_decline',
            'inconsistent_performance',
        ] as $id) {
            $this->assertContains($id, $ids);
        }

        $this->assertSame(45, $registry->count());
    }

    public function test_excellent_vs_weak_bands(): void
    {
        $excellent = new ExcellentPerformanceRule();
        $weak = new WeakPerformanceRule();
        $average = new AveragePerformanceRule();

        $ex = $excellent->evaluate($this->context([
            'performance' => 90,
            'performance_percent' => 90,
        ]));
        $this->assertNotNull($ex);
        $this->assertSame('excellent_performance', $ex['id']);
        $this->assertArrayHasKey('confidence', $ex);
        $this->assertGreaterThanOrEqual(0, $ex['confidence']);
        $this->assertLessThanOrEqual(1, $ex['confidence']);
        $this->assertArrayHasKey('positive_findings', $ex);
        $this->assertArrayHasKey('performance', $ex['supporting_metrics']);

        $wk = $weak->evaluate($this->context([
            'performance' => 30,
            'performance_percent' => 30,
            'risk_score' => 0.4,
        ]));
        $this->assertNotNull($wk);
        $this->assertSame('weak_performance', $wk['id']);
        $this->assertArrayHasKey('risk_indicators', $wk);
        $this->assertArrayHasKey('weaknesses', $wk);

        $this->assertNull($excellent->evaluate($this->context(['performance' => 30])));
        $this->assertNull($weak->evaluate($this->context(['performance' => 90])));
        $this->assertNotNull($average->evaluate($this->context(['performance' => 65])));
        $this->assertNull($average->evaluate($this->context(['performance' => 90])));
        $this->assertNull($average->evaluate($this->context(['performance' => 40])));
    }

    public function test_rapid_improvement_vs_decline(): void
    {
        $rapid = new RapidImprovementRule();
        $decline = new PerformanceDeclineRule();

        $up = $rapid->evaluate($this->context([
            'performance_delta' => 20,
            'performance_snapshot_count' => 3,
            'performance_trend' => 'improving',
        ]));
        $this->assertNotNull($up);
        $this->assertSame('improving', $up['trend']);

        $down = $decline->evaluate($this->context([
            'performance_delta' => -12,
            'performance_snapshot_count' => 3,
            'performance_trend' => 'declining',
        ]));
        $this->assertNotNull($down);
        $this->assertSame('declining', $down['trend']);

        $this->assertNull($rapid->evaluate($this->context([
            'performance_delta' => -12,
            'performance_snapshot_count' => 3,
        ])));
        $this->assertNull($decline->evaluate($this->context([
            'performance_delta' => 20,
            'performance_snapshot_count' => 3,
        ])));
    }

    public function test_inconsistent_performance(): void
    {
        $rule = new InconsistentPerformanceRule();
        $hit = $rule->evaluate($this->context([
            'performance_stddev' => 18,
            'performance_snapshot_count' => 4,
            'performance_history' => [40, 80, 45, 85],
        ]));
        $this->assertNotNull($hit);
        $this->assertSame('inconsistent_performance', $hit['id']);
        $this->assertNull($rule->evaluate($this->context([
            'performance_stddev' => 4,
            'performance_snapshot_count' => 4,
        ])));
    }

    public function test_engine_avoids_duplicate_performance_bands(): void
    {
        $registry = new InsightRuleRegistry([
            new ExcellentPerformanceRule(),
            new AveragePerformanceRule(),
            new WeakPerformanceRule(),
        ]);
        $engine = new SmartInsightEngine($registry);

        $out = $engine->generate($this->context([
            'performance' => 92,
            'performance_percent' => 92,
        ]));
        $this->assertSame(['excellent_performance'], array_column($out, 'id'));

        $weakOut = $engine->generate($this->context([
            'performance' => 25,
            'performance_percent' => 25,
        ]));
        $this->assertSame(['weak_performance'], array_column($weakOut, 'id'));
    }

    public function test_engine_resolves_trend_conflicts(): void
    {
        $registry = new InsightRuleRegistry([
            new RapidImprovementRule(),
            new PerformanceImprovingRule(),
            new PerformanceDeclineRule(),
            new PerformanceDecliningRule(),
        ]);
        $engine = new SmartInsightEngine($registry);

        // Rapid + mild improving both eligible via context/snapshots for improving rule.
        $ctx = $this->context([
            'performance_delta' => 20,
            'performance_snapshot_count' => 3,
            'performance_trend' => 'improving',
            'snapshots' => [
                ['performance_percent' => 50],
                ['performance_percent' => 70],
            ],
        ]);
        $ids = array_column($engine->generate($ctx), 'id');
        $this->assertContains('rapid_improvement', $ids);
        $this->assertNotContains('performance_improving', $ids);

        $declineCtx = $this->context([
            'performance_delta' => -15,
            'performance_snapshot_count' => 3,
            'performance_trend' => 'declining',
            'snapshots' => [
                ['performance_percent' => 80],
                ['performance_percent' => 70],
                ['performance_percent' => 65],
            ],
        ]);
        $dIds = array_column($engine->generate($declineCtx), 'id');
        $this->assertContains('performance_decline', $dIds);
        $this->assertNotContains('performance_declining', $dIds);
        $this->assertNotContains('rapid_improvement', $dIds);
    }

    public function test_different_students_different_performance_insights(): void
    {
        $registry = app(InsightRuleRegistry::class);
        $engine = new SmartInsightEngine($registry);

        $excellent = array_column($engine->generate($this->context([
            'performance' => 92,
            'performance_percent' => 92,
            'performance_delta' => null,
            'performance_snapshot_count' => 1,
        ])), 'id');

        $weak = array_column($engine->generate($this->context([
            'performance' => 28,
            'performance_percent' => 28,
            'performance_delta' => null,
            'performance_snapshot_count' => 1,
            'risk_score' => 0.5,
        ])), 'id');

        $this->assertContains('excellent_performance', $excellent);
        $this->assertContains('weak_performance', $weak);
        $this->assertNotContains('weak_performance', $excellent);
        $this->assertNotContains('excellent_performance', $weak);
    }
}
