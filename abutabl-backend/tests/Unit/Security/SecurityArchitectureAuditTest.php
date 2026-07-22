<?php

namespace Tests\Unit\Security;

use App\Contracts\StudentInsightProviderInterface;
use App\Models\TeacherEvaluation;
use App\Providers\AppServiceProvider;
use App\Services\SmartInsight\InsightRuleRegistry;
use App\Services\SmartInsight\SmartInsightProvider;
use ReflectionClass;
use Tests\TestCase;

/**
 * F-040B — Security & architecture hardening checks.
 */
class SecurityArchitectureAuditTest extends TestCase
{
    public function test_student_insight_provider_has_single_binding(): void
    {
        $provider = app(StudentInsightProviderInterface::class);
        $this->assertInstanceOf(SmartInsightProvider::class, $provider);

        $src = file_get_contents((new ReflectionClass(AppServiceProvider::class))->getFileName());
        $this->assertSame(
            1,
            substr_count($src, 'StudentInsightProviderInterface::class')
        );
        $this->assertSame(
            1,
            substr_count($src, 'InsightRuleRegistry::class')
        );
    }

    public function test_insight_registry_is_singleton_with_45_rules(): void
    {
        $a = app(InsightRuleRegistry::class);
        $b = app(InsightRuleRegistry::class);
        $this->assertSame($a, $b);
        $this->assertSame(45, $a->count());
    }

    public function test_teacher_evaluation_uses_explicit_fillable(): void
    {
        $model = new TeacherEvaluation();
        $this->assertNotEmpty($model->getFillable());
        $this->assertContains('note', $model->getFillable());
        $this->assertContains('teacher_id', $model->getFillable());
        $this->assertNotContains('id', $model->getFillable());
    }

    public function test_schools_ids_ignores_request_user_id_for_non_admin(): void
    {
        $traitSrc = file_get_contents(app_path('Traits/GeneralTrait.php'));
        $this->assertStringContainsString("type === 'admin'", $traitSrc);
        $this->assertStringContainsString('request()->filled(\'user_id\')', $traitSrc);
        // Non-admin branch must resolve via auth()->id(), not arbitrary request user_id.
        $this->assertStringContainsString("SchoolsRoles::where('user_id', auth()->id())", $traitSrc);
    }

    public function test_class_standards_rejects_admin_like_peer_endpoints(): void
    {
        $src = file_get_contents(
            app_path('Http/Controllers/Api/AdminControllers/TeacherClassesController.php')
        );
        $this->assertMatchesRegularExpression(
            '/function standards\(.*?\{.*?type === \'admin\'.*?This endpoint is for teachers only/s',
            $src
        );
    }

    public function test_access_verified_is_internal_only(): void
    {
        $controller = file_get_contents(
            app_path('Http/Controllers/Api/AdminControllers/TeacherEvaluationsController.php')
        );
        $this->assertStringNotContainsString('access_verified', $controller);

        $profile = file_get_contents(app_path('Services/StudentProfileService.php'));
        $this->assertStringContainsString("'access_verified' => true", $profile);
    }

    public function test_smart_insight_pipeline_remains_read_only(): void
    {
        foreach ([
            'SmartInsight/SmartInsightProvider.php',
            'SmartInsight/InsightMetricsReader.php',
            'SmartInsight/InsightQualityCalibrator.php',
            'SmartInsight/SmartInsightEngine.php',
        ] as $rel) {
            $src = file_get_contents(app_path('Services/'.$rel));
            foreach (['->save(', '->update(', '->delete(', '::insert(', 'ProgressWriterService'] as $needle) {
                $this->assertStringNotContainsString($needle, $src, $rel);
            }
        }
    }

    public function test_official_progress_write_pipeline_markers_exist(): void
    {
        $this->assertFileExists(app_path('Services/Progress/ProgressWriterService.php'));
        $this->assertFileExists(app_path('Repositories/StudentSubjectProgressRepository.php'));
        $this->assertFileExists(app_path('Observers/StudentSubjectProgressObserver.php'));
        $this->assertFileExists(app_path('Services/PerformanceAnalytics/PerformanceSnapshotTrigger.php'));
        $this->assertFileExists(app_path('Services/PerformanceAnalytics/PerformanceSnapshotRecorder.php'));
    }
}
