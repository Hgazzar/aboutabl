<?php

namespace Tests\Feature\Assignment;

use App\Models\AssignmentMaterial;
use App\Models\AssignmentStudentWork;
use App\Models\Student;
use App\Models\User;
use App\Support\Assignment\LearningActivityMap;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;
use Throwable;

/**
 * Phase 3 — Student My Work upload/list/delete + teacher review exposure.
 */
class AssignmentStudentWorkApiTest extends TestCase
{
    /** @var array<string, mixed>|null */
    private $fixture;

    protected function tearDown(): void
    {
        $this->destroyFixture();
        parent::tearDown();
    }

    private function apiSecret(): string
    {
        return (string) env('API_SECRET', 'OASzRok654E0AJ20KH');
    }

    /**
     * @return array<string, string>
     */
    private function teacherHeaders(User $teacher): array
    {
        auth()->setDefaultDriver('admin-api');
        $token = Auth::guard('admin-api')->login($teacher);

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
     * @return array<string, mixed>|null
     */
    private function seedFixture(): ?array
    {
        if (
            ! Schema::hasTable('assigns')
            || ! Schema::hasTable('assigns_students')
            || ! Schema::hasTable('assignment_student_works')
            || ! Schema::hasTable('students')
            || ! Schema::hasTable('users')
        ) {
            return null;
        }

        $owner = User::query()->where('id', 179)->first()
            ?? User::query()->where('type', '!=', 'admin')->orderBy('id')->first();
        $student = Student::query()->orderBy('id')->first();
        $peer = Student::query()->where('id', '!=', $student?->id)->orderBy('id')->first();
        $outsider = Student::query()
            ->whereNotIn('id', array_filter([$student?->id, $peer?->id]))
            ->orderBy('id')
            ->first()
            ?? $peer;

        if (! $owner || ! $student || ! $peer) {
            return null;
        }

        $otherTeacher = User::query()
            ->where('type', '!=', 'admin')
            ->where('id', '!=', $owner->id)
            ->orderBy('id')
            ->first();

        $createdOtherId = null;
        if (! $otherTeacher) {
            try {
                $suffix = substr((string) microtime(true), -6);
                $createdOtherId = (int) DB::table('users')->insertGetId([
                    'name' => 'MyWork Other Teacher',
                    'username' => 'mw_other_'.$suffix,
                    'email' => 'mw-other-'.$suffix.'@test.local',
                    'phone' => '0199'.$suffix,
                    'password' => bcrypt('secret'),
                    'type' => 'teacher',
                    'status' => '1',
                    'verify' => '1',
                    'school_id' => (int) ($owner->school_id ?? 1),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $otherTeacher = User::query()->find($createdOtherId);
            } catch (Throwable $e) {
                return null;
            }
        }

        $schoolId = (int) ($owner->school_id ?? 1);
        $suffix = 'mw'.substr((string) microtime(true), -6);
        $foreignSchoolId = null;
        $createdForeignSchoolId = null;

        if (Schema::hasTable('schools')) {
            $ownerSchoolIds = [];
            if (Schema::hasTable('schools_roles')) {
                $ownerSchoolIds = array_merge(
                    $ownerSchoolIds,
                    DB::table('schools_roles')->where('user_id', $owner->id)->pluck('school_id')->all()
                );
            }
            if (Schema::hasTable('teachers_grades')) {
                $ownerSchoolIds = array_merge(
                    $ownerSchoolIds,
                    DB::table('teachers_grades')->where('user_id', $owner->id)->pluck('school_id')->all()
                );
            }
            $ownerSchoolIds = array_values(array_unique(array_map('intval', $ownerSchoolIds)));
            if ($ownerSchoolIds === [] && $schoolId > 0) {
                $ownerSchoolIds = [$schoolId];
            }

            $foreignSchoolId = DB::table('schools')
                ->when($ownerSchoolIds !== [], function ($q) use ($ownerSchoolIds) {
                    $q->whereNotIn('id', $ownerSchoolIds);
                })
                ->orderBy('id')
                ->value('id');

            if ($foreignSchoolId === null) {
                try {
                    $createdForeignSchoolId = (int) DB::table('schools')->insertGetId([
                        'name' => 'MyWork Foreign School '.$suffix,
                        'name_ar' => 'MyWork Foreign School '.$suffix,
                        'status' => 1,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                    $foreignSchoolId = $createdForeignSchoolId;
                } catch (Throwable $e) {
                    $foreignSchoolId = null;
                    $createdForeignSchoolId = null;
                }
            } else {
                $foreignSchoolId = (int) $foreignSchoolId;
            }
        }

        try {
            $assignId = (int) DB::table('assigns')->insertGetId([
                'type' => LearningActivityMap::ASSIGN_TYPE,
                'type_id' => 0,
                'assigned_name' => "MyWork Assign {$suffix}",
                'assigned_path' => '/todo',
                'school_id' => $schoolId,
                'grade_id' => 1,
                'subject_id' => 1,
                'status' => 1,
                'created_by' => (int) $owner->id,
                'due_at' => now()->addDay(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $otherAssignId = (int) DB::table('assigns')->insertGetId([
                'type' => LearningActivityMap::ASSIGN_TYPE,
                'type_id' => 0,
                'assigned_name' => "MyWork Other Assign {$suffix}",
                'assigned_path' => '/todo',
                'school_id' => $schoolId,
                'grade_id' => 1,
                'subject_id' => 1,
                'status' => 1,
                'created_by' => (int) $owner->id,
                'due_at' => now()->addDay(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $membershipPayload = [
                'assign_id' => $assignId,
                'student_id' => $student->id,
                'school_id' => $schoolId,
                'status' => 1,
                'type' => LearningActivityMap::ASSIGN_TYPE,
                'type_id' => 0,
                'created_by' => (int) $owner->id,
                'created_at' => now(),
                'updated_at' => now(),
            ];
            if (Schema::hasColumn('assigns_students', 'submission_status')) {
                $membershipPayload['submission_status'] = 'active';
            }
            $assignStudentId = (int) DB::table('assigns_students')->insertGetId($membershipPayload);

            $peerPayload = $membershipPayload;
            $peerPayload['student_id'] = $peer->id;
            $peerAssignStudentId = (int) DB::table('assigns_students')->insertGetId($peerPayload);

            $otherMembership = [
                'assign_id' => $otherAssignId,
                'student_id' => $student->id,
                'school_id' => $schoolId,
                'status' => 1,
                'type' => LearningActivityMap::ASSIGN_TYPE,
                'type_id' => 0,
                'created_by' => (int) $owner->id,
                'created_at' => now(),
                'updated_at' => now(),
            ];
            if (Schema::hasColumn('assigns_students', 'submission_status')) {
                $otherMembership['submission_status'] = 'active';
            }
            $otherAssignStudentId = (int) DB::table('assigns_students')->insertGetId($otherMembership);

            $crossSchoolAssignId = null;
            if ($foreignSchoolId) {
                $crossSchoolAssignId = (int) DB::table('assigns')->insertGetId([
                    'type' => LearningActivityMap::ASSIGN_TYPE,
                    'type_id' => 0,
                    'assigned_name' => "MyWork Cross {$suffix}",
                    'assigned_path' => '/todo',
                    'school_id' => $foreignSchoolId,
                    'grade_id' => 1,
                    'subject_id' => 1,
                    'status' => 1,
                    'created_by' => (int) $owner->id,
                    'due_at' => now()->addDay(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        } catch (Throwable $e) {
            if ($createdOtherId) {
                DB::table('users')->where('id', $createdOtherId)->delete();
            }
            if ($createdForeignSchoolId) {
                DB::table('schools')->where('id', $createdForeignSchoolId)->delete();
            }

            return null;
        }

        $this->fixture = [
            'owner' => $owner,
            'other_teacher' => $otherTeacher,
            'created_other_id' => $createdOtherId,
            'student' => $student,
            'peer' => $peer,
            'outsider' => $outsider,
            'assign_id' => $assignId,
            'other_assign_id' => $otherAssignId,
            'cross_school_assign_id' => $crossSchoolAssignId,
            'created_foreign_school_id' => $createdForeignSchoolId,
            'assign_student_id' => $assignStudentId,
            'peer_assign_student_id' => $peerAssignStudentId,
            'other_assign_student_id' => $otherAssignStudentId,
            'school_id' => $schoolId,
        ];

        return $this->fixture;
    }

    private function destroyFixture(): void
    {
        if ($this->fixture === null) {
            return;
        }
        $fx = $this->fixture;
        try {
            $assignIds = array_filter([
                $fx['assign_id'] ?? null,
                $fx['other_assign_id'] ?? null,
                $fx['cross_school_assign_id'] ?? null,
            ]);
            if ($assignIds !== []) {
                DB::table('assignment_student_works')->whereIn('assign_id', $assignIds)->delete();
                if (Schema::hasTable('assignment_materials')) {
                    DB::table('assignment_materials')->whereIn('assign_id', $assignIds)->delete();
                }
                DB::table('assigns_students')->whereIn('assign_id', $assignIds)->delete();
                DB::table('assigns')->whereIn('id', $assignIds)->delete();
            }
            if (! empty($fx['created_other_id'])) {
                DB::table('users')->where('id', $fx['created_other_id'])->delete();
            }
            if (! empty($fx['created_foreign_school_id'])) {
                DB::table('schools')->where('id', $fx['created_foreign_school_id'])->delete();
            }
        } catch (Throwable $e) {
            // ignore
        }
        $this->fixture = null;
    }

    public function test_student_uploads_image(): void
    {
        $fx = $this->seedFixture();
        if ($fx === null) {
            $this->markTestSkipped('My Work fixtures unavailable.');
        }

        Storage::fake('public');
        $file = UploadedFile::fake()->image('photo.jpg', 100, 100);

        $response = $this->withHeaders($this->studentHeaders($fx['student']))
            ->post('/api/student/assigns/'.$fx['assign_id'].'/my-work', [
                'kind' => 'image',
                'file' => $file,
            ]);

        $response->assertStatus(200)->assertJsonPath('status', true);
        $data = $response->json('data');
        $this->assertSame('image', $data['kind']);
        $this->assertSame((int) $fx['assign_student_id'], (int) $data['assign_student_id']);
        $this->assertStringContainsString(
            'assignments/'.$fx['assign_id'].'/students/'.$fx['student']->id.'/work/',
            (string) AssignmentStudentWork::query()->find($data['id'])->storage_path
        );
    }

    public function test_student_uploads_document(): void
    {
        $fx = $this->seedFixture();
        if ($fx === null) {
            $this->markTestSkipped('My Work fixtures unavailable.');
        }

        Storage::fake('public');
        $file = UploadedFile::fake()->create('essay.pdf', 200, 'application/pdf');

        $response = $this->withHeaders($this->studentHeaders($fx['student']))
            ->post('/api/student/assigns/'.$fx['assign_id'].'/my-work', [
                'kind' => 'document',
                'file' => $file,
            ]);

        $response->assertStatus(200)->assertJsonPath('status', true);
        $this->assertSame('document', $response->json('data.kind'));
    }

    public function test_student_uploads_voice(): void
    {
        $fx = $this->seedFixture();
        if ($fx === null) {
            $this->markTestSkipped('My Work fixtures unavailable.');
        }

        Storage::fake('public');
        $file = UploadedFile::fake()->create('answer.mp3', 80, 'audio/mpeg');

        $response = $this->withHeaders($this->studentHeaders($fx['student']))
            ->post('/api/student/assigns/'.$fx['assign_id'].'/my-work', [
                'kind' => 'voice',
                'duration_ms' => 2200,
                'file' => $file,
            ]);

        $response->assertStatus(200)->assertJsonPath('status', true);
        $data = $response->json('data');
        $this->assertSame('voice', $data['kind']);
        $this->assertSame(2200, (int) $data['duration_ms']);
        $this->assertStringContainsString(
            '/work/voice/',
            (string) AssignmentStudentWork::query()->find($data['id'])->storage_path
        );
    }

    public function test_student_lists_own_work(): void
    {
        $fx = $this->seedFixture();
        if ($fx === null) {
            $this->markTestSkipped('My Work fixtures unavailable.');
        }

        AssignmentStudentWork::query()->create([
            'assign_id' => $fx['assign_id'],
            'assign_student_id' => $fx['assign_student_id'],
            'student_id' => $fx['student']->id,
            'kind' => 'document',
            'original_filename' => 'a.pdf',
            'storage_path' => 'assignments/'.$fx['assign_id'].'/students/'.$fx['student']->id.'/work/a.pdf',
            'sort_order' => 0,
        ]);

        $response = $this->withHeaders($this->studentHeaders($fx['student']))
            ->getJson('/api/student/assigns/'.$fx['assign_id'].'/my-work');

        $response->assertStatus(200)->assertJsonPath('status', true);
        $this->assertCount(1, $response->json('data.my_work'));
        $this->assertFalse((bool) $response->json('data.my_work_locked'));
    }

    public function test_student_sees_work_in_assignment_detail_api(): void
    {
        $fx = $this->seedFixture();
        if ($fx === null) {
            $this->markTestSkipped('My Work fixtures unavailable.');
        }

        AssignmentStudentWork::query()->create([
            'assign_id' => $fx['assign_id'],
            'assign_student_id' => $fx['assign_student_id'],
            'student_id' => $fx['student']->id,
            'kind' => 'image',
            'original_filename' => 'shot.png',
            'storage_path' => 'assignments/'.$fx['assign_id'].'/students/'.$fx['student']->id.'/work/shot.png',
            'sort_order' => 0,
        ]);

        $response = $this->withHeaders($this->studentHeaders($fx['student']))
            ->getJson('/api/student/assigns/'.$fx['assign_id'].'/learning_activities');

        $response->assertStatus(200)->assertJsonPath('status', true);
        $works = $response->json('data.my_work');
        $this->assertCount(1, $works);
        $this->assertSame('image', $works[0]['kind']);
        $this->assertArrayNotHasKey('storage_path', $works[0]);
    }

    public function test_student_deletes_own_work_while_active(): void
    {
        $fx = $this->seedFixture();
        if ($fx === null) {
            $this->markTestSkipped('My Work fixtures unavailable.');
        }

        Storage::fake('public');
        $path = 'assignments/'.$fx['assign_id'].'/students/'.$fx['student']->id.'/work/del.pdf';
        Storage::disk('public')->put($path, 'x');

        $row = AssignmentStudentWork::query()->create([
            'assign_id' => $fx['assign_id'],
            'assign_student_id' => $fx['assign_student_id'],
            'student_id' => $fx['student']->id,
            'kind' => 'document',
            'original_filename' => 'del.pdf',
            'storage_path' => $path,
            'sort_order' => 0,
        ]);

        $response = $this->withHeaders($this->studentHeaders($fx['student']))
            ->deleteJson('/api/student/assigns/'.$fx['assign_id'].'/my-work/'.$row->id);

        $response->assertStatus(201)->assertJsonPath('status', true);
        $this->assertNull(AssignmentStudentWork::query()->find($row->id));
        Storage::disk('public')->assertMissing($path);
    }

    public function test_student_cannot_access_another_students_work(): void
    {
        $fx = $this->seedFixture();
        if ($fx === null) {
            $this->markTestSkipped('My Work fixtures unavailable.');
        }

        $row = AssignmentStudentWork::query()->create([
            'assign_id' => $fx['assign_id'],
            'assign_student_id' => $fx['assign_student_id'],
            'student_id' => $fx['student']->id,
            'kind' => 'document',
            'original_filename' => 'private.pdf',
            'storage_path' => 'assignments/'.$fx['assign_id'].'/students/'.$fx['student']->id.'/work/private.pdf',
            'sort_order' => 0,
        ]);

        $response = $this->withHeaders($this->studentHeaders($fx['peer']))
            ->deleteJson('/api/student/assigns/'.$fx['assign_id'].'/my-work/'.$row->id);

        $this->assertFalse((bool) $response->json('status'));
        $this->assertNotNull(AssignmentStudentWork::query()->find($row->id));

        $download = $this->withHeaders($this->studentHeaders($fx['peer']))
            ->get('/api/student/assigns/'.$fx['assign_id'].'/my-work/'.$row->id.'/file');
        $this->assertContains($download->status(), [400, 403, 404]);
    }

    public function test_student_cannot_access_another_assignments_work(): void
    {
        $fx = $this->seedFixture();
        if ($fx === null) {
            $this->markTestSkipped('My Work fixtures unavailable.');
        }

        $row = AssignmentStudentWork::query()->create([
            'assign_id' => $fx['other_assign_id'],
            'assign_student_id' => $fx['other_assign_student_id'],
            'student_id' => $fx['student']->id,
            'kind' => 'document',
            'original_filename' => 'other.pdf',
            'storage_path' => 'assignments/'.$fx['other_assign_id'].'/students/'.$fx['student']->id.'/work/other.pdf',
            'sort_order' => 0,
        ]);

        $response = $this->withHeaders($this->studentHeaders($fx['student']))
            ->deleteJson('/api/student/assigns/'.$fx['assign_id'].'/my-work/'.$row->id);

        $this->assertFalse((bool) $response->json('status'));
        $this->assertNotNull(AssignmentStudentWork::query()->find($row->id));
    }

    public function test_cross_school_teacher_access_denied_for_my_work_review(): void
    {
        $fx = $this->seedFixture();
        if ($fx === null || empty($fx['cross_school_assign_id'])) {
            $this->markTestSkipped('Cross-school fixture unavailable.');
        }

        $response = $this->withHeaders($this->teacherHeaders($fx['owner']))
            ->getJson('/api/assigns/'.$fx['cross_school_assign_id'].'/learning_activities/review');

        $this->assertSame(403, $response->status());
    }

    public function test_submitted_locks_upload_and_delete(): void
    {
        $fx = $this->seedFixture();
        if ($fx === null || ! Schema::hasColumn('assigns_students', 'submission_status')) {
            $this->markTestSkipped('Parent submission columns unavailable.');
        }

        Storage::fake('public');
        $path = 'assignments/'.$fx['assign_id'].'/students/'.$fx['student']->id.'/work/locked.pdf';
        Storage::disk('public')->put($path, 'x');
        $row = AssignmentStudentWork::query()->create([
            'assign_id' => $fx['assign_id'],
            'assign_student_id' => $fx['assign_student_id'],
            'student_id' => $fx['student']->id,
            'kind' => 'document',
            'original_filename' => 'locked.pdf',
            'storage_path' => $path,
            'sort_order' => 0,
        ]);

        DB::table('assigns_students')->where('id', $fx['assign_student_id'])->update([
            'submission_status' => 'submitted',
            'submitted_at' => now(),
            'updated_at' => now(),
        ]);

        $upload = $this->withHeaders($this->studentHeaders($fx['student']))
            ->post('/api/student/assigns/'.$fx['assign_id'].'/my-work', [
                'kind' => 'document',
                'file' => UploadedFile::fake()->create('new.pdf', 10, 'application/pdf'),
            ]);
        $this->assertSame(409, $upload->status());

        $delete = $this->withHeaders($this->studentHeaders($fx['student']))
            ->deleteJson('/api/student/assigns/'.$fx['assign_id'].'/my-work/'.$row->id);
        $this->assertSame(409, $delete->status());
        $this->assertNotNull(AssignmentStudentWork::query()->find($row->id));
    }

    public function test_graded_locks_upload_and_delete(): void
    {
        $fx = $this->seedFixture();
        if ($fx === null || ! Schema::hasColumn('assigns_students', 'submission_status')) {
            $this->markTestSkipped('Parent submission columns unavailable.');
        }

        $row = AssignmentStudentWork::query()->create([
            'assign_id' => $fx['assign_id'],
            'assign_student_id' => $fx['assign_student_id'],
            'student_id' => $fx['student']->id,
            'kind' => 'document',
            'original_filename' => 'g.pdf',
            'storage_path' => 'assignments/'.$fx['assign_id'].'/students/'.$fx['student']->id.'/work/g.pdf',
            'sort_order' => 0,
        ]);

        DB::table('assigns_students')->where('id', $fx['assign_student_id'])->update([
            'submission_status' => 'graded',
            'graded_at' => now(),
            'updated_at' => now(),
        ]);

        $delete = $this->withHeaders($this->studentHeaders($fx['student']))
            ->deleteJson('/api/student/assigns/'.$fx['assign_id'].'/my-work/'.$row->id);
        $this->assertSame(409, $delete->status());
    }

    public function test_teacher_authorized_review_sees_my_work(): void
    {
        $fx = $this->seedFixture();
        if ($fx === null) {
            $this->markTestSkipped('My Work fixtures unavailable.');
        }

        AssignmentStudentWork::query()->create([
            'assign_id' => $fx['assign_id'],
            'assign_student_id' => $fx['assign_student_id'],
            'student_id' => $fx['student']->id,
            'kind' => 'image',
            'original_filename' => 'review.jpg',
            'storage_path' => 'assignments/'.$fx['assign_id'].'/students/'.$fx['student']->id.'/work/review.jpg',
            'mime_type' => 'image/jpeg',
            'size_bytes' => 12,
            'sort_order' => 0,
        ]);

        $response = $this->withHeaders($this->teacherHeaders($fx['owner']))
            ->getJson('/api/assigns/'.$fx['assign_id'].'/learning_activities/review');

        $response->assertStatus(200)->assertJsonPath('status', true);
        $students = $response->json('data.students');
        $this->assertIsArray($students);
        $match = collect($students)->firstWhere('student_id', (int) $fx['student']->id);
        $this->assertNotNull($match);
        $this->assertCount(1, $match['my_work']);
        $this->assertSame('image', $match['my_work'][0]['kind']);
        $this->assertArrayHasKey('url', $match['my_work'][0]);
        $this->assertArrayNotHasKey('storage_path', $match['my_work'][0]);
    }

    public function test_unauthorized_teacher_cannot_see_my_work(): void
    {
        $fx = $this->seedFixture();
        if ($fx === null) {
            $this->markTestSkipped('My Work fixtures unavailable.');
        }

        AssignmentStudentWork::query()->create([
            'assign_id' => $fx['assign_id'],
            'assign_student_id' => $fx['assign_student_id'],
            'student_id' => $fx['student']->id,
            'kind' => 'document',
            'original_filename' => 'secret.pdf',
            'storage_path' => 'assignments/'.$fx['assign_id'].'/students/'.$fx['student']->id.'/work/secret.pdf',
            'sort_order' => 0,
        ]);

        $response = $this->withHeaders($this->teacherHeaders($fx['other_teacher']))
            ->getJson('/api/assigns/'.$fx['assign_id'].'/learning_activities/review');

        $this->assertContains($response->status(), [403, 400]);
        $this->assertFalse((bool) $response->json('status'));
    }

    public function test_multiple_work_items_supported(): void
    {
        $fx = $this->seedFixture();
        if ($fx === null) {
            $this->markTestSkipped('My Work fixtures unavailable.');
        }

        Storage::fake('public');
        $headers = $this->studentHeaders($fx['student']);

        $this->withHeaders($headers)->post('/api/student/assigns/'.$fx['assign_id'].'/my-work', [
            'kind' => 'image',
            'file' => UploadedFile::fake()->image('one.jpg'),
        ])->assertStatus(200);

        $this->withHeaders($headers)->post('/api/student/assigns/'.$fx['assign_id'].'/my-work', [
            'kind' => 'document',
            'file' => UploadedFile::fake()->create('two.pdf', 20, 'application/pdf'),
        ])->assertStatus(200);

        $list = $this->withHeaders($headers)
            ->getJson('/api/student/assigns/'.$fx['assign_id'].'/my-work');
        $list->assertStatus(200);
        $this->assertCount(2, $list->json('data.my_work'));
    }

    public function test_materials_behavior_unchanged_alongside_my_work(): void
    {
        $fx = $this->seedFixture();
        if ($fx === null || ! Schema::hasTable('assignment_materials')) {
            $this->markTestSkipped('Materials table unavailable.');
        }

        AssignmentMaterial::query()->create([
            'assign_id' => $fx['assign_id'],
            'kind' => 'link',
            'label' => 'Still materials',
            'external_url' => 'https://example.com/mat',
            'sort_order' => 0,
            'created_by' => (int) $fx['owner']->id,
        ]);

        AssignmentStudentWork::query()->create([
            'assign_id' => $fx['assign_id'],
            'assign_student_id' => $fx['assign_student_id'],
            'student_id' => $fx['student']->id,
            'kind' => 'document',
            'original_filename' => 'mine.pdf',
            'storage_path' => 'assignments/'.$fx['assign_id'].'/students/'.$fx['student']->id.'/work/mine.pdf',
            'sort_order' => 0,
        ]);

        $response = $this->withHeaders($this->studentHeaders($fx['student']))
            ->getJson('/api/student/assigns/'.$fx['assign_id'].'/learning_activities');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data.materials'));
        $this->assertSame('link', $response->json('data.materials.0.kind'));
        $this->assertCount(1, $response->json('data.my_work'));
        $this->assertSame('document', $response->json('data.my_work.0.kind'));
    }

    public function test_outsider_cannot_list_my_work(): void
    {
        $fx = $this->seedFixture();
        if ($fx === null || empty($fx['outsider'])) {
            $this->markTestSkipped('Outsider fixture unavailable.');
        }

        $response = $this->withHeaders($this->studentHeaders($fx['outsider']))
            ->getJson('/api/student/assigns/'.$fx['assign_id'].'/my-work');

        $this->assertContains($response->status(), [400, 403, 404]);
        $this->assertFalse((bool) $response->json('status'));
    }
}
