<?php

namespace Tests\Unit\Assignment;

use App\Services\Assignment\AssignmentLifecycleService;
use App\Services\Assignment\AssignmentPermissionService;
use App\Services\Assignment\AssignmentService;
use App\Services\Assignment\AssignmentTargetingService;
use Tests\TestCase;

/**
 * F-041D — Integration / write-pipeline verification (no contract changes).
 */
class AssignmentIntegrationTest extends TestCase
{
    public function test_core_services_are_singletons_and_wired(): void
    {
        $this->assertSame(app(AssignmentService::class), app(AssignmentService::class));
        $this->assertSame(
            app(AssignmentLifecycleService::class),
            app(AssignmentLifecycleService::class)
        );
        $this->assertSame(
            app(AssignmentPermissionService::class),
            app(AssignmentPermissionService::class)
        );
        $this->assertInstanceOf(
            AssignmentTargetingService::class,
            app(\App\Contracts\Assignment\AssignmentTargetResolverInterface::class)
        );
        $this->assertInstanceOf(
            AssignmentPermissionService::class,
            app(AssignmentService::class)->permissions()
        );
    }

    public function test_assigns_controller_has_no_duplicated_write_logic(): void
    {
        $controller = file_get_contents(
            app_path('Http/Controllers/Api/AdminControllers/AssignsController.php')
        );

        foreach ([
            'Assigns::create',
            'AssignsStudents::create',
            'Notification::create',
            'PerformanceSnapshotTrigger',
            'DB::beginTransaction',
            'Validator::make',
        ] as $needle) {
            $this->assertStringNotContainsString($needle, $controller, $needle);
        }

        $this->assertStringContainsString('ListAssignsRequest', $controller);
        $this->assertStringContainsString('StoreAssignRequest', $controller);
        $this->assertStringContainsString('ModuleDataAssignRequest', $controller);
        $this->assertStringContainsString('DeleteAssignRequest', $controller);
        $this->assertStringContainsString('$this->assignments->create', $controller);
        $this->assertStringContainsString('$this->assignments->delete', $controller);
    }

    public function test_store_request_owns_due_at_required_rule(): void
    {
        $store = file_get_contents(
            app_path('Http/Requests/Assignment/StoreAssignRequest.php')
        );
        $this->assertStringContainsString('withValidator', $store);
        $this->assertStringContainsString("input('due_at', \$this->input('due_date'))", $store);

        $controller = file_get_contents(
            app_path('Http/Controllers/Api/AdminControllers/AssignsController.php')
        );
        $this->assertStringNotContainsString('empty($dueAtInput)', $controller);
    }

    public function test_single_write_pipeline_markers_in_lifecycle(): void
    {
        $lifecycle = file_get_contents(
            app_path('Services/Assignment/AssignmentLifecycleService.php')
        );

        $this->assertStringContainsString('Assigns::create', $lifecycle);
        $this->assertStringContainsString('AssignsStudents::create', $lifecycle);
        $this->assertStringContainsString('Notification::create', $lifecycle);
        $this->assertStringContainsString('PerformanceSnapshotSource::ASSIGN_CREATED', $lifecycle);
        $this->assertStringContainsString('PerformanceSnapshotSource::ASSIGN_DELETED', $lifecycle);
        $this->assertEquals(
            1,
            preg_match_all('/Assigns::create\s*\(/', $lifecycle)
        );
        $this->assertEquals(
            1,
            preg_match_all('/Notification::create\s*\(/', $lifecycle)
        );
    }

    public function test_observer_still_registered_for_opened_at_snapshots(): void
    {
        $provider = file_get_contents(app_path('Providers/AppServiceProvider.php'));
        $this->assertStringContainsString(
            'AssignsStudents::observe(AssignsStudentsObserver::class)',
            $provider
        );
    }

    public function test_read_path_owners_untouched_by_assignment_services(): void
    {
        foreach ([
            'LearningProgressService.php',
            'TeacherDashboardService.php',
            'StudentMetricsService.php',
            'ClassActivitiesTasksService.php',
        ] as $file) {
            $src = file_get_contents(app_path('Services/'.$file));
            $this->assertStringNotContainsString('AssignmentService', $src);
            $this->assertStringNotContainsString('AssignmentLifecycleService', $src);
        }
    }

    public function test_api_routes_unchanged(): void
    {
        $admin = file_get_contents(base_path('routes/api/admin.php'));
        $student = file_get_contents(base_path('routes/api/student.php'));

        $this->assertStringContainsString("Route::get('/assigns/get_module_data'", $admin);
        $this->assertStringContainsString("Route::post('/assigns/store'", $admin);
        $this->assertStringContainsString("Route::get('/assigns/list'", $admin);
        $this->assertStringContainsString("Route::delete('/assigns/delete/{id}'", $admin);
        $this->assertStringContainsString("Route::post('/todo/markOpened'", $student);
        $this->assertStringContainsString("Route::get('/todaoList'", $student);
    }

    public function test_permission_service_used_by_assignment_service(): void
    {
        $service = file_get_contents(app_path('Services/Assignment/AssignmentService.php'));
        $this->assertStringContainsString('canCreate', $service);
        $this->assertStringContainsString('canDelete', $service);
        $this->assertStringContainsString('AssignmentPermissionService', $service);
    }
}
