<?php

namespace Tests\Feature\Notification;

use App\Models\Notification;
use App\Models\Student;
use App\Models\User;
use App\Services\Notification\NotificationInboxService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;
use Throwable;

/**
 * NOTIF-001 — recipient isolation (Phase 1) + deep-link / list contract (Phase 2).
 */
class NotificationInboxApiTest extends TestCase
{
    /** @var int[] */
    private $createdIds = [];

    /** @var int[] */
    private $createdUserIds = [];

    protected function tearDown(): void
    {
        if ($this->createdIds !== []) {
            try {
                Notification::query()->whereIn('id', $this->createdIds)->delete();
            } catch (Throwable $e) {
                // ignore
            }
        }
        if ($this->createdUserIds !== []) {
            try {
                \Illuminate\Support\Facades\DB::table('users')->whereIn('id', $this->createdUserIds)->delete();
            } catch (Throwable $e) {
                // ignore
            }
        }
        parent::tearDown();
    }

    private function apiSecret(): string
    {
        return (string) env('API_SECRET', 'OASzRok654E0AJ20KH');
    }

    private function requireTable(): void
    {
        try {
            if (! Schema::hasTable('notifications')) {
                $this->markTestSkipped('notifications table missing.');
            }
        } catch (Throwable $e) {
            $this->markTestSkipped('Database unavailable: '.$e->getMessage());
        }
    }

    private function track(Notification $n): Notification
    {
        $this->createdIds[] = (int) $n->id;

        return $n;
    }

    /**
     * @return array<string, string>
     */
    private function studentHeaders(Student $student): array
    {
        auth()->setDefaultDriver('user-api');
        $token = Auth::guard('user-api')->login($student);

        return [
            'Authorization' => 'Bearer '.$token,
            'Authorizations' => 'Bearer '.$token,
            'apiSecret' => $this->apiSecret(),
            'Accept' => 'application/json',
        ];
    }

    /**
     * @return array<string, string>
     */
    private function staffHeaders(User $user): array
    {
        auth()->setDefaultDriver('admin-api');
        $token = Auth::guard('admin-api')->login($user);

        return [
            'Authorization' => 'Bearer '.$token,
            'Authorizations' => 'Bearer '.$token,
            'apiSecret' => $this->apiSecret(),
            'Accept' => 'application/json',
        ];
    }

    private function seedNotification(array $attrs): Notification
    {
        // Phase 1: DB still FKs *_user_id → users.id while student recipients use
        // students.id. Disable constraints only for test seeding (FK migration deferred).
        Schema::disableForeignKeyConstraints();
        try {
            $n = Notification::create(array_merge([
                'title' => 'NOTIF-001',
                'description' => 'test',
                'from_user_type' => 'system',
                'from_user_id' => null,
                'url' => null,
                'type' => 'notif_001_api',
                'type_id' => null,
                'is_read' => 0,
            ], $attrs));
        } finally {
            Schema::enableForeignKeyConstraints();
        }

        return $this->track($n);
    }

    private function ensureSecondTeacher(User $owner): ?User
    {
        $other = User::query()
            ->where('type', '!=', 'admin')
            ->where('id', '!=', $owner->id)
            ->orderBy('id')
            ->first();
        if ($other) {
            return $other;
        }

        try {
            $suffix = substr((string) microtime(true), -6);
            $id = (int) DB::table('users')->insertGetId([
                'name' => 'NOTIF Other Teacher',
                'username' => 'notif_other_'.$suffix,
                'email' => 'notif-other-'.$suffix.'@test.local',
                'phone' => '0188'.$suffix,
                'password' => bcrypt('secret'),
                'type' => 'teacher',
                'status' => '1',
                'verify' => '1',
                'school_id' => (int) ($owner->school_id ?? 1),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $this->createdUserIds[] = $id;

            return User::query()->find($id);
        } catch (Throwable $e) {
            return null;
        }
    }

    private function ensureAdminUser(): ?User
    {
        $admin = User::query()->where('type', 'admin')->orderBy('id')->first();
        if ($admin) {
            return $admin;
        }

        try {
            $suffix = substr((string) microtime(true), -6);
            $id = (int) DB::table('users')->insertGetId([
                'name' => 'NOTIF Admin',
                'username' => 'notif_admin_'.$suffix,
                'email' => 'notif-admin-'.$suffix.'@test.local',
                'phone' => '0199'.$suffix,
                'password' => bcrypt('secret'),
                'type' => 'admin',
                'status' => '1',
                'verify' => '1',
                'school_id' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $this->createdUserIds[] = $id;

            return User::query()->find($id);
        } catch (Throwable $e) {
            return null;
        }
    }

    public function test_student_list_only_own_notifications(): void
    {
        $this->requireTable();

        $students = Student::query()->orderBy('id')->limit(2)->get();
        if ($students->count() < 2) {
            $this->markTestSkipped('Need two students.');
        }

        [$a, $b] = [$students[0], $students[1]];
        $mine = $this->seedNotification([
            'to_user_type' => 'student',
            'to_user_id' => (int) $a->id,
            'title' => 'mine-'.$a->id,
            'type' => 'notif_001_student_list',
            'type_id' => 910001,
        ]);
        $this->seedNotification([
            'to_user_type' => 'student',
            'to_user_id' => (int) $b->id,
            'title' => 'theirs-'.$b->id,
            'type' => 'notif_001_student_list',
            'type_id' => 910002,
        ]);

        $response = $this->withHeaders($this->studentHeaders($a))
            ->getJson('/api/student/notifications/list');

        $response->assertStatus(200)->assertJson(['status' => true]);
        $ids = collect($response->json('notifications'))->pluck('id')->map(fn ($id) => (int) $id)->all();
        $this->assertContains((int) $mine->id, $ids);
        $this->assertNotContains(
            (int) Notification::query()
                ->where('to_user_type', 'student')
                ->where('to_user_id', (int) $b->id)
                ->where('type', 'notif_001_student_list')
                ->where('type_id', 910002)
                ->value('id'),
            $ids
        );
    }

    public function test_student_cannot_mark_another_students_notification_read(): void
    {
        $this->requireTable();

        $students = Student::query()->orderBy('id')->limit(2)->get();
        if ($students->count() < 2) {
            $this->markTestSkipped('Need two students.');
        }

        [$a, $b] = [$students[0], $students[1]];
        $other = $this->seedNotification([
            'to_user_type' => 'student',
            'to_user_id' => (int) $b->id,
            'type' => 'notif_001_student_idor',
            'type_id' => 910010,
            'is_read' => 0,
        ]);

        $response = $this->withHeaders($this->studentHeaders($a))
            ->postJson('/api/student/notifications/update_read/'.$other->id);

        $response->assertStatus(403);
        $this->assertSame(0, (int) Notification::query()->whereKey($other->id)->value('is_read'));
    }

    public function test_student_can_mark_own_notification_read(): void
    {
        $this->requireTable();

        $student = Student::query()->orderBy('id')->first();
        if (! $student) {
            $this->markTestSkipped('No student.');
        }

        $mine = $this->seedNotification([
            'to_user_type' => 'student',
            'to_user_id' => (int) $student->id,
            'type' => 'notif_001_student_own_read',
            'type_id' => 910011,
            'is_read' => 0,
        ]);

        $response = $this->withHeaders($this->studentHeaders($student))
            ->postJson('/api/student/notifications/update_read/'.$mine->id);

        $response->assertStatus(200)->assertJson(['status' => true]);
        $this->assertSame(1, (int) Notification::query()->whereKey($mine->id)->value('is_read'));
    }

    public function test_student_mark_all_read_and_delete_all_are_scoped(): void
    {
        $this->requireTable();

        $students = Student::query()->orderBy('id')->limit(2)->get();
        if ($students->count() < 2) {
            $this->markTestSkipped('Need two students.');
        }

        [$a, $b] = [$students[0], $students[1]];
        $mine1 = $this->seedNotification([
            'to_user_type' => 'student',
            'to_user_id' => (int) $a->id,
            'type' => 'notif_001_student_mark_all',
            'type_id' => 910020,
            'is_read' => 0,
        ]);
        $mine2 = $this->seedNotification([
            'to_user_type' => 'student',
            'to_user_id' => (int) $a->id,
            'type' => 'notif_001_student_mark_all',
            'type_id' => 910021,
            'is_read' => 0,
        ]);
        $other = $this->seedNotification([
            'to_user_type' => 'student',
            'to_user_id' => (int) $b->id,
            'type' => 'notif_001_student_mark_all',
            'type_id' => 910022,
            'is_read' => 0,
        ]);

        $headers = $this->studentHeaders($a);

        $mark = $this->withHeaders($headers)->postJson('/api/student/notifications/mark_all_read');
        $mark->assertStatus(200)->assertJson(['status' => true]);
        $this->assertSame(1, (int) Notification::query()->whereKey($mine1->id)->value('is_read'));
        $this->assertSame(1, (int) Notification::query()->whereKey($mine2->id)->value('is_read'));
        $this->assertSame(0, (int) Notification::query()->whereKey($other->id)->value('is_read'));

        $del = $this->withHeaders($headers)->deleteJson('/api/student/notifications/delete_all');
        $del->assertStatus(200)->assertJson(['status' => true]);
        $this->assertNull(Notification::query()->find($mine1->id));
        $this->assertNull(Notification::query()->find($mine2->id));
        $this->assertNotNull(Notification::query()->find($other->id));
    }

    public function test_student_unread_count_matches_ownership(): void
    {
        $this->requireTable();

        $student = Student::query()->orderBy('id')->first();
        if (! $student) {
            $this->markTestSkipped('No student.');
        }

        $inbox = app(NotificationInboxService::class);
        $recipient = $inbox->recipientForStudent($student);
        $before = $inbox->unreadCount($recipient);

        $this->seedNotification([
            'to_user_type' => 'student',
            'to_user_id' => (int) $student->id,
            'type' => 'notif_001_student_unread',
            'type_id' => 910030,
            'is_read' => 0,
        ]);

        $this->assertSame($before + 1, $inbox->unreadCount($recipient));

        $nav = $this->withHeaders($this->studentHeaders($student))
            ->getJson('/api/student/navbar');
        if ($nav->status() === 200 && is_array($nav->json('notifications'))) {
            $this->assertSame(
                $inbox->unreadCount($recipient),
                (int) ($nav->json('notifications.unread_count') ?? -1)
            );
        }
    }

    public function test_teacher_list_and_mark_read_isolation(): void
    {
        $this->requireTable();

        $t1 = User::query()->where('type', '!=', 'admin')->orderBy('id')->first();
        if (! $t1) {
            $this->markTestSkipped('Need a teacher user.');
        }
        $t2 = $this->ensureSecondTeacher($t1);
        if (! $t2) {
            $this->markTestSkipped('Could not provision second teacher.');
        }
        $mine = $this->seedNotification([
            'to_user_type' => 'teacher',
            'to_user_id' => (int) $t1->id,
            'type' => 'notif_001_teacher_list',
            'type_id' => 910100,
            'is_read' => 0,
        ]);
        $other = $this->seedNotification([
            'to_user_type' => 'teacher',
            'to_user_id' => (int) $t2->id,
            'type' => 'notif_001_teacher_list',
            'type_id' => 910101,
            'is_read' => 0,
        ]);

        $list = $this->withHeaders($this->staffHeaders($t1))->getJson('/api/notifications/list');
        $list->assertStatus(200);
        $ids = collect($list->json('notifications'))->pluck('id')->map(fn ($id) => (int) $id)->all();
        $this->assertContains((int) $mine->id, $ids);
        $this->assertNotContains((int) $other->id, $ids);

        $idor = $this->withHeaders($this->staffHeaders($t1))
            ->postJson('/api/notifications/update_read/'.$other->id);
        $idor->assertStatus(403);
        $this->assertSame(0, (int) Notification::query()->whereKey($other->id)->value('is_read'));

        $ok = $this->withHeaders($this->staffHeaders($t1))
            ->postJson('/api/notifications/update_read/'.$mine->id);
        $ok->assertStatus(200);
        $this->assertSame(1, (int) Notification::query()->whereKey($mine->id)->value('is_read'));
    }

    public function test_teacher_mark_all_read_and_delete_all_are_scoped(): void
    {
        $this->requireTable();

        $t1 = User::query()->where('type', '!=', 'admin')->orderBy('id')->first();
        if (! $t1) {
            $this->markTestSkipped('Need a teacher user.');
        }
        $t2 = $this->ensureSecondTeacher($t1);
        if (! $t2) {
            $this->markTestSkipped('Could not provision second teacher.');
        }
        $mine = $this->seedNotification([
            'to_user_type' => 'teacher',
            'to_user_id' => (int) $t1->id,
            'type' => 'notif_001_teacher_bulk',
            'type_id' => 910110,
            'is_read' => 0,
        ]);
        $other = $this->seedNotification([
            'to_user_type' => 'teacher',
            'to_user_id' => (int) $t2->id,
            'type' => 'notif_001_teacher_bulk',
            'type_id' => 910111,
            'is_read' => 0,
        ]);

        $headers = $this->staffHeaders($t1);
        $this->withHeaders($headers)->postJson('/api/notifications/mark_all_read')
            ->assertStatus(200);
        $this->assertSame(1, (int) Notification::query()->whereKey($mine->id)->value('is_read'));
        $this->assertSame(0, (int) Notification::query()->whereKey($other->id)->value('is_read'));

        $this->withHeaders($headers)->deleteJson('/api/notifications/delete_all')
            ->assertStatus(200);
        $this->assertNull(Notification::query()->find($mine->id));
        $this->assertNotNull(Notification::query()->find($other->id));
    }

    public function test_admin_recipient_isolation_from_teacher_notifications(): void
    {
        $this->requireTable();

        $admin = $this->ensureAdminUser();
        $teacher = User::query()->where('type', '!=', 'admin')->orderBy('id')->first();
        if (! $admin || ! $teacher) {
            $this->markTestSkipped('Need admin + teacher users.');
        }

        $adminNote = $this->seedNotification([
            'to_user_type' => 'admin',
            'to_user_id' => (int) $admin->id,
            'type' => 'notif_001_admin_own',
            'type_id' => 910200,
            'is_read' => 0,
        ]);
        $teacherNote = $this->seedNotification([
            'to_user_type' => 'teacher',
            'to_user_id' => (int) $teacher->id,
            'type' => 'notif_001_admin_vs_teacher',
            'type_id' => 910201,
            'is_read' => 0,
        ]);
        $otherAdmin = User::query()
            ->where('type', 'admin')
            ->where('id', '!=', $admin->id)
            ->orderBy('id')
            ->first();

        $headers = $this->staffHeaders($admin);

        $list = $this->withHeaders($headers)->getJson('/api/notifications/list');
        $list->assertStatus(200);
        $ids = collect($list->json('notifications'))->pluck('id')->map(fn ($id) => (int) $id)->all();
        $this->assertContains((int) $adminNote->id, $ids);
        $this->assertNotContains((int) $teacherNote->id, $ids);

        $this->withHeaders($headers)
            ->postJson('/api/notifications/update_read/'.$teacherNote->id)
            ->assertStatus(403);
        $this->assertSame(0, (int) Notification::query()->whereKey($teacherNote->id)->value('is_read'));

        $this->withHeaders($headers)
            ->postJson('/api/notifications/update_read/'.$adminNote->id)
            ->assertStatus(200);
        $this->assertSame(1, (int) Notification::query()->whereKey($adminNote->id)->value('is_read'));

        if ($otherAdmin) {
            $otherNote = $this->seedNotification([
                'to_user_type' => 'admin',
                'to_user_id' => (int) $otherAdmin->id,
                'type' => 'notif_001_admin_other',
                'type_id' => 910202,
                'is_read' => 0,
            ]);
            $this->withHeaders($headers)
                ->postJson('/api/notifications/update_read/'.$otherNote->id)
                ->assertStatus(403);
            $this->assertSame(0, (int) Notification::query()->whereKey($otherNote->id)->value('is_read'));
        }

        $freshAdmin = $this->seedNotification([
            'to_user_type' => 'admin',
            'to_user_id' => (int) $admin->id,
            'type' => 'notif_001_admin_mark_all',
            'type_id' => 910203,
            'is_read' => 0,
        ]);
        $this->withHeaders($headers)->postJson('/api/notifications/mark_all_read')->assertStatus(200);
        $this->assertSame(1, (int) Notification::query()->whereKey($freshAdmin->id)->value('is_read'));
        $this->assertSame(0, (int) Notification::query()->whereKey($teacherNote->id)->value('is_read'));
    }

    public function test_teacher_list_returns_host_free_urls_and_legacy_fields(): void
    {
        $this->requireTable();

        $teacher = User::query()->where('type', '!=', 'admin')->orderBy('id')->first();
        if (! $teacher) {
            $this->markTestSkipped('Need a teacher user.');
        }

        $relative = $this->seedNotification([
            'to_user_type' => 'teacher',
            'to_user_id' => (int) $teacher->id,
            'title' => 'relative-url',
            'url' => 'subjects/quiz/23',
            'type' => 'notif_001_phase2_rel',
            'type_id' => 920001,
            'is_read' => 0,
        ]);
        $legacyAbsolute = $this->seedNotification([
            'to_user_type' => 'teacher',
            'to_user_id' => (int) $teacher->id,
            'title' => 'legacy-absolute',
            'url' => 'https://aboutablsite.poultrystore.net/user/student/view/1',
            'type' => 'notif_001_phase2_abs',
            'type_id' => 920002,
            'is_read' => 0,
        ]);
        $external = $this->seedNotification([
            'to_user_type' => 'teacher',
            'to_user_id' => (int) $teacher->id,
            'title' => 'external',
            'url' => 'https://example.com/help',
            'type' => 'notif_001_phase2_ext',
            'type_id' => 920003,
            'is_read' => 0,
        ]);

        $response = $this->withHeaders($this->staffHeaders($teacher))
            ->getJson('/api/notifications/list');

        $response->assertStatus(200)->assertJson(['status' => true]);
        $byId = collect($response->json('notifications'))->keyBy(fn ($n) => (int) $n['id']);

        foreach ([$relative->id, $legacyAbsolute->id, $external->id] as $id) {
            $this->assertTrue($byId->has((int) $id));
            $row = $byId->get((int) $id);
            foreach (['id', 'title', 'description', 'is_read', 'url', 'from_id', 'name', 'photo'] as $field) {
                $this->assertArrayHasKey($field, $row);
            }
        }

        $this->assertSame('/subjects/quiz/23', $byId->get((int) $relative->id)['url']);
        $this->assertSame('/user/student/view/1', $byId->get((int) $legacyAbsolute->id)['url']);
        $this->assertSame('https://example.com/help', $byId->get((int) $external->id)['url']);

        $payload = json_encode($response->json());
        $this->assertStringNotContainsString('aboutablsite.poultrystore.net', (string) $payload);

        // Historical row unchanged in DB.
        $this->assertSame(
            'https://aboutablsite.poultrystore.net/user/student/view/1',
            Notification::query()->whereKey($legacyAbsolute->id)->value('url')
        );
    }

    public function test_student_list_normalizes_learn_and_todo_urls(): void
    {
        $this->requireTable();

        $student = Student::query()->orderBy('id')->first();
        if (! $student) {
            $this->markTestSkipped('No student.');
        }

        $todo = $this->seedNotification([
            'to_user_type' => 'student',
            'to_user_id' => (int) $student->id,
            'url' => '/todo',
            'type' => 'notif_001_phase2_todo',
            'type_id' => 920010,
        ]);
        $learn = $this->seedNotification([
            'to_user_type' => 'student',
            'to_user_id' => (int) $student->id,
            'url' => 'learn/5/details/22',
            'type' => 'notif_001_phase2_learn',
            'type_id' => 920011,
        ]);

        $response = $this->withHeaders($this->studentHeaders($student))
            ->getJson('/api/student/notifications/list');

        $response->assertStatus(200);
        $byId = collect($response->json('notifications'))->keyBy(fn ($n) => (int) $n['id']);

        $this->assertSame('/todo', $byId->get((int) $todo->id)['url']);
        $this->assertSame('/learn/5/details/22', $byId->get((int) $learn->id)['url']);
        $this->assertStringNotContainsString(
            'aboutablsite.poultrystore.net',
            (string) json_encode($response->json())
        );
    }

    public function test_admin_controller_source_has_no_hardcoded_poultrystore_host(): void
    {
        $path = app_path('Http/Controllers/Api/AdminControllers/NotificationsController.php');
        $src = (string) file_get_contents($path);
        $this->assertStringNotContainsString('aboutablsite.poultrystore.net', $src);
        $this->assertStringContainsString('NotificationUrlNormalizer', $src);
    }
}
