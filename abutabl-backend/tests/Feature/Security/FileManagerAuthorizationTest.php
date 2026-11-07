<?php

namespace Tests\Feature\Security;

use App\Http\Controllers\Api\AdminControllers\FileManagerController;
use App\Models\FileManagement;
use App\Models\Schools;
use App\Models\SchoolsRoles;
use App\Models\TeachersGrades;
use App\Models\User;
use App\Support\Ownership\OwnershipGate;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * ABUTABL-SECURITY-FIX-001 — File Manager school + ownership isolation.
 * sqlite :memory: only; no migrate against onesave/prod.
 */
class FileManagerAuthorizationTest extends TestCase
{
    /** @var string|null */
    private $previousDefault;

    protected function setUp(): void
    {
        parent::setUp();
        $this->previousDefault = config('database.default');
        config([
            'database.connections.file_manager_auth_test' => [
                'driver' => 'sqlite',
                'database' => ':memory:',
                'prefix' => '',
                'foreign_key_constraints' => false,
            ],
            'database.default' => 'file_manager_auth_test',
        ]);
        DB::purge('file_manager_auth_test');
        DB::reconnect('file_manager_auth_test');
        $this->createSchema();
        Storage::fake('public');
    }

    protected function tearDown(): void
    {
        config(['database.default' => $this->previousDefault]);
        DB::purge('file_manager_auth_test');
        parent::tearDown();
    }

    public function test_teacher_lists_only_own_files_in_authorized_schools(): void
    {
        $this->seedSchools([5, 9]);
        $teacherA = $this->actingTeacher(101, 5);
        $teacherB = User::create(['id' => 102, 'type' => 'teacher', 'name' => 'TB', 'school_id' => 5]);
        SchoolsRoles::create(['user_id' => 102, 'school_id' => 5, 'role_id' => 1, 'status' => 1]);

        $own = $this->insertFile('A-own', 5, 101);
        $peer = $this->insertFile('B-peer', 5, 102);
        $otherSchool = $this->insertFile('other-school', 9, 101);

        $payload = $this->controller()->index(Request::create('/api/file_maanger/list', 'GET'))->getData(true);

        $this->assertTrue($payload['status']);
        $ids = collect($payload['files'])->pluck('id')->all();
        $this->assertContains($own->id, $ids);
        $this->assertNotContains($peer->id, $ids);
        $this->assertNotContains($otherSchool->id, $ids);
        $this->assertSame($teacherA->id, auth()->id());
    }

    public function test_teacher_cannot_download_peer_or_other_school_file_by_id(): void
    {
        $this->seedSchools([5, 9]);
        $this->actingTeacher(101, 5);
        $peer = $this->insertFile('peer', 5, 202);
        $foreign = $this->insertFile('foreign', 9, 101);
        $this->putStorageFile($peer);
        $this->putStorageFile($foreign);

        $peerRes = $this->controller()->download($peer->id);
        $this->assertSame(403, $peerRes->getStatusCode());
        $this->assertSame('E403', $peerRes->getData(true)['errNum']);

        $foreignRes = $this->controller()->download($foreign->id);
        $this->assertSame(403, $foreignRes->getStatusCode());

        $missing = $this->controller()->download(999999);
        $this->assertSame(400, $missing->getStatusCode());
        $this->assertSame('E001', $missing->getData(true)['errNum']);
    }

    public function test_teacher_can_download_own_authorized_file(): void
    {
        $this->seedSchools([5]);
        $this->actingTeacher(101, 5);
        $own = $this->insertFile('mine', 5, 101);
        $this->putStorageFile($own);

        $response = $this->controller()->download($own->id);
        $this->assertSame(200, $response->getStatusCode());
    }

    public function test_teacher_cannot_delete_peer_file_by_id(): void
    {
        $this->seedSchools([5]);
        $this->actingTeacher(101, 5);
        $peer = $this->insertFile('peer-del', 5, 202);

        $response = $this->controller()->destroy($peer->id, Request::create('/api/file_maanger/delete/'.$peer->id, 'DELETE'));
        $this->assertSame(403, $response->getStatusCode());
        $this->assertDatabaseHas('file_management', ['id' => $peer->id]);
    }

    public function test_teacher_can_delete_own_file(): void
    {
        $this->seedSchools([5]);
        $this->actingTeacher(101, 5);
        $own = $this->insertFile('own-del', 5, 101);

        $response = $this->controller()->destroy($own->id, Request::create('/api/file_maanger/delete/'.$own->id, 'DELETE'));
        $this->assertSame(200, $response->getStatusCode());
        $this->assertDatabaseMissing('file_management', ['id' => $own->id]);
    }

    public function test_teacher_cannot_forge_upload_school_id(): void
    {
        $this->seedSchools([5, 9]);
        $this->actingTeacher(101, 5);

        $upload = UploadedFile::fake()->create('notes.pdf', 20, 'application/pdf');
        $request = Request::create('/api/file_maanger/store', 'POST', [
            'school_id' => 9,
            'created_by' => 999,
        ], [], ['files' => [$upload]]);

        $response = $this->controller()->store($request);
        $this->assertSame(403, $response->getStatusCode());
        $this->assertSame(0, FileManagement::count());
    }

    public function test_teacher_upload_sets_auth_created_by_not_client_value(): void
    {
        $this->seedSchools([5]);
        $this->actingTeacher(101, 5);

        $upload = UploadedFile::fake()->create('notes.pdf', 20, 'application/pdf');
        $request = Request::create('/api/file_maanger/store', 'POST', [
            'school_id' => 5,
            'created_by' => 999,
        ], [], ['files' => [$upload]]);

        $response = $this->controller()->store($request);
        $this->assertSame(200, $response->getStatusCode());
        $row = FileManagement::query()->first();
        $this->assertNotNull($row);
        $this->assertSame(101, (int) $row->created_by);
        $this->assertSame(5, (int) $row->school_id);
    }

    public function test_admin_lists_files_across_schools_but_respects_school_filter_authorization(): void
    {
        $this->seedSchools([5, 9]);
        $this->actingAdmin(1);
        $a = $this->insertFile('s5', 5, 101);
        $b = $this->insertFile('s9', 9, 202);

        $all = $this->controller()->index(Request::create('/api/file_maanger/list', 'GET'))->getData(true);
        $ids = collect($all['files'])->pluck('id')->all();
        $this->assertContains($a->id, $ids);
        $this->assertContains($b->id, $ids);

        $filtered = $this->controller()->index(Request::create('/api/file_maanger/list?school_id=5', 'GET'))->getData(true);
        $filteredIds = collect($filtered['files'])->pluck('id')->all();
        $this->assertContains($a->id, $filteredIds);
        $this->assertNotContains($b->id, $filteredIds);
    }

    public function test_admin_can_download_teacher_uploaded_file_in_authorized_school(): void
    {
        // Existing Admin visibility = SchoolsIDs() (all schools). No privacy column exists;
        // school-scoped admin access matches AssignsController admin bypass of created_by.
        $this->seedSchools([5]);
        $this->actingAdmin(1);
        $teacherFile = $this->insertFile('teacher-file', 5, 101);
        $this->putStorageFile($teacherFile);

        $response = $this->controller()->download($teacherFile->id);
        $this->assertSame(200, $response->getStatusCode());
    }

    public function test_teacher_list_rejects_unauthorized_school_id_filter(): void
    {
        $this->seedSchools([5, 9]);
        $this->actingTeacher(101, 5);

        $response = $this->controller()->index(Request::create('/api/file_maanger/list?school_id=9', 'GET'));
        $this->assertSame(403, $response->getStatusCode());
    }

    public function test_spatie_view_middleware_still_registered_on_index_and_download(): void
    {
        $src = file_get_contents(app_path('Http/Controllers/Api/AdminControllers/FileManagerController.php'));
        $this->assertStringContainsString('can:view-file_managers', $src);
        $this->assertStringContainsString("'index', 'show', 'download'", $src);
        $this->assertStringContainsString('can:delete-file_managers', $src);
        $this->assertStringContainsString('OwnershipGate::isAdminUser', $src);
        $this->assertStringContainsString('SchoolsIDs', $src);
        $this->assertTrue(OwnershipGate::isAdminUser((object) ['type' => 'admin']));
        $this->assertTrue(OwnershipGate::isTeacherUser((object) ['type' => 'teacher']));
    }

    public function test_scorm_extract_path_strings_unchanged_in_store(): void
    {
        $src = file_get_contents(app_path('Http/Controllers/Api/AdminControllers/FileManagerController.php'));
        $this->assertStringContainsString("extractTo('scrom/files_maanger/", $src);
        $this->assertStringContainsString("str_starts_with((string) \$relative, 'scrom/')", $src);
    }

    private function controller(): FileManagerController
    {
        return $this->app->make(FileManagerController::class);
    }

    private function actingTeacher(int $id, int $schoolId): User
    {
        $teacher = User::create([
            'id' => $id,
            'type' => 'teacher',
            'name' => 'Teacher '.$id,
            'school_id' => $schoolId,
        ]);
        SchoolsRoles::create([
            'user_id' => $id,
            'school_id' => $schoolId,
            'role_id' => 1,
            'status' => 1,
        ]);
        TeachersGrades::create([
            'user_id' => $id,
            'school_id' => $schoolId,
            'status' => 1,
        ]);
        $this->app['auth']->shouldUse('admin-api');
        $this->app['auth']->guard('admin-api')->setUser($teacher);

        return $teacher;
    }

    private function actingAdmin(int $id): User
    {
        $admin = User::create([
            'id' => $id,
            'type' => 'admin',
            'name' => 'Admin '.$id,
            'school_id' => null,
        ]);
        $this->app['auth']->shouldUse('admin-api');
        $this->app['auth']->guard('admin-api')->setUser($admin);

        return $admin;
    }

    /**
     * @param int[] $ids
     */
    private function seedSchools(array $ids): void
    {
        foreach ($ids as $id) {
            Schools::create([
                'id' => $id,
                'name' => 'School '.$id,
                'status' => '1',
            ]);
        }
    }

    private function insertFile(string $name, int $schoolId, int $createdBy): FileManagement
    {
        return FileManagement::create([
            'name' => $name,
            'hashName' => $name.'.bin',
            'type' => 'pdf',
            'size' => '10',
            'path' => 'files_maanger/'.$name.'.pdf',
            'school_id' => $schoolId,
            'created_by' => $createdBy,
        ]);
    }

    private function putStorageFile(FileManagement $file): void
    {
        $relative = $file->getRawOriginal('path') ?? $file->getAttributes()['path'];
        $absolute = storage_path('app/public/'.$relative);
        $dir = dirname($absolute);
        if (! is_dir($dir)) {
            mkdir($dir, 0777, true);
        }
        file_put_contents($absolute, 'fixture');
    }

    private function createSchema(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->primary();
            $table->string('type')->nullable();
            $table->string('name')->nullable();
            $table->unsignedBigInteger('school_id')->nullable();
            $table->timestamps();
        });
        Schema::create('schools', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->primary();
            $table->string('name')->nullable();
            $table->string('status')->nullable();
            $table->timestamps();
        });
        Schema::create('schools_roles', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('school_id');
            $table->unsignedBigInteger('role_id')->nullable();
            $table->unsignedTinyInteger('status')->default(1);
            $table->timestamps();
        });
        Schema::create('teachers_grades', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('school_id')->nullable();
            $table->unsignedBigInteger('grade_id')->nullable();
            $table->unsignedBigInteger('class_id')->nullable();
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->unsignedTinyInteger('status')->default(1);
            $table->timestamps();
        });
        Schema::create('file_management', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->string('hashName')->nullable();
            $table->string('type')->nullable();
            $table->string('size')->nullable();
            $table->string('path')->nullable();
            $table->unsignedBigInteger('school_id')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();
        });
    }
}
