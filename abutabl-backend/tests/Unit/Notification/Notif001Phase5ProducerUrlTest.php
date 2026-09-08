<?php

namespace Tests\Unit\Notification;

use Tests\TestCase;

/**
 * NOTIF-001 Phase 5 — approved producer URL migrations (source contracts).
 */
class Notif001Phase5ProducerUrlTest extends TestCase
{
    public function test_assignment_lifecycle_uses_assign_id_deep_link_not_bare_todo(): void
    {
        $src = (string) file_get_contents(
            app_path('Services/Assignment/AssignmentLifecycleService.php')
        );

        $this->assertStringContainsString("'/todo/assign/'.(int) \$assign->id", $src);
        $this->assertSame(
            2,
            substr_count($src, "'/todo/assign/'.(int) \$assign->id"),
            'Both create and createLearningActivities must emit assign deep links.'
        );

        // Must not still write bare /todo for notifications (assigned_path may still mention todo elsewhere).
        $this->assertDoesNotMatchRegularExpression(
            "/'url'\\s*=>\\s*'\\/todo'\\s*,/",
            $src
        );

        // type/type_id remain module identity — still assigned from $type / $typeId.
        $this->assertMatchesRegularExpression("/'type'\\s*=>\\s*\\\$type/", $src);
        $this->assertMatchesRegularExpression("/'type_id'\\s*=>\\s*\\\$typeId/", $src);

        // Do not blindly wire createIfMissing for assignment rows.
        $this->assertStringNotContainsString('createIfMissing', $src);
        $this->assertStringNotContainsString('NotificationInboxService', $src);
    }

    public function test_quiz_adapter_teacher_and_student_urls(): void
    {
        $src = (string) file_get_contents(
            app_path('Services/QuizRuntime/QuizNotificationsAdapter.php')
        );

        $this->assertStringContainsString("'/subjects/quiz/'", $src);
        $this->assertStringContainsString("'/learn/'", $src);
        $this->assertStringContainsString("'/quiz/'", $src);
        $this->assertStringContainsString('settings_frozen', $src);
        $this->assertStringContainsString('subject_id', $src);
        $this->assertStringContainsString('TYPE_STUDENT_RESULT', $src);
        $this->assertStringContainsString('createIfMissing', $src);

        // Student result must not reuse staff subjects/quiz path as destination variable for student.
        $this->assertStringContainsString(
            "Student quiz_runtime_result requires subject_id in Version settings_frozen",
            $src
        );
    }

    public function test_login_producers_use_canonical_student_view_path(): void
    {
        $studentAuth = (string) file_get_contents(
            app_path('Http/Controllers/Api/StudentControllers/Auth/AuthApiController.php')
        );
        $adminAuth = (string) file_get_contents(
            app_path('Http/Controllers/Api/AdminControllers/Auth/AuthApiController.php')
        );

        $this->assertStringContainsString('"/user/student/view/"', $studentAuth);
        $this->assertStringNotContainsString("'url'            => \"user/student/view/\"", $studentAuth);

        $this->assertStringContainsString("'/user/student/view/'", $adminAuth);
        $this->assertStringNotContainsString("'url' => 'user/student/view/'", $adminAuth);
    }

    public function test_subject_open_producers_use_leading_slash_staff_paths(): void
    {
        $src = (string) file_get_contents(
            app_path('Http/Controllers/Api/StudentControllers/SubjectController.php')
        );

        $this->assertStringContainsString('"/subjects/scorm/"', $src);
        $this->assertStringContainsString('"/subjects/GameView/"', $src);
        $this->assertStringContainsString('"/subjects/quiz/"', $src);

        $this->assertStringNotContainsString("'url'            => \"subjects/scorm/\"", $src);
        $this->assertStringNotContainsString("'url'            => \"subjects/GameView/\"", $src);
        $this->assertStringNotContainsString("'url'            => \"subjects/quiz/\"", $src);
    }

    public function test_student_todo_assign_route_exists_in_spa(): void
    {
        $routes = (string) file_get_contents(
            base_path('../abutabl-student/src/routes/routes.tsx')
        );
        $this->assertStringContainsString("path: 'assign/:assignId'", $routes);
        $this->assertStringContainsString('TodoAssignActivities', $routes);
    }

    public function test_admin_subjects_quiz_and_student_view_routes_exist(): void
    {
        $app = (string) file_get_contents(
            base_path('../abutabl-admin/src/App.tsx')
        );
        $this->assertStringContainsString('path="subjects/quiz/:id"', $app);
        $this->assertStringContainsString('path="user/student/view/:id"', $app);
    }
}
