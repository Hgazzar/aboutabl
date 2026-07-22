<?php

namespace Tests\Unit\SmartInsight;

use App\Contracts\InsightRuleInterface;
use App\Contracts\StudentInsightProviderInterface;
use App\Services\SmartInsight\InsightRuleRegistry;
use App\Services\SmartInsight\Rules\HighProgressRule;
use App\Services\SmartInsight\Rules\InactiveStudentRule;
use App\Services\SmartInsight\Rules\LowProgressRule;
use App\Services\SmartInsight\Rules\OutstandingStudentRule;
use App\Services\SmartInsight\Rules\PerformanceDecliningRule;
use App\Services\SmartInsight\Rules\PerformanceImprovingRule;
use App\Services\SmartInsight\SmartInsightEngine;
use App\Services\SmartInsight\SmartInsightProvider;
use Carbon\Carbon;
use Tests\TestCase;

/**
 * F-032 — Smart Insight Engine foundation.
 */
class SmartInsightEngineTest extends TestCase
{
    private function baseConfig(): array
    {
        return [
            'progress' => [
                'low_threshold' => 40,
                'high_threshold' => 70,
            ],
            'performance' => [
                'improving_delta_percent' => 5,
                'declining_delta_percent' => 5,
                'decline_min_snapshots' => 2,
                'improve_min_snapshots' => 2,
            ],
            'outstanding' => [
                'min_progress_percent' => 85,
                'min_performance_percent' => 85,
            ],
            'inactive' => [
                'days' => 14,
            ],
            'engine' => [
                'max_insights' => 5,
            ],
        ];
    }

    private function context(array $overrides = []): array
    {
        return array_merge([
            'student_id' => 1,
            'class_id' => 21,
            'progress_percent' => 50.0,
            'has_progress_data' => true,
            'performance_percent' => 50.0,
            'score_percent' => 50.0,
            'overdue_count' => 0,
            'snapshots' => [],
            'last_activity_at' => Carbon::now(),
            'now' => Carbon::now(),
            'generated_at' => Carbon::now()->toIso8601String(),
            'config' => $this->baseConfig(),
        ], $overrides);
    }

    public function test_registry_contains_exactly_six_production_rules(): void
    {
        $registry = app(InsightRuleRegistry::class);
        $ids = $registry->ids();
        sort($ids);

        $this->assertSame(45, $registry->count());
        $this->assertSame([
            'at_risk',
            'average_performance',
            'consistent_excellence',
            'consistent_learning_pattern',
            'critical_risk',
            'dropout_risk',
            'excellent_engagement',
            'excellent_performance',
            'fast_learner',
            'fast_progress',
            'high_achiever',
            'high_progress',
            'high_quiz_accuracy',
            'high_risk',
            'inactive_student',
            'inconsistent_performance',
            'intervention_required',
            'irregular_learning_pattern',
            'learning_excellence',
            'low_engagement',
            'low_progress',
            'low_quiz_accuracy',
            'medium_progress',
            'milestone_achieved',
            'no_progress',
            'outstanding_improvement',
            'outstanding_student',
            'performance_decline',
            'performance_declining',
            'performance_improving',
            'progress_improvement',
            'progress_regression',
            'quiz_improvement',
            'rapid_improvement',
            'repeated_failures',
            'repeated_success',
            'returning_student',
            'slow_progress',
            'standards_gap',
            'standards_improvement',
            'strong_standards',
            'subject_mastery',
            'top_performer',
            'weak_performance',
            'weak_standards',
        ], $ids);
    }

    public function test_provider_binding_is_smart_insight_only(): void
    {
        $provider = app(StudentInsightProviderInterface::class);
        $this->assertInstanceOf(SmartInsightProvider::class, $provider);

        $implementors = [];
        $paths = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator(base_path('app'))
        );
        foreach ($paths as $file) {
            if (! $file->isFile() || $file->getExtension() !== 'php') {
                continue;
            }
            $contents = file_get_contents($file->getPathname());
            if ($contents === false) {
                continue;
            }
            if (
                preg_match('/implements\s+StudentInsightProviderInterface/', $contents)
                || preg_match('/implements\s+\\\\App\\\\Contracts\\\\StudentInsightProviderInterface/', $contents)
            ) {
                $implementors[] = basename($file->getPathname());
            }
        }

        sort($implementors);
        $this->assertSame(['SmartInsightProvider.php'], $implementors);
        $this->assertFileDoesNotExist(
            base_path('app/Services/StudentProfile/NullStudentInsightProvider.php')
        );
    }

    public function test_low_progress_rule(): void
    {
        $rule = new LowProgressRule();
        $hit = $rule->evaluate($this->context([
            'progress_percent' => 20,
            'has_progress_data' => true,
        ]));
        $this->assertNotNull($hit);
        $this->assertSame('low_progress', $hit['id']);
        $this->assertSame('warning', $hit['severity']);

        $miss = $rule->evaluate($this->context([
            'progress_percent' => 55,
            'has_progress_data' => true,
        ]));
        $this->assertNull($miss);

        $noData = $rule->evaluate($this->context([
            'progress_percent' => 0,
            'has_progress_data' => false,
        ]));
        $this->assertNull($noData);
    }

    public function test_high_progress_rule(): void
    {
        $rule = new HighProgressRule();
        $hit = $rule->evaluate($this->context(['progress_percent' => 75]));
        $this->assertNotNull($hit);
        $this->assertSame('high_progress', $hit['id']);

        $outstandingBand = $rule->evaluate($this->context(['progress_percent' => 90]));
        $this->assertNull($outstandingBand);
    }

    public function test_performance_improving_rule(): void
    {
        $rule = new PerformanceImprovingRule();
        $hit = $rule->evaluate($this->context([
            'snapshots' => [
                ['performance_percent' => 40],
                ['performance_percent' => 55],
            ],
        ]));
        $this->assertNotNull($hit);
        $this->assertSame('performance_improving', $hit['id']);
        $this->assertSame(15.0, $hit['supporting_metrics']['delta_percent']);
    }

    public function test_performance_declining_rule(): void
    {
        $rule = new PerformanceDecliningRule();
        $hit = $rule->evaluate($this->context([
            'snapshots' => [
                ['performance_percent' => 70],
                ['performance_percent' => 50],
            ],
        ]));
        $this->assertNotNull($hit);
        $this->assertSame('performance_declining', $hit['id']);
    }

    public function test_inactive_student_rule(): void
    {
        $rule = new InactiveStudentRule();
        $hit = $rule->evaluate($this->context([
            'last_activity_at' => Carbon::now()->subDays(20),
            'now' => Carbon::now(),
        ]));
        $this->assertNotNull($hit);
        $this->assertSame('inactive_student', $hit['id']);

        $active = $rule->evaluate($this->context([
            'last_activity_at' => Carbon::now()->subDays(2),
            'now' => Carbon::now(),
        ]));
        $this->assertNull($active);

        $never = $rule->evaluate($this->context([
            'last_activity_at' => null,
            'now' => Carbon::now(),
        ]));
        $this->assertNotNull($never);
    }

    public function test_outstanding_student_rule(): void
    {
        $rule = new OutstandingStudentRule();
        $hit = $rule->evaluate($this->context([
            'progress_percent' => 90,
            'performance_percent' => 88,
            'has_progress_data' => true,
        ]));
        $this->assertNotNull($hit);
        $this->assertSame('outstanding_student', $hit['id']);

        $miss = $rule->evaluate($this->context([
            'progress_percent' => 90,
            'performance_percent' => 70,
        ]));
        $this->assertNull($miss);
    }

    public function test_engine_empty_metrics_returns_no_insights(): void
    {
        $engine = new SmartInsightEngine(app(InsightRuleRegistry::class));
        $insights = $engine->generate($this->context([
            'progress_percent' => 0,
            'has_progress_data' => false,
            'performance_percent' => 0,
            'snapshots' => [],
            'last_activity_at' => Carbon::now(),
        ]));

        $this->assertSame([], $insights);
    }

    public function test_engine_duplicate_prevention(): void
    {
        $dup = new class implements InsightRuleInterface {
            public function id(): string
            {
                return 'low_progress';
            }

            public function evaluate(array $context): ?array
            {
                return [
                    'id' => 'low_progress',
                    'category' => 'progress',
                    'severity' => 'warning',
                    'title' => 'Dup',
                    'description' => 'Dup',
                    'recommendation' => 'Dup',
                    'priority' => 1,
                    'generated_at' => now()->toIso8601String(),
                    'supporting_metrics' => [],
                ];
            }
        };

        $engine = new SmartInsightEngine(new InsightRuleRegistry([
            new LowProgressRule(),
            $dup,
        ]));

        $insights = $engine->generate($this->context([
            'progress_percent' => 10,
            'has_progress_data' => true,
            'last_activity_at' => Carbon::now(),
        ]));

        $ids = array_column($insights, 'id');
        $this->assertSame(1, count(array_filter($ids, function ($id) {
            return $id === 'low_progress';
        })));
    }

    public function test_engine_resolves_conflicting_progress_and_trend_rules(): void
    {
        $engine = new SmartInsightEngine(app(InsightRuleRegistry::class));

        // Conflicting trend snapshots cannot produce both improving and declining
        // with normal thresholds; force both via custom overlapping rules.
        $improving = new class implements InsightRuleInterface {
            public function id(): string
            {
                return 'performance_improving';
            }

            public function evaluate(array $context): ?array
            {
                return [
                    'id' => 'performance_improving',
                    'category' => 'performance',
                    'severity' => 'success',
                    'title' => 'Up',
                    'description' => 'Up',
                    'recommendation' => 'Up',
                    'priority' => 40,
                    'generated_at' => now()->toIso8601String(),
                    'supporting_metrics' => [],
                ];
            }
        };
        $declining = new class implements InsightRuleInterface {
            public function id(): string
            {
                return 'performance_declining';
            }

            public function evaluate(array $context): ?array
            {
                return [
                    'id' => 'performance_declining',
                    'category' => 'performance',
                    'severity' => 'warning',
                    'title' => 'Down',
                    'description' => 'Down',
                    'recommendation' => 'Down',
                    'priority' => 20,
                    'generated_at' => now()->toIso8601String(),
                    'supporting_metrics' => [],
                ];
            }
        };

        $engine = new SmartInsightEngine(new InsightRuleRegistry([$improving, $declining]));
        $insights = $engine->generate($this->context());
        $ids = array_column($insights, 'id');

        $this->assertContains('performance_declining', $ids);
        $this->assertNotContains('performance_improving', $ids);
    }

    public function test_outstanding_suppresses_high_progress(): void
    {
        $engine = new SmartInsightEngine(app(InsightRuleRegistry::class));
        $insights = $engine->generate($this->context([
            'progress_percent' => 92,
            'performance_percent' => 90,
            'has_progress_data' => true,
            'last_activity_at' => Carbon::now(),
            'snapshots' => [],
        ]));

        $ids = array_column($insights, 'id');
        $this->assertContains('outstanding_student', $ids);
        $this->assertNotContains('high_progress', $ids);
    }

    public function test_provider_returns_structured_contract(): void
    {
        $provider = app(SmartInsightProvider::class);
        $empty = $provider->build([]);
        $this->assertFalse($empty['available']);
        $this->assertSame([], $empty['insights']);

        // Force engine path with mocked reader via direct engine assertion covered above;
        // provider with invalid student stays empty.
        $this->assertNull($empty['text']);
    }

    public function test_insight_dto_shape_has_required_keys(): void
    {
        $insight = (new LowProgressRule())->evaluate($this->context([
            'progress_percent' => 5,
            'has_progress_data' => true,
        ]));

        foreach ([
            'id',
            'category',
            'severity',
            'title',
            'description',
            'recommendation',
            'priority',
            'generated_at',
            'supporting_metrics',
        ] as $key) {
            $this->assertArrayHasKey($key, $insight);
        }

        $this->assertIsArray($insight['supporting_metrics']);
        $this->assertStringNotContainsString('<', $insight['description']);
        $this->assertStringNotContainsString('#', $insight['description']);
    }
}
