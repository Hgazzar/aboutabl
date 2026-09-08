<?php

namespace Tests\Unit\QuizRuntime;

use App\Models\Notification;
use App\Models\QuizRuntime\QuizAttempt;
use App\Models\QuizRuntime\QuizResult;
use App\Models\QuizRuntime\QuizVersion;
use App\Models\Student;
use App\Services\Notification\NotificationInboxService;
use App\Services\QuizRuntime\QuizNotificationsAdapter;
use Illuminate\Support\Facades\Schema;
use Mockery;
use Tests\TestCase;
use Throwable;

/**
 * NOTIF-001 Phase 5 — QuizNotificationsAdapter deep-link + idempotency.
 */
class QuizNotificationsAdapterUrlTest extends TestCase
{
    /** @var int[] */
    private $createdNotificationIds = [];

    protected function tearDown(): void
    {
        if ($this->createdNotificationIds !== []) {
            try {
                Notification::query()->whereIn('id', $this->createdNotificationIds)->delete();
            } catch (Throwable $e) {
                // ignore
            }
        }
        Mockery::close();
        parent::tearDown();
    }

    private function requireTables(): void
    {
        try {
            if (! Schema::hasTable('notifications')) {
                $this->markTestSkipped('notifications missing');
            }
        } catch (Throwable $e) {
            $this->markTestSkipped('DB unavailable: '.$e->getMessage());
        }
    }

    public function test_student_result_url_uses_learn_path_and_teacher_uses_subjects_path(): void
    {
        $this->requireTables();

        $student = Student::query()->orderBy('id')->first();
        if (! $student) {
            $this->markTestSkipped('No student');
        }

        $attempt = Mockery::mock(QuizAttempt::class)->makePartial();
        $attempt->id = 910001;
        $attempt->quiz_id = 55;
        $attempt->student_id = (int) $student->id;
        $attempt->status = QuizAttempt::STATUS_FINALIZED;
        $attempt->assign_student_id = null;
        $attempt->assign_id = null;
        $attempt->submitted_at = null;
        $attempt->ends_at = null;
        $attempt->shouldReceive('loadMissing')->andReturnSelf();

        $version = new QuizVersion;
        $version->id = 1;
        $version->settings_frozen = [
            'title_en' => 'Phase5 Quiz',
            'subject_id' => 7,
            'notify_about_submission' => false,
            'notify_about_late_submission' => false,
            'notify_student' => true,
        ];
        $attempt->setRelation('version', $version);

        $result = Mockery::mock(QuizResult::class)->makePartial();
        $result->attempt_id = 910001;
        $result->is_authoritative = true;
        $result->passed = true;
        $result->percent = 88.5;

        Schema::disableForeignKeyConstraints();
        try {
            app(QuizNotificationsAdapter::class)->apply($attempt, $result);
        } finally {
            Schema::enableForeignKeyConstraints();
        }

        $row = Notification::query()
            ->where('type', QuizNotificationsAdapter::TYPE_STUDENT_RESULT)
            ->where('type_id', 910001)
            ->where('to_user_type', 'student')
            ->where('to_user_id', (int) $student->id)
            ->orderByDesc('id')
            ->first();

        $this->assertNotNull($row);
        $this->createdNotificationIds[] = (int) $row->id;
        $this->assertSame('/learn/7/quiz/55', $row->url);
        $this->assertStringNotContainsString('/subjects/quiz/', (string) $row->url);
    }

    public function test_student_result_requires_subject_id_in_frozen_settings(): void
    {
        $this->requireTables();

        $student = Student::query()->orderBy('id')->first();
        if (! $student) {
            $this->markTestSkipped('No student');
        }

        $attempt = Mockery::mock(QuizAttempt::class)->makePartial();
        $attempt->id = 910002;
        $attempt->quiz_id = 55;
        $attempt->student_id = (int) $student->id;
        $attempt->status = QuizAttempt::STATUS_FINALIZED;
        $attempt->assign_student_id = null;
        $attempt->assign_id = null;
        $attempt->submitted_at = null;
        $attempt->ends_at = null;
        $attempt->shouldReceive('loadMissing')->andReturnSelf();

        $version = new QuizVersion;
        $version->settings_frozen = [
            'title_en' => 'No Subject',
            'notify_student' => true,
            'notify_about_submission' => false,
            'notify_about_late_submission' => false,
        ];
        $attempt->setRelation('version', $version);

        $result = Mockery::mock(QuizResult::class)->makePartial();
        $result->attempt_id = 910002;
        $result->is_authoritative = true;
        $result->passed = false;
        $result->percent = 40;

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('subject_id');

        app(QuizNotificationsAdapter::class)->apply($attempt, $result);
    }

    public function test_teacher_submission_url_is_canonical_and_idempotent(): void
    {
        $this->requireTables();

        $student = Student::query()->orderBy('id')->first(['id', 'name', 'grade_id', 'class_id', 'school_id']);
        if (! $student) {
            $this->markTestSkipped('No student');
        }

        $teacherId = (int) (\App\Models\User::query()->where('type', '!=', 'admin')->orderBy('id')->value('id') ?? 0);
        if ($teacherId < 1) {
            $this->markTestSkipped('No teacher');
        }

        $inbox = app(NotificationInboxService::class);
        $attrs = [
            'title' => 'Phase5 Teacher',
            'description' => 'submitted',
            'from_user_type' => 'student',
            'from_user_id' => (int) $student->id,
            'to_user_type' => 'teacher',
            'to_user_id' => $teacherId,
            'url' => '/subjects/quiz/55',
            'type' => QuizNotificationsAdapter::TYPE_TEACHER_SUBMISSION,
            'type_id' => 910003,
            'is_read' => 0,
        ];

        Schema::disableForeignKeyConstraints();
        try {
            $first = $inbox->createIfMissing($attrs);
            $second = $inbox->createIfMissing($attrs);
        } finally {
            Schema::enableForeignKeyConstraints();
        }

        $this->createdNotificationIds[] = (int) $first->id;
        $this->assertSame((int) $first->id, (int) $second->id);
        $this->assertSame('/subjects/quiz/55', $first->url);
        $this->assertStringStartsWith('/', (string) $first->url);
    }
}
