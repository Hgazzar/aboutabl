<?php

namespace Tests\Unit\Production;

use App\Contracts\StudentInsightProviderInterface;
use App\Services\SmartInsight\InsightQualityCalibrator;
use App\Services\SmartInsight\InsightRuleRegistry;
use App\Services\SmartInsight\SmartInsightEngine;
use App\Services\SmartInsight\SmartInsightProvider;
use App\Services\SmartInsight\InsightMetricsReader;
use Mockery;
use Tests\TestCase;

/**
 * F-040C — Load, concurrency & production validation (no business-semantic changes).
 */
class ProductionLoadConcurrencyValidationTest extends TestCase
{
    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_admin_dashboard_endpoints_remain_admin_accessible(): void
    {
        $dashboard = file_get_contents(
            app_path('Http/Controllers/Api/AdminControllers/DashboardController.php')
        );
        $this->assertStringContainsString('function stats(', $dashboard);
        $this->assertStringContainsString('function teacherAssignments(', $dashboard);
        // Admin dashboard must NOT reject type === admin.
        $this->assertStringNotContainsString(
            "This endpoint is for teachers only",
            $dashboard
        );
        $this->assertStringContainsString('SchoolsIDs()', $dashboard);

        $routes = file_get_contents(base_path('routes/api/admin.php'));
        $this->assertStringContainsString("Route::get('/dashboard/stats'", $routes);
        $this->assertStringContainsString("Route::get('/dashboard/teacher-assignments'", $routes);
    }

    public function test_only_teacher_portal_endpoints_reject_admin(): void
    {
        $teacherControllers = [
            app_path('Http/Controllers/Api/AdminControllers/TeacherDashboardController.php'),
            app_path('Http/Controllers/Api/AdminControllers/TeacherClassesController.php'),
            app_path('Http/Controllers/Api/AdminControllers/TeacherEvaluationsController.php'),
        ];

        foreach ($teacherControllers as $path) {
            $src = file_get_contents($path);
            $this->assertStringContainsString(
                "This endpoint is for teachers only",
                $src,
                basename($path).' should restrict admins from teacher portal APIs'
            );
        }

        // Admin UI consumes /api/dashboard/stats — not teacher class standards.
        $adminUi = file_get_contents(
            base_path('../abutabl-admin/src/pages/dashboard/AdminDashboard.tsx')
        );
        $this->assertStringContainsString('/api/dashboard/stats', $adminUi);
        $this->assertStringContainsString('/api/dashboard/teacher-assignments', $adminUi);
        $this->assertStringNotContainsString('/api/dashboard/teacher/classes', $adminUi);
        $this->assertStringNotContainsString('/standards', $adminUi);
    }

    public function test_admin_schools_ids_still_returns_all_schools_without_user_id(): void
    {
        $trait = file_get_contents(app_path('Traits/GeneralTrait.php'));
        // Admin default path (all schools) preserved.
        $this->assertMatchesRegularExpression(
            "/type == [\"']admin[\"'].*?Schools::orderBy\('id'\)->pluck\('id'\)/s",
            $trait
        );
        // Impersonation via user_id remains admin-only.
        $this->assertStringContainsString("type === 'admin'", $trait);
        $this->assertStringContainsString("request()->filled('user_id')", $trait);
    }

    public function test_profile_cache_remains_disabled_by_default(): void
    {
        $src = file_get_contents(app_path('Services/StudentProfileService.php'));
        $this->assertStringContainsString("STUDENT_PROFILE_CACHE_ENABLED", $src);
        $this->assertStringContainsString(
            "filter_var(env(self::CACHE_ENABLED_ENV, false), FILTER_VALIDATE_BOOLEAN)",
            $src
        );
        $this->assertFalse(filter_var(env('STUDENT_PROFILE_CACHE_ENABLED', false), FILTER_VALIDATE_BOOLEAN));
    }

    public function test_smart_insight_single_execution_under_repeated_provider_calls(): void
    {
        $reader = Mockery::mock(InsightMetricsReader::class);
        $engine = Mockery::mock(SmartInsightEngine::class);
        $readerCalls = 0;
        $engineCalls = 0;

        $reader->shouldReceive('build')->andReturnUsing(function () use (&$readerCalls) {
            $readerCalls++;

            return [
                'student_id' => 42,
                'generated_at' => '2026-07-18T00:00:00+00:00',
            ];
        });
        $engine->shouldReceive('generate')->andReturnUsing(function () use (&$engineCalls) {
            $engineCalls++;

            return [[
                'id' => 'low_progress',
                'category' => 'progress',
                'severity' => 'warning',
                'title' => 'Low Progress',
                'description' => 'Low',
                'recommendation' => 'Act',
                'priority' => 10,
                'confidence' => 0.7,
                'generated_at' => '2026-07-18T00:00:00+00:00',
            ]];
        });

        $provider = new SmartInsightProvider($reader, $engine, new InsightQualityCalibrator());

        // Simulated concurrent/load: N independent requests → N executions (1 each), never 0 or N².
        $n = 25;
        for ($i = 0; $i < $n; $i++) {
            $payload = $provider->build(['student_id' => 42]);
            $this->assertTrue($payload['available']);
            $this->assertArrayHasKey('executive_summary', $payload);
        }

        $this->assertSame($n, $readerCalls);
        $this->assertSame($n, $engineCalls);
    }

    public function test_large_dataset_calibrator_is_stable_and_bounded(): void
    {
        $insights = [];
        $categories = [
            'risk', 'progress', 'performance', 'assessment',
            'standards', 'learning_behaviour', 'achievement',
        ];

        // Large synthetic insight set (far above typical max_insights).
        for ($i = 0; $i < 200; $i++) {
            $cat = $categories[$i % count($categories)];
            $insights[] = [
                'id' => 'insight_'.$i,
                'category' => $cat,
                'severity' => $i % 5 === 0 ? 'critical' : ($i % 3 === 0 ? 'warning' : 'success'),
                'title' => 'Finding '.$i,
                'description' => 'Description '.$i,
                'recommendation' => 'Action '.$i,
                'priority' => ($i % 60) + 1,
                'confidence' => ($i % 100) / 100,
                'generated_at' => '2026-07-18T00:00:00+00:00',
                'recommendations' => [[
                    'title' => 'Rec '.$i,
                    'description' => 'Do '.$i,
                    'priority' => ($i % 60) + 1,
                    'category' => $cat,
                    'action_type' => 'action_'.$i,
                    'target_type' => 'student',
                    'target_id' => 1,
                ]],
            ];
        }

        $memBefore = memory_get_usage(true);
        $calibrator = new InsightQualityCalibrator();
        $out = null;
        for ($round = 0; $round < 10; $round++) {
            $out = $calibrator->calibrate($insights);
        }
        $memAfter = memory_get_usage(true);

        $this->assertNotNull($out);
        $this->assertCount(200, $out['insights']);
        $this->assertNotEmpty($out['categories']);
        $this->assertLessThanOrEqual(5, count($out['categories'][0]['visible'] ?? []));
        $this->assertArrayHasKey('executive_score', $out);
        $this->assertGreaterThanOrEqual(0.0, $out['executive_score']);
        $this->assertLessThanOrEqual(1.0, $out['executive_score']);

        // No unbounded growth across repeated calibrations of the same payload.
        $this->assertLessThan(
            32 * 1024 * 1024,
            $memAfter - $memBefore,
            'Unexpected memory growth during repeated large calibrations'
        );
    }

    public function test_engine_load_with_full_registry_is_stable(): void
    {
        $registry = app(InsightRuleRegistry::class);
        $this->assertSame(45, $registry->count());
        $engine = new SmartInsightEngine($registry);

        $base = [
            'student_id' => 1,
            'class_id' => 1,
            'has_progress_data' => true,
            'progress' => 55,
            'progress_percent' => 55,
            'progress_change' => 2,
            'has_performance_data' => true,
            'performance' => 60,
            'performance_percent' => 60,
            'performance_delta' => 0,
            'performance_snapshot_count' => 2,
            'snapshots' => [
                ['performance_percent' => 55],
                ['performance_percent' => 60],
            ],
            'has_standards_data' => true,
            'standards_average' => 70,
            'standards_mastered_ratio' => 0.6,
            'standards_gap' => 0.2,
            'has_assessment_data' => true,
            'quiz_accuracy' => 70,
            'quiz_improvement' => 5,
            'consecutive_failures' => 0,
            'consecutive_successes' => 0,
            'has_learning_behaviour_data' => true,
            'engagement_score' => 50,
            'learning_consistency' => 0.5,
            'active_days' => 5,
            'has_risk_data' => true,
            'risk_level' => 'at_risk',
            'educational_risk_score' => 0.4,
            'risk_confidence' => 0.6,
            'dropout_signal' => false,
            'intervention_signal' => false,
            'has_achievement_data' => true,
            'achievement_level' => 'high',
            'achievement_score' => 0.5,
            'achievement_confidence' => 0.6,
            'milestone_count' => 1,
            'top_performer_signal' => false,
            'subject_mastery_signal' => false,
            'fast_learner_signal' => false,
            'consistent_excellence_signal' => false,
            'outstanding_improvement_signal' => false,
            'generated_at' => now()->toIso8601String(),
            'config' => config('smart_insight'),
            'last_activity_at' => now(),
            'now' => now(),
        ];

        $started = microtime(true);
        for ($i = 0; $i < 50; $i++) {
            $ctx = $base;
            $ctx['student_id'] = $i + 1;
            $ctx['progress'] = 20 + ($i % 70);
            $ctx['progress_percent'] = $ctx['progress'];
            $out = $engine->generate($ctx);
            $ids = array_column($out, 'id');
            $this->assertSame(count($ids), count(array_unique($ids)));
        }
        $elapsed = microtime(true) - $started;

        $this->assertLessThan(
            5.0,
            $elapsed,
            '50 full-registry engine runs exceeded 5s budget'
        );
    }

    public function test_progress_and_snapshot_pipelines_remain_idempotent_by_design(): void
    {
        $repo = file_get_contents(app_path('Repositories/StudentSubjectProgressRepository.php'));
        $this->assertStringContainsString('lockForUpdate', $repo);
        $this->assertStringContainsString('isUniqueViolation', $repo);
        $this->assertStringContainsString('Idempotent upsert', $repo);

        $recorder = file_get_contents(
            app_path('Services/PerformanceAnalytics/PerformanceSnapshotRecorder.php')
        );
        $this->assertStringContainsString('fact_key', $recorder);
        $this->assertStringContainsString('upsert', $recorder);
        $this->assertStringContainsString('Idempotent daily upsert', $recorder);
    }

    public function test_insight_provider_binding_is_single_implementation(): void
    {
        $this->assertInstanceOf(
            SmartInsightProvider::class,
            app(StudentInsightProviderInterface::class)
        );
        $this->assertSame(
            app(InsightRuleRegistry::class),
            app(InsightRuleRegistry::class)
        );
    }

    public function test_no_duplicate_insight_dto_keys_after_calibration_under_load(): void
    {
        $calibrator = new InsightQualityCalibrator();
        $batch = [];
        for ($s = 0; $s < 30; $s++) {
            $insights = [
                [
                    'id' => 'critical_risk',
                    'category' => 'risk',
                    'severity' => 'critical',
                    'title' => 'Critical Risk',
                    'description' => 'Critical',
                    'recommendation' => 'Act now',
                    'priority' => 6,
                    'confidence' => 0.9,
                    'generated_at' => '2026-07-18T00:00:00+00:00',
                    'recommendations' => [[
                        'title' => 'Immediate Critical-Risk Action',
                        'description' => 'Act now',
                        'priority' => 6,
                        'category' => 'risk',
                        'action_type' => 'urgent_intervention',
                        'target_type' => 'student',
                        'target_id' => $s,
                    ]],
                ],
                [
                    'id' => 'critical_risk', // duplicate id must collapse
                    'category' => 'risk',
                    'severity' => 'critical',
                    'title' => 'Critical Risk Dup',
                    'description' => 'Dup',
                    'recommendation' => 'Act now',
                    'priority' => 6,
                    'confidence' => 0.9,
                    'generated_at' => '2026-07-18T00:00:00+00:00',
                ],
                [
                    'id' => 'learning_excellence',
                    'category' => 'achievement',
                    'severity' => 'success',
                    'title' => 'Learning Excellence',
                    'description' => 'Excellent',
                    'recommendation' => 'Celebrate',
                    'priority' => 4,
                    'confidence' => 0.8,
                    'generated_at' => '2026-07-18T00:00:00+00:00',
                ],
            ];
            $out = $calibrator->calibrate($insights);
            $ids = array_column($out['insights'], 'id');
            $this->assertSame(count($ids), count(array_unique($ids)));
            // Critical risk suppresses celebratory achievement at engine layer;
            // calibrator still must not duplicate recommendation actions.
            $actions = array_map(function ($r) {
                return ($r['action_type'] ?? '').'|'.($r['title'] ?? '');
            }, $out['recommendations']);
            $this->assertSame(count($actions), count(array_unique($actions)));
            $batch[] = $out['executive_score'];
        }
        $this->assertCount(30, $batch);
    }
}
