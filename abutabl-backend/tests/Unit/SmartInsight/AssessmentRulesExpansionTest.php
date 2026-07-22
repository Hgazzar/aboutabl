<?php

namespace Tests\Unit\SmartInsight;

use App\Services\SmartInsight\InsightRuleRegistry;
use App\Services\SmartInsight\Rules\HighQuizAccuracyRule;
use App\Services\SmartInsight\Rules\LowQuizAccuracyRule;
use App\Services\SmartInsight\Rules\QuizImprovementRule;
use App\Services\SmartInsight\Rules\RepeatedFailuresRule;
use App\Services\SmartInsight\Rules\RepeatedSuccessRule;
use App\Services\SmartInsight\SmartInsightEngine;
use Carbon\Carbon;
use Tests\TestCase;

/**
 * F-037D — Assessment rules expansion.
 */
class AssessmentRulesExpansionTest extends TestCase
{
    private function config(): array
    {
        return [
            'assessment' => [
                'high_accuracy_threshold' => 85,
                'low_accuracy_threshold' => 50,
                'improve_delta_percent' => 10,
                'improve_min_attempts' => 2,
                'min_attempts' => 2,
                'repeated_failures_count' => 3,
                'repeated_success_count' => 3,
                'pass_percent_fallback' => 60,
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
            'has_assessment_data' => true,
            'quiz_accuracy' => 70.0,
            'average_quiz_score' => 70.0,
            'successful_attempts' => 2,
            'failed_attempts' => 1,
            'quiz_attempt_count' => 3,
            'quiz_result_count' => 3,
            'quiz_improvement' => 5.0,
            'quiz_trend' => 'stable',
            'quiz_history' => [65, 70, 75],
            'quiz_pass_flags' => [true, true, true],
            'consecutive_failures' => 0,
            'consecutive_successes' => 3,
            'assessment_confidence' => 0.7,
            'assessment_risk' => 0.1,
            'generated_at' => Carbon::now()->toIso8601String(),
            'config' => $this->config(),
        ], $overrides);
    }

    public function test_registry_includes_all_assessment_rules(): void
    {
        $registry = app(InsightRuleRegistry::class);
        $ids = $registry->ids();

        foreach ([
            'high_quiz_accuracy',
            'low_quiz_accuracy',
            'quiz_improvement',
            'repeated_failures',
            'repeated_success',
        ] as $id) {
            $this->assertContains($id, $ids);
        }

        $this->assertSame(45, $registry->count());
    }

    public function test_high_vs_low_accuracy(): void
    {
        $high = new HighQuizAccuracyRule();
        $low = new LowQuizAccuracyRule();

        $h = $high->evaluate($this->context([
            'quiz_accuracy' => 90,
            'average_quiz_score' => 90,
        ]));
        $this->assertNotNull($h);
        $this->assertSame('high_quiz_accuracy', $h['id']);
        $this->assertArrayHasKey('confidence', $h);
        $this->assertGreaterThanOrEqual(0, $h['confidence']);
        $this->assertLessThanOrEqual(1, $h['confidence']);
        $this->assertArrayHasKey('quiz_accuracy', $h['supporting_metrics']);

        $l = $low->evaluate($this->context([
            'quiz_accuracy' => 30,
            'assessment_risk' => 0.5,
        ]));
        $this->assertNotNull($l);
        $this->assertSame('low_quiz_accuracy', $l['id']);
        $this->assertArrayHasKey('risk_indicators', $l);

        $this->assertNull($high->evaluate($this->context(['quiz_accuracy' => 30])));
        $this->assertNull($low->evaluate($this->context(['quiz_accuracy' => 90])));
    }

    public function test_improvement_and_streaks(): void
    {
        $improve = new QuizImprovementRule();
        $fail = new RepeatedFailuresRule();
        $success = new RepeatedSuccessRule();

        $i = $improve->evaluate($this->context([
            'quiz_improvement' => 15,
            'quiz_trend' => 'improving',
        ]));
        $this->assertNotNull($i);
        $this->assertSame('improving', $i['trend']);

        $f = $fail->evaluate($this->context([
            'consecutive_failures' => 3,
            'quiz_accuracy' => 20,
        ]));
        $this->assertNotNull($f);
        $this->assertSame('declining', $f['trend']);

        $s = $success->evaluate($this->context([
            'consecutive_successes' => 4,
        ]));
        $this->assertNotNull($s);

        $this->assertNull($improve->evaluate($this->context(['quiz_improvement' => 2])));
        $this->assertNull($fail->evaluate($this->context(['consecutive_failures' => 1])));
        $this->assertNull($success->evaluate($this->context(['consecutive_successes' => 1])));
    }

    public function test_insufficient_history_returns_null(): void
    {
        $high = new HighQuizAccuracyRule();
        $this->assertNull($high->evaluate($this->context([
            'has_assessment_data' => false,
            'quiz_accuracy' => 95,
        ])));
    }

    public function test_engine_resolves_assessment_conflicts(): void
    {
        $registry = new InsightRuleRegistry([
            new HighQuizAccuracyRule(),
            new LowQuizAccuracyRule(),
            new QuizImprovementRule(),
            new RepeatedFailuresRule(),
            new RepeatedSuccessRule(),
        ]);
        $engine = new SmartInsightEngine($registry);

        $highOut = $engine->generate($this->context([
            'quiz_accuracy' => 92,
            'quiz_improvement' => 12,
            'consecutive_successes' => 3,
            'consecutive_failures' => 0,
        ]));
        $ids = array_column($highOut, 'id');
        $this->assertContains('high_quiz_accuracy', $ids);
        $this->assertNotContains('low_quiz_accuracy', $ids);
        $this->assertContains('quiz_improvement', $ids);
        $this->assertContains('repeated_success', $ids);
        $this->assertNotContains('repeated_failures', $ids);

        $failOut = $engine->generate($this->context([
            'quiz_accuracy' => 25,
            'quiz_improvement' => 15,
            'consecutive_failures' => 3,
            'consecutive_successes' => 0,
            'assessment_risk' => 0.7,
        ]));
        $fIds = array_column($failOut, 'id');
        $this->assertContains('low_quiz_accuracy', $fIds);
        $this->assertContains('repeated_failures', $fIds);
        $this->assertNotContains('high_quiz_accuracy', $fIds);
        $this->assertNotContains('repeated_success', $fIds);
        $this->assertNotContains('quiz_improvement', $fIds);
    }

    public function test_different_students_different_assessment_insights(): void
    {
        $registry = app(InsightRuleRegistry::class);
        $engine = new SmartInsightEngine($registry);

        $high = array_column($engine->generate($this->context([
            'quiz_accuracy' => 95,
            'consecutive_successes' => 4,
            'consecutive_failures' => 0,
            'quiz_improvement' => 12,
        ])), 'id');

        $low = array_column($engine->generate($this->context([
            'quiz_accuracy' => 20,
            'consecutive_failures' => 4,
            'consecutive_successes' => 0,
            'quiz_improvement' => -5,
            'assessment_risk' => 0.8,
        ])), 'id');

        $this->assertContains('high_quiz_accuracy', $high);
        $this->assertContains('low_quiz_accuracy', $low);
        $this->assertNotContains('low_quiz_accuracy', $high);
        $this->assertNotContains('high_quiz_accuracy', $low);
    }
}
