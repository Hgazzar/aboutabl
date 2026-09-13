<?php

namespace Tests\Unit\Assignment;

use App\Contracts\Assignment\AssignmentAnalyticsInterface;
use App\Contracts\Assignment\AssignmentMaterialResolverInterface;
use App\Contracts\Assignment\AssignmentTargetResolverInterface;
use App\Services\Assignment\AssignmentAnalyticsService;
use App\Services\Assignment\AssignmentLifecycleService;
use App\Services\Assignment\AssignmentMaterialResolver;
use App\Services\Assignment\AssignmentPermissionService;
use App\Services\Assignment\AssignmentService;
use App\Services\Assignment\AssignmentTargetingService;
use Tests\TestCase;

/**
 * F-041C — Assignment foundation architecture checks (no schema product changes).
 */
class AssignmentFoundationTest extends TestCase
{
    public function test_bindings_resolve_to_foundation_services(): void
    {
        $this->assertInstanceOf(
            AssignmentTargetingService::class,
            app(AssignmentTargetResolverInterface::class)
        );
        $this->assertInstanceOf(
            AssignmentMaterialResolver::class,
            app(AssignmentMaterialResolverInterface::class)
        );
        $this->assertInstanceOf(
            AssignmentAnalyticsService::class,
            app(AssignmentAnalyticsInterface::class)
        );
        $this->assertInstanceOf(AssignmentService::class, app(AssignmentService::class));
        $this->assertInstanceOf(
            AssignmentLifecycleService::class,
            app(AssignmentLifecycleService::class)
        );
    }

    public function test_statistics_and_notification_services_were_not_introduced(): void
    {
        $this->assertFileDoesNotExist(
            app_path('Services/Assignment/AssignmentStatisticsService.php')
        );
        $this->assertFileDoesNotExist(
            app_path('Services/Assignment/AssignmentNotificationService.php')
        );
        $this->assertFalse(class_exists('App\\Services\\Assignment\\AssignmentStatisticsService'));
        $this->assertFalse(class_exists('App\\Services\\Assignment\\AssignmentNotificationService'));
    }

    public function test_material_resolver_returns_empty_when_none(): void
    {
        $resolver = new AssignmentMaterialResolver();
        $this->assertSame([], $resolver->resolveForAssign(1));
        $this->assertSame([], app(AssignmentService::class)->materialsFor(99));
    }

    public function test_analytics_stub_is_noop(): void
    {
        $analytics = new AssignmentAnalyticsService();
        $analytics->record('assign.created', ['assign_id' => 1]);
        $this->assertTrue(true);
    }

    public function test_targeting_prefers_student_ids_then_class_then_grade(): void
    {
        $targeting = new AssignmentTargetingService();

        $this->assertSame(
            [10, 11],
            $targeting->resolveStudentIds(['student_id' => [10, 11], 'class_id' => [1]])
        );
    }

    public function test_permission_resolve_created_by_rejects_teacher_id_spoof(): void
    {
        $permissions = new AssignmentPermissionService();

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('forbidden');
        $permissions->resolveCreatedBy(55, 9);
    }

    public function test_permission_resolve_created_by_uses_authenticated_teacher(): void
    {
        $permissions = new AssignmentPermissionService();
        $this->assertSame(9, $permissions->resolveCreatedBy(null, 9));
        $this->assertSame(9, $permissions->resolveCreatedBy(0, 9));
        $this->assertSame(9, $permissions->resolveCreatedBy(9, 9));
    }

    public function test_lifecycle_mark_opened_preserves_idempotent_semantics(): void
    {
        $lifecycle = file_get_contents(
            app_path('Services/Assignment/AssignmentLifecycleService.php')
        );
        $this->assertStringContainsString('function markOpened', $lifecycle);
        $this->assertStringContainsString('if (! $row->opened_at)', $lifecycle);
        $this->assertStringContainsString("opened_at = now()", $lifecycle);

        $studentController = file_get_contents(
            app_path('Http/Controllers/Api/StudentControllers/SubjectController.php')
        );
        $this->assertStringContainsString('AssignmentService $assignments', $studentController);
        $this->assertStringContainsString('markOpened(', $studentController);
    }

    public function test_assigns_controller_delegates_to_assignment_service(): void
    {
        $controller = file_get_contents(
            app_path('Http/Controllers/Api/AdminControllers/AssignsController.php')
        );
        $this->assertStringContainsString('AssignmentService', $controller);
        $this->assertStringContainsString('StoreAssignRequest', $controller);
        $this->assertStringNotContainsString('Notification::create', $controller);
        $this->assertStringNotContainsString('Assigns::create', $controller);
    }

    public function test_lifecycle_owns_notification_create_not_a_notification_service(): void
    {
        $lifecycle = file_get_contents(
            app_path('Services/Assignment/AssignmentLifecycleService.php')
        );
        $this->assertStringContainsString('Notification::create', $lifecycle);
        $this->assertMatchesRegularExpression(
            '/Notification::create\s*\(/',
            $lifecycle
        );
        $this->assertFileDoesNotExist(
            app_path('Services/Assignment/AssignmentNotificationService.php')
        );
    }

    public function test_existing_statistics_owners_remain(): void
    {
        foreach ([
            'LearningProgressService.php',
            'StudentMetricsService.php',
            'TeacherDashboardService.php',
            'ClassAlertsService.php',
            'ClassActivitiesTasksService.php',
        ] as $file) {
            $this->assertFileExists(app_path('Services/'.$file));
        }
    }

    public function test_assignment_policy_is_registered(): void
    {
        $auth = file_get_contents(app_path('Providers/AuthServiceProvider.php'));
        $this->assertStringContainsString('AssignmentPolicy', $auth);
        $this->assertStringContainsString('QuizAttemptPolicy', $auth);
        $this->assertStringContainsString('Assigns::class', $auth);
    }
}
