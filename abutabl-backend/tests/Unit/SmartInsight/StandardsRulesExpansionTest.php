<?php

namespace Tests\Unit\SmartInsight;

use App\Services\SmartInsight\InsightRuleRegistry;
use App\Services\SmartInsight\Rules\StandardsGapRule;
use App\Services\SmartInsight\Rules\StandardsImprovementRule;
use App\Services\SmartInsight\Rules\StrongStandardsRule;
use App\Services\SmartInsight\Rules\WeakStandardsRule;
use App\Services\SmartInsight\SmartInsightEngine;
use Carbon\Carbon;
use Tests\TestCase;

/**
 * F-037C — Standards rules expansion.
 */
class StandardsRulesExpansionTest extends TestCase
{
    private function config(): array
    {
        return [
            'standards' => [
                'strong_average_threshold' => 80,
                'weak_average_threshold' => 50,
                'mastery_percent' => 80,
                'gap_ratio_threshold' => 0.4,
                'improve_average_threshold' => 70,
                'improve_min_mastered_ratio' => 0.5,
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
            'has_standards_data' => true,
            'standards' => [],
            'standards_average' => 60.0,
            'standards_gap' => 0.5,
            'standards_gap_percent' => 40.0,
            'standards_trend' => 'stable',
            'mastered_standards' => [],
            'weak_standards' => [],
            'mastered_standards_count' => 2,
            'weak_standards_count' => 2,
            'standards_total_count' => 4,
            'standards_history' => [80, 40, 70, 50],
            'standards_mastered_ratio' => 0.5,
            'standards_risk_score' => 0.3,
            'generated_at' => Carbon::now()->toIso8601String(),
            'config' => $this->config(),
        ], $overrides);
    }

    public function test_registry_includes_all_standards_rules(): void
    {
        $registry = app(InsightRuleRegistry::class);
        $ids = $registry->ids();

        foreach ([
            'strong_standards',
            'weak_standards',
            'standards_gap',
            'standards_improvement',
        ] as $id) {
            $this->assertContains($id, $ids);
        }

        $this->assertSame(45, $registry->count());
    }

    public function test_strong_vs_weak_standards(): void
    {
        $strong = new StrongStandardsRule();
        $weak = new WeakStandardsRule();

        $s = $strong->evaluate($this->context([
            'standards_average' => 88,
            'standards_gap' => 0.1,
            'standards_mastered_ratio' => 0.9,
            'standards_trend' => 'improving',
        ]));
        $this->assertNotNull($s);
        $this->assertSame('strong_standards', $s['id']);
        $this->assertArrayHasKey('confidence', $s);
        $this->assertGreaterThanOrEqual(0, $s['confidence']);
        $this->assertLessThanOrEqual(1, $s['confidence']);
        $this->assertArrayHasKey('standards_average', $s['supporting_metrics']);
        $this->assertArrayHasKey('positive_findings', $s);

        $w = $weak->evaluate($this->context([
            'standards_average' => 35,
            'standards_risk_score' => 0.6,
        ]));
        $this->assertNotNull($w);
        $this->assertSame('weak_standards', $w['id']);
        $this->assertArrayHasKey('risk_indicators', $w);

        $this->assertNull($strong->evaluate($this->context(['standards_average' => 35])));
        $this->assertNull($weak->evaluate($this->context(['standards_average' => 88])));
    }

    public function test_gap_vs_improvement(): void
    {
        $gap = new StandardsGapRule();
        $improve = new StandardsImprovementRule();

        $g = $gap->evaluate($this->context([
            'standards_gap' => 0.6,
            'standards_average' => 45,
        ]));
        $this->assertNotNull($g);
        $this->assertSame('standards_gap', $g['id']);

        $i = $improve->evaluate($this->context([
            'standards_average' => 78,
            'standards_mastered_ratio' => 0.7,
            'standards_gap' => 0.2,
        ]));
        $this->assertNotNull($i);
        $this->assertSame('improving', $i['trend']);

        $this->assertNull($improve->evaluate($this->context([
            'standards_average' => 78,
            'standards_mastered_ratio' => 0.7,
            'standards_gap' => 0.6,
        ])));
    }

    public function test_engine_resolves_standards_conflicts(): void
    {
        $registry = new InsightRuleRegistry([
            new StrongStandardsRule(),
            new WeakStandardsRule(),
            new StandardsGapRule(),
            new StandardsImprovementRule(),
        ]);
        $engine = new SmartInsightEngine($registry);

        $strongOut = $engine->generate($this->context([
            'standards_average' => 90,
            'standards_gap' => 0.1,
            'standards_mastered_ratio' => 0.9,
        ]));
        $ids = array_column($strongOut, 'id');
        $this->assertContains('strong_standards', $ids);
        $this->assertNotContains('weak_standards', $ids);
        $this->assertContains('standards_improvement', $ids);
        $this->assertNotContains('standards_gap', $ids);

        $gapOut = $engine->generate($this->context([
            'standards_average' => 40,
            'standards_gap' => 0.7,
            'standards_mastered_ratio' => 0.2,
        ]));
        $gIds = array_column($gapOut, 'id');
        $this->assertContains('weak_standards', $gIds);
        $this->assertContains('standards_gap', $gIds);
        $this->assertNotContains('strong_standards', $gIds);
        $this->assertNotContains('standards_improvement', $gIds);
    }

    public function test_different_students_different_standards_insights(): void
    {
        $registry = app(InsightRuleRegistry::class);
        $engine = new SmartInsightEngine($registry);

        $strong = array_column($engine->generate($this->context([
            'standards_average' => 92,
            'standards_gap' => 0.1,
            'standards_mastered_ratio' => 0.9,
        ])), 'id');

        $weak = array_column($engine->generate($this->context([
            'standards_average' => 30,
            'standards_gap' => 0.8,
            'standards_mastered_ratio' => 0.1,
            'standards_risk_score' => 0.7,
        ])), 'id');

        $this->assertContains('strong_standards', $strong);
        $this->assertContains('weak_standards', $weak);
        $this->assertNotContains('weak_standards', $strong);
        $this->assertNotContains('strong_standards', $weak);
    }
}
