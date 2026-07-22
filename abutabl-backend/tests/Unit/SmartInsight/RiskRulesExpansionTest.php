<?php

namespace Tests\Unit\SmartInsight;

use App\Services\SmartInsight\InsightRuleRegistry;
use App\Services\SmartInsight\Rules\AtRiskRule;
use App\Services\SmartInsight\Rules\CriticalRiskRule;
use App\Services\SmartInsight\Rules\DropoutRiskRule;
use App\Services\SmartInsight\Rules\HighRiskRule;
use App\Services\SmartInsight\Rules\InterventionRequiredRule;
use App\Services\SmartInsight\SmartInsightEngine;
use Carbon\Carbon;
use Tests\TestCase;

/**
 * F-037F — Risk rules expansion.
 */
class RiskRulesExpansionTest extends TestCase
{
    private function config(): array
    {
        return [
            'risk' => [
                'at_risk_min' => 0.35,
                'high_risk_min' => 0.55,
                'critical_risk_min' => 0.75,
                'dropout_min_factors' => 3,
                'intervention_min' => 0.7,
                'inactive_days_risk' => 14,
            ],
            'engine' => [
                'max_insights' => 8,
            ],
        ];
    }

    private function context(array $overrides = []): array
    {
        return array_merge([
            'student_id' => 55,
            'class_id' => 21,
            'has_risk_data' => true,
            'educational_risk_score' => 0.4,
            'risk_level' => 'at_risk',
            'contributing_factors' => ['low_progress:20'],
            'detected_patterns' => ['low_progress'],
            'risk_confidence' => 0.7,
            'days_since_activity' => 5,
            'dropout_signal' => false,
            'intervention_signal' => false,
            'progress' => 20,
            'performance' => 40,
            'engagement_score' => 15,
            'behaviour_score' => 15,
            'quiz_accuracy' => 30,
            'standards_gap' => 0.6,
            'generated_at' => Carbon::now()->toIso8601String(),
            'config' => $this->config(),
        ], $overrides);
    }

    public function test_registry_includes_all_risk_rules(): void
    {
        $registry = app(InsightRuleRegistry::class);
        $ids = $registry->ids();

        foreach ([
            'at_risk',
            'high_risk',
            'critical_risk',
            'dropout_risk',
            'intervention_required',
        ] as $id) {
            $this->assertContains($id, $ids);
        }

        $this->assertSame(45, $registry->count());
    }

    public function test_risk_level_bands(): void
    {
        $at = (new AtRiskRule())->evaluate($this->context([
            'risk_level' => 'at_risk',
            'educational_risk_score' => 0.4,
        ]));
        $this->assertNotNull($at);
        $this->assertSame('at_risk', $at['id']);
        $this->assertArrayHasKey('recommendations', $at);
        $this->assertArrayHasKey('risk_score', $at['supporting_metrics']);
        $this->assertArrayHasKey('confidence', $at);
        $this->assertGreaterThanOrEqual(0, $at['confidence']);
        $this->assertLessThanOrEqual(1, $at['confidence']);

        $high = (new HighRiskRule())->evaluate($this->context([
            'risk_level' => 'high',
            'educational_risk_score' => 0.6,
        ]));
        $this->assertNotNull($high);

        $critical = (new CriticalRiskRule())->evaluate($this->context([
            'risk_level' => 'critical',
            'educational_risk_score' => 0.85,
            'intervention_signal' => true,
        ]));
        $this->assertNotNull($critical);
        $this->assertSame('critical', $critical['severity']);

        $this->assertNull((new AtRiskRule())->evaluate($this->context(['risk_level' => 'high'])));
        $this->assertNull((new HighRiskRule())->evaluate($this->context(['risk_level' => 'at_risk'])));
    }

    public function test_dropout_and_intervention(): void
    {
        $dropout = (new DropoutRiskRule())->evaluate($this->context([
            'dropout_signal' => true,
            'risk_level' => 'critical',
            'educational_risk_score' => 0.8,
        ]));
        $this->assertNotNull($dropout);
        $this->assertSame('prevent_dropout', $dropout['recommendations'][0]['action_type']);

        $intervention = (new InterventionRequiredRule())->evaluate($this->context([
            'intervention_signal' => true,
            'risk_level' => 'critical',
            'educational_risk_score' => 0.8,
        ]));
        $this->assertNotNull($intervention);
        $this->assertSame('require_intervention', $intervention['recommendations'][0]['action_type']);

        $this->assertNull((new DropoutRiskRule())->evaluate($this->context([
            'dropout_signal' => false,
        ])));
    }

    public function test_engine_resolves_risk_level_conflicts(): void
    {
        $registry = new InsightRuleRegistry([
            new AtRiskRule(),
            new HighRiskRule(),
            new CriticalRiskRule(),
            new DropoutRiskRule(),
            new InterventionRequiredRule(),
        ]);
        $engine = new SmartInsightEngine($registry);

        $out = $engine->generate($this->context([
            'risk_level' => 'critical',
            'educational_risk_score' => 0.9,
            'dropout_signal' => true,
            'intervention_signal' => true,
        ]));
        $ids = array_column($out, 'id');

        $this->assertContains('critical_risk', $ids);
        $this->assertNotContains('high_risk', $ids);
        $this->assertNotContains('at_risk', $ids);
        $this->assertContains('dropout_risk', $ids);
        $this->assertContains('intervention_required', $ids);
    }

    public function test_different_students_different_risk_insights(): void
    {
        $registry = app(InsightRuleRegistry::class);
        $engine = new SmartInsightEngine($registry);

        $low = array_column($engine->generate($this->context([
            'student_id' => 1,
            'risk_level' => 'at_risk',
            'educational_risk_score' => 0.4,
            'dropout_signal' => false,
            'intervention_signal' => false,
        ])), 'id');

        $high = array_column($engine->generate($this->context([
            'student_id' => 2,
            'risk_level' => 'critical',
            'educational_risk_score' => 0.9,
            'dropout_signal' => true,
            'intervention_signal' => true,
        ])), 'id');

        $this->assertContains('at_risk', $low);
        $this->assertContains('critical_risk', $high);
        $this->assertNotContains('critical_risk', $low);
        $this->assertNotContains('at_risk', $high);
    }

    public function test_insufficient_risk_data_returns_null(): void
    {
        $this->assertNull((new AtRiskRule())->evaluate($this->context([
            'has_risk_data' => false,
            'risk_level' => 'at_risk',
        ])));
    }
}
