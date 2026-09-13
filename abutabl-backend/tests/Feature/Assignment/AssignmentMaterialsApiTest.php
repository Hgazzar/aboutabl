<?php

namespace Tests\Feature\Assignment;

use App\Models\AssignmentMaterial;
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
 * Phase 2 — Assignment Materials teacher CRUD + student read.
 */
class AssignmentMaterialsApiTest extends TestCase
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
            || ! Schema::hasTable('assignment_materials')
            || ! Schema::hasTable('students')
            || ! Schema::hasTable('users')
        ) {
            return null;
        }

        $owner = User::query()->where('id', 179)->first()
            ?? User::query()->where('type', '!=', 'admin')->orderBy('id')->first();
        $student = Student::query()->orderBy('id')->first();
        $outsider = Student::query()->where('id', '!=', $student?->id)->orderBy('id')->first();
        if (! $owner || ! $student || ! $outsider) {
            return null;
        }

        $other = User::query()
            ->where('type', '!=', 'admin')
            ->where('id', '!=', $owner->id)
            ->orderBy('id')
            ->first();

        $createdOtherId = null;
        if (! $other) {
            try {
                $suffix = substr((string) microtime(true), -6);
                $createdOtherId = (int) DB::table('users')->insertGetId([
                    'name' => 'Materials Other Teacher',
                    'username' => 'mat_other_'.$suffix,
                    'email' => 'mat-other-'.$suffix.'@test.local',
                    'phone' => '0188'.$suffix,
                    'password' => bcrypt('secret'),
                    'type' => 'teacher',
                    'status' => '1',
                    'verify' => '1',
                    'school_id' => (int) ($owner->school_id ?? 1),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $other = User::query()->find($createdOtherId);
            } catch (Throwable $e) {
                return null;
            }
        }

        $schoolId = (int) ($owner->school_id ?? 1);
        $foreignSchoolId = null;
        $createdForeignSchoolId = null;
        $suffix = 'mt'.substr((string) microtime(true), -6);
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
                        'name' => 'Materials Foreign School '.$suffix,
                        'name_ar' => 'Materials Foreign School '.$suffix,
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
                'assigned_name' => "Materials Assign {$suffix}",
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
                'assigned_name' => "Materials Other Assign {$suffix}",
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

            $assignStudentPayload = [
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
                $assignStudentPayload['submission_status'] = 'active';
            }

            $assignStudentId = (int) DB::table('assigns_students')->insertGetId($assignStudentPayload);

            $crossSchoolAssignId = null;
            if ($foreignSchoolId) {
                $crossSchoolAssignId = (int) DB::table('assigns')->insertGetId([
                    'type' => LearningActivityMap::ASSIGN_TYPE,
                    'type_id' => 0,
                    'assigned_name' => "Materials Cross School {$suffix}",
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

            return null;
        }

        $this->fixture = [
            'owner' => $owner,
            'other' => $other,
            'created_other_id' => $createdOtherId,
            'student' => $student,
            'outsider' => $outsider,
            'assign_id' => $assignId,
            'other_assign_id' => $otherAssignId,
            'cross_school_assign_id' => $crossSchoolAssignId,
            'created_foreign_school_id' => $createdForeignSchoolId,
            'assign_student_id' => $assignStudentId,
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
                DB::table('assignment_materials')->whereIn('assign_id', $assignIds)->delete();
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

    public function test_teacher_creates_file_material(): void
    {
        $fx = $this->seedFixture();
        if ($fx === null) {
            $this->markTestSkipped('Materials fixtures unavailable.');
        }

        Storage::fake('public');
        $file = UploadedFile::fake()->create('notes.pdf', 120, 'application/pdf');

        $response = $this->withHeaders($this->teacherHeaders($fx['owner']))
            ->post('/api/assigns/'.$fx['assign_id'].'/materials', [
                'kind' => 'file',
                'label' => 'Reading notes',
                'file' => $file,
            ]);

        $response->assertStatus(200)->assertJsonPath('status', true);
        $data = $response->json('data');
        $this->assertSame('file', $data['kind']);
        $this->assertSame('Reading notes', $data['label']);
        $this->assertSame('notes.pdf', $data['original_filename']);
        $this->assertNotEmpty($data['url']);
        $this->assertStringContainsString(
            'assignments/'.$fx['assign_id'].'/materials/',
            (string) AssignmentMaterial::query()->find($data['id'])->storage_path
        );
    }

    public function test_teacher_creates_voice_material(): void
    {
        $fx = $this->seedFixture();
        if ($fx === null) {
            $this->markTestSkipped('Materials fixtures unavailable.');
        }

        Storage::fake('public');
        $file = UploadedFile::fake()->create('intro.mp3', 80, 'audio/mpeg');

        $response = $this->withHeaders($this->teacherHeaders($fx['owner']))
            ->post('/api/assigns/'.$fx['assign_id'].'/materials', [
                'kind' => 'voice',
                'label' => 'Teacher intro',
                'duration_ms' => 1500,
                'file' => $file,
            ]);

        $response->assertStatus(200)->assertJsonPath('status', true);
        $data = $response->json('data');
        $this->assertSame('voice', $data['kind']);
        $this->assertSame(1500, (int) $data['duration_ms']);
        $this->assertStringContainsString(
            'assignments/'.$fx['assign_id'].'/materials/voice/',
            (string) AssignmentMaterial::query()->find($data['id'])->storage_path
        );
    }

    public function test_teacher_creates_link_material(): void
    {
        $fx = $this->seedFixture();
        if ($fx === null) {
            $this->markTestSkipped('Materials fixtures unavailable.');
        }

        $response = $this->withHeaders($this->teacherHeaders($fx['owner']))
            ->postJson('/api/assigns/'.$fx['assign_id'].'/materials', [
                'kind' => 'link',
                'label' => 'Reference',
                'url' => 'https://example.com/resource',
            ]);

        $response->assertStatus(200)->assertJsonPath('status', true);
        $data = $response->json('data');
        $this->assertSame('link', $data['kind']);
        $this->assertSame('https://example.com/resource', $data['url']);
        $this->assertNull(AssignmentMaterial::query()->find($data['id'])->storage_path);
        $this->assertSame(
            'https://example.com/resource',
            AssignmentMaterial::query()->find($data['id'])->external_url
        );
    }

    public function test_teacher_lists_materials(): void
    {
        $fx = $this->seedFixture();
        if ($fx === null) {
            $this->markTestSkipped('Materials fixtures unavailable.');
        }

        AssignmentMaterial::query()->create([
            'assign_id' => $fx['assign_id'],
            'kind' => 'link',
            'label' => 'A',
            'external_url' => 'https://example.com/a',
            'sort_order' => 0,
            'created_by' => (int) $fx['owner']->id,
        ]);
        AssignmentMaterial::query()->create([
            'assign_id' => $fx['assign_id'],
            'kind' => 'link',
            'label' => 'B',
            'external_url' => 'https://example.com/b',
            'sort_order' => 1,
            'created_by' => (int) $fx['owner']->id,
        ]);

        $response = $this->withHeaders($this->teacherHeaders($fx['owner']))
            ->getJson('/api/assigns/'.$fx['assign_id'].'/materials');

        $response->assertStatus(200)->assertJsonPath('status', true);
        $materials = $response->json('data.materials');
        $this->assertCount(2, $materials);
        $this->assertFalse((bool) $response->json('data.materials_locked'));
        $this->assertSame('A', $materials[0]['label']);
        $this->assertSame('B', $materials[1]['label']);
    }

    public function test_teacher_deletes_own_material(): void
    {
        $fx = $this->seedFixture();
        if ($fx === null) {
            $this->markTestSkipped('Materials fixtures unavailable.');
        }

        Storage::fake('public');
        $path = 'assignments/'.$fx['assign_id'].'/materials/test-file.txt';
        Storage::disk('public')->put($path, 'hello');

        $row = AssignmentMaterial::query()->create([
            'assign_id' => $fx['assign_id'],
            'kind' => 'file',
            'label' => 'Delete me',
            'original_filename' => 'test-file.txt',
            'storage_path' => $path,
            'mime_type' => 'text/plain',
            'size_bytes' => 5,
            'sort_order' => 0,
            'created_by' => (int) $fx['owner']->id,
        ]);

        $response = $this->withHeaders($this->teacherHeaders($fx['owner']))
            ->deleteJson('/api/assigns/'.$fx['assign_id'].'/materials/'.$row->id);

        $response->assertStatus(201)->assertJsonPath('status', true);
        $this->assertNull(AssignmentMaterial::query()->find($row->id));
        Storage::disk('public')->assertMissing($path);
    }

    public function test_unauthorized_teacher_cannot_manage_another_teachers_assignment(): void
    {
        $fx = $this->seedFixture();
        if ($fx === null) {
            $this->markTestSkipped('Materials fixtures unavailable.');
        }

        $response = $this->withHeaders($this->teacherHeaders($fx['other']))
            ->postJson('/api/assigns/'.$fx['assign_id'].'/materials', [
                'kind' => 'link',
                'url' => 'https://example.com/nope',
            ]);

        $this->assertContains($response->status(), [403, 400]);
        $this->assertFalse((bool) $response->json('status'));
        $this->assertSame(0, AssignmentMaterial::query()->where('assign_id', $fx['assign_id'])->count());
    }

    public function test_assigned_student_can_read_materials(): void
    {
        $fx = $this->seedFixture();
        if ($fx === null) {
            $this->markTestSkipped('Materials fixtures unavailable.');
        }

        AssignmentMaterial::query()->create([
            'assign_id' => $fx['assign_id'],
            'kind' => 'link',
            'label' => 'Student visible',
            'external_url' => 'https://example.com/student',
            'sort_order' => 0,
            'created_by' => (int) $fx['owner']->id,
        ]);

        $response = $this->withHeaders($this->studentHeaders($fx['student']))
            ->getJson('/api/student/assigns/'.$fx['assign_id'].'/learning_activities');

        $response->assertStatus(200)->assertJsonPath('status', true);
        $materials = $response->json('data.materials');
        $this->assertIsArray($materials);
        $this->assertCount(1, $materials);
        $this->assertSame('link', $materials[0]['kind']);
        $this->assertSame('https://example.com/student', $materials[0]['url']);
    }

    public function test_student_not_assigned_cannot_read_materials(): void
    {
        $fx = $this->seedFixture();
        if ($fx === null) {
            $this->markTestSkipped('Materials fixtures unavailable.');
        }

        AssignmentMaterial::query()->create([
            'assign_id' => $fx['assign_id'],
            'kind' => 'link',
            'label' => 'Hidden',
            'external_url' => 'https://example.com/hidden',
            'sort_order' => 0,
            'created_by' => (int) $fx['owner']->id,
        ]);

        $response = $this->withHeaders($this->studentHeaders($fx['outsider']))
            ->getJson('/api/student/assigns/'.$fx['assign_id'].'/learning_activities');

        $this->assertContains($response->status(), [200, 400, 403, 404]);
        if ($response->status() === 200 && (bool) $response->json('status') === true) {
            $this->fail('Outsider must not receive assignment detail with materials.');
        }
    }

    public function test_cross_school_access_is_denied(): void
    {
        $fx = $this->seedFixture();
        if ($fx === null || empty($fx['cross_school_assign_id'])) {
            $this->markTestSkipped('Cross-school fixture unavailable.');
        }

        $response = $this->withHeaders($this->teacherHeaders($fx['owner']))
            ->postJson('/api/assigns/'.$fx['cross_school_assign_id'].'/materials', [
                'kind' => 'link',
                'url' => 'https://example.com/cross',
            ]);

        $this->assertSame(403, $response->status());
        $this->assertFalse((bool) $response->json('status'));
        $this->assertSame(
            0,
            AssignmentMaterial::query()->where('assign_id', $fx['cross_school_assign_id'])->count()
        );
    }

    public function test_material_from_another_assignment_cannot_be_deleted_via_requested_assign(): void
    {
        $fx = $this->seedFixture();
        if ($fx === null) {
            $this->markTestSkipped('Materials fixtures unavailable.');
        }

        $row = AssignmentMaterial::query()->create([
            'assign_id' => $fx['other_assign_id'],
            'kind' => 'link',
            'label' => 'Other assign material',
            'external_url' => 'https://example.com/other',
            'sort_order' => 0,
            'created_by' => (int) $fx['owner']->id,
        ]);

        $response = $this->withHeaders($this->teacherHeaders($fx['owner']))
            ->deleteJson('/api/assigns/'.$fx['assign_id'].'/materials/'.$row->id);

        $this->assertFalse((bool) $response->json('status'));
        $this->assertNotNull(AssignmentMaterial::query()->find($row->id));
    }

    public function test_submitted_lifecycle_locks_teacher_mutation(): void
    {
        $fx = $this->seedFixture();
        if ($fx === null || ! Schema::hasColumn('assigns_students', 'submission_status')) {
            $this->markTestSkipped('Parent submission columns unavailable.');
        }

        DB::table('assigns_students')->where('id', $fx['assign_student_id'])->update([
            'submission_status' => 'submitted',
            'submitted_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->withHeaders($this->teacherHeaders($fx['owner']))
            ->postJson('/api/assigns/'.$fx['assign_id'].'/materials', [
                'kind' => 'link',
                'url' => 'https://example.com/locked',
            ]);

        $this->assertSame(409, $response->status());
        $this->assertSame('E409', $response->json('errNum'));
        $this->assertSame(0, AssignmentMaterial::query()->where('assign_id', $fx['assign_id'])->count());
    }

    public function test_graded_lifecycle_locks_teacher_mutation(): void
    {
        $fx = $this->seedFixture();
        if ($fx === null || ! Schema::hasColumn('assigns_students', 'submission_status')) {
            $this->markTestSkipped('Parent submission columns unavailable.');
        }

        DB::table('assigns_students')->where('id', $fx['assign_student_id'])->update([
            'submission_status' => 'graded',
            'graded_at' => now(),
            'updated_at' => now(),
        ]);

        $row = AssignmentMaterial::query()->create([
            'assign_id' => $fx['assign_id'],
            'kind' => 'link',
            'label' => 'Existing',
            'external_url' => 'https://example.com/existing',
            'sort_order' => 0,
            'created_by' => (int) $fx['owner']->id,
        ]);

        $response = $this->withHeaders($this->teacherHeaders($fx['owner']))
            ->deleteJson('/api/assigns/'.$fx['assign_id'].'/materials/'.$row->id);

        $this->assertSame(409, $response->status());
        $this->assertNotNull(AssignmentMaterial::query()->find($row->id));
    }

    public function test_student_can_still_read_materials_after_submission(): void
    {
        $fx = $this->seedFixture();
        if ($fx === null || ! Schema::hasColumn('assigns_students', 'submission_status')) {
            $this->markTestSkipped('Parent submission columns unavailable.');
        }

        AssignmentMaterial::query()->create([
            'assign_id' => $fx['assign_id'],
            'kind' => 'link',
            'label' => 'Still visible',
            'external_url' => 'https://example.com/visible',
            'sort_order' => 0,
            'created_by' => (int) $fx['owner']->id,
        ]);

        DB::table('assigns_students')->where('id', $fx['assign_student_id'])->update([
            'submission_status' => 'submitted',
            'submitted_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->withHeaders($this->studentHeaders($fx['student']))
            ->getJson('/api/student/assigns/'.$fx['assign_id'].'/learning_activities');

        $response->assertStatus(200)->assertJsonPath('status', true);
        $this->assertCount(1, $response->json('data.materials'));
    }
}
