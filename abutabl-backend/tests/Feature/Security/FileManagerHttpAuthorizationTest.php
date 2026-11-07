<?php

namespace Tests\Feature\Security;

use App\Models\FileManagement;
use App\Models\Schools;
use App\Models\SchoolsRoles;
use App\Models\TeachersGrades;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;
use Throwable;

/**
 * ABUTABL-SECURITY-FIX-002 — HTTP integration for File Manager authorization.
 *
 * Exercises real routes + checkSecretApi + checkUserToken:admin-api + Spatie can:*
 * against the local testing DB only. Creates/cleans isolated fixture rows and temp files.
 * Does not modify application code or SCORM packages.
 */
class FileManagerHttpAuthorizationTest extends TestCase
{
    /** @var array<string, mixed>|null */
    private $fx;

    /** @var string[] */
    private $tempAbsPaths = [];

    /** @var string|null */
    private $seedError;

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

    /**
     * @return array<string, string>
     */
    private function secretOnlyHeaders(): array
    {
        return [
            'apiSecret' => $this->apiSecret(),
            'Accept' => 'application/json',
        ];
    }

    public function test_unauthenticated_list_download_delete_store_are_rejected(): void
    {
        if (! $this->databaseReady()) {
            $this->markTestSkipped('Local test database unavailable.');
        }

        $fx = $this->seedFixture();
        if ($fx === null) {
            $this->markTestSkipped('Could not seed File Manager HTTP fixtures: '.($this->seedError ?? 'unknown'));
        }

        $id = (int) $fx['file_a_own']->id;

        $this->withHeaders($this->secretOnlyHeaders())
            ->getJson('/api/file_maanger/list')
            ->assertStatus(401);

        $this->withHeaders($this->secretOnlyHeaders())
            ->getJson('/api/file_maanger/download/'.$id)
            ->assertStatus(401);

        $this->withHeaders($this->secretOnlyHeaders())
            ->deleteJson('/api/file_maanger/delete/'.$id)
            ->assertStatus(401);

        $this->withHeaders($this->secretOnlyHeaders())
            ->post('/api/file_maanger/store', [
                'school_id' => $fx['school_a'],
                'files' => [UploadedFile::fake()->create('x.pdf', 10, 'application/pdf')],
            ])
            ->assertStatus(401);
    }

    public function test_teacher_without_spatie_permission_is_forbidden(): void
    {
        $fx = $this->seedFixture();
        if ($fx === null) {
            $this->markTestSkipped('Could not seed File Manager HTTP fixtures: '.($this->seedError ?? 'unknown'));
        }

        $response = $this->withHeaders($this->staffHeaders($fx['teacher_no_perm']))
            ->getJson('/api/file_maanger/list');

        $this->assertContains($response->status(), [403, 401], (string) $response->getContent());
        $this->assertFalse((bool) $response->json('status'));
    }

    public function test_teacher_a_lists_only_own_authorized_files(): void
    {
        $fx = $this->seedFixture();
        if ($fx === null) {
            $this->markTestSkipped('Could not seed File Manager HTTP fixtures.');
        }

        $response = $this->withHeaders($this->staffHeaders($fx['teacher_a']))
            ->getJson('/api/file_maanger/list');

        $response->assertStatus(200)->assertJsonPath('status', true);
        $ids = collect($response->json('files'))->pluck('id')->map(fn ($id) => (int) $id)->all();

        $this->assertContains((int) $fx['file_a_own']->id, $ids);
        $this->assertNotContains((int) $fx['file_b_peer']->id, $ids);
        $this->assertNotContains((int) $fx['file_other_school']->id, $ids);
    }

    public function test_teacher_a_can_download_and_delete_own_file(): void
    {
        $fx = $this->seedFixture();
        if ($fx === null) {
            $this->markTestSkipped('Could not seed File Manager HTTP fixtures.');
        }

        $ownId = (int) $fx['file_a_own']->id;

        $download = $this->withHeaders($this->staffHeaders($fx['teacher_a']))
            ->get('/api/file_maanger/download/'.$ownId);

        $this->assertSame(
            200,
            $download->getStatusCode(),
            'download status='.$download->getStatusCode().' body='.substr((string) $download->getContent(), 0, 300)
        );
        $disposition = (string) $download->headers->get('content-disposition');
        $this->assertStringContainsString('attachment', strtolower($disposition));
        $jsonBody = (string) $download->getContent();
        // Binary download must not be a JSON error payload exposing paths.
        $this->assertStringNotContainsString('"errNum"', $jsonBody);
        $this->assertStringNotContainsString(storage_path(), $jsonBody);
        $this->assertStringNotContainsString('files_maanger/', $jsonBody);

        $delete = $this->withHeaders($this->staffHeaders($fx['teacher_a']))
            ->deleteJson('/api/file_maanger/delete/'.$ownId);

        $delete->assertOk();
        $this->assertDatabaseMissing('file_management', ['id' => $ownId]);
        // Prevent tearDown double-delete complaints.
        $fx['file_a_own'] = null;
        $this->fx = $fx;
    }

    public function test_teacher_a_cannot_download_or_delete_peer_or_other_school_files(): void
    {
        $fx = $this->seedFixture();
        if ($fx === null) {
            $this->markTestSkipped('Could not seed File Manager HTTP fixtures.');
        }

        $headers = $this->staffHeaders($fx['teacher_a']);

        foreach (['file_b_peer', 'file_other_school'] as $key) {
            $id = (int) $fx[$key]->id;

            $download = $this->withHeaders($headers)->get('/api/file_maanger/download/'.$id);
            $this->assertSame(403, $download->status(), (string) $download->getContent());
            $this->assertSame('E403', $download->json('errNum'));
            $this->assertStringNotContainsString('fixture-', (string) $download->getContent());
            $this->assertStringNotContainsString(storage_path(), (string) $download->getContent());
            $this->assertStringNotContainsString('files_maanger/', (string) $download->getContent());

            $delete = $this->withHeaders($headers)->deleteJson('/api/file_maanger/delete/'.$id);
            $this->assertSame(403, $delete->status(), (string) $delete->getContent());
            $this->assertDatabaseHas('file_management', ['id' => $id]);
        }
    }

    public function test_upload_rejects_unauthorized_school_and_binds_created_by_to_auth_user(): void
    {
        $fx = $this->seedFixture();
        if ($fx === null) {
            $this->markTestSkipped('Could not seed File Manager HTTP fixtures.');
        }

        $headers = $this->staffHeaders($fx['teacher_a']);

        $forbidden = $this->withHeaders($headers)->post('/api/file_maanger/store', [
            'school_id' => $fx['school_b'],
            'created_by' => 999999,
            'files' => [UploadedFile::fake()->create('forge.pdf', 12, 'application/pdf')],
        ]);
        $this->assertSame(403, $forbidden->getStatusCode());
        $this->assertSame('E403', $forbidden->json('errNum'));

        $before = FileManagement::query()
            ->where('created_by', (int) $fx['teacher_a']->id)
            ->where('school_id', (int) $fx['school_a'])
            ->where('name', 'like', 'http_ok_%')
            ->count();

        $okName = 'http_ok_'.substr(str_replace('.', '', uniqid('', true)), -8);
        $ok = $this->withHeaders($headers)->post('/api/file_maanger/store', [
            'school_id' => $fx['school_a'],
            'created_by' => 999999,
            'files' => [UploadedFile::fake()->create($okName.'.pdf', 12, 'application/pdf')],
        ]);
        $this->assertSame(200, $ok->getStatusCode(), 'authorized upload should succeed');

        $row = FileManagement::query()
            ->where('created_by', (int) $fx['teacher_a']->id)
            ->where('school_id', (int) $fx['school_a'])
            ->where('name', 'like', $okName.'%')
            ->orderByDesc('id')
            ->first();

        $this->assertNotNull($row);
        $this->assertSame((int) $fx['teacher_a']->id, (int) $row->created_by);
        $this->assertNotSame(999999, (int) $row->created_by);
        $this->assertGreaterThan($before, FileManagement::query()
            ->where('created_by', (int) $fx['teacher_a']->id)
            ->where('school_id', (int) $fx['school_a'])
            ->count());

        $fx['uploaded_ids'][] = (int) $row->id;
        $this->fx = $fx;

        // Track stored binary for cleanup (path is relative under storage/app/public).
        $rel = $row->getRawOriginal('path') ?? $row->getAttributes()['path'] ?? null;
        if (is_string($rel) && $rel !== '' && ! str_starts_with($rel, 'scrom/')) {
            $abs = storage_path('app/public/'.$rel);
            if (is_file($abs)) {
                $this->tempAbsPaths[] = $abs;
            }
        }
    }

    public function test_admin_lists_and_downloads_teacher_file_within_schools_ids(): void
    {
        $fx = $this->seedFixture();
        if ($fx === null) {
            $this->markTestSkipped('Could not seed File Manager HTTP fixtures.');
        }

        $list = $this->withHeaders($this->staffHeaders($fx['admin']))
            ->getJson('/api/file_maanger/list');
        $list->assertStatus(200)->assertJsonPath('status', true);
        $ids = collect($list->json('files'))->pluck('id')->map(fn ($id) => (int) $id)->all();

        $this->assertContains((int) $fx['file_a_own']->id, $ids);
        $this->assertContains((int) $fx['file_b_peer']->id, $ids);

        $download = $this->withHeaders($this->staffHeaders($fx['admin']))
            ->get('/api/file_maanger/download/'.(int) $fx['file_b_peer']->id);
        $this->assertSame(
            200,
            $download->getStatusCode(),
            'admin download status='.$download->getStatusCode().' body='.substr((string) $download->getContent(), 0, 300)
        );
        $this->assertStringContainsString(
            'attachment',
            strtolower((string) $download->headers->get('content-disposition'))
        );
    }

    private function databaseReady(): bool
    {
        try {
            return Schema::hasTable('users')
                && Schema::hasTable('file_management')
                && Schema::hasTable('schools')
                && Schema::hasTable('permissions')
                && Schema::hasTable('schools_roles');
        } catch (Throwable $e) {
            return false;
        }
    }

    /**
     * @return array<string, mixed>|null
     */
    private function seedFixture(): ?array
    {
        if ($this->fx !== null) {
            return $this->fx;
        }

        if (! $this->databaseReady()) {
            return null;
        }

        $schoolA = Schools::query()->orderBy('id')->value('id');
        $schoolB = Schools::query()->where('id', '!=', $schoolA)->orderBy('id')->value('id');
        if (! $schoolA || ! $schoolB) {
            return null;
        }

        $suffix = substr(str_replace('.', '', uniqid('', true)), -10);
        $createdUserIds = [];
        $createdRoleIds = [];
        $createdGradeIds = [];
        $createdFileIds = [];
        $uploadedIds = [];

        try {
            app()[PermissionRegistrar::class]->forgetCachedPermissions();

            foreach (['view-file_managers', 'add-file_managers', 'delete-file_managers'] as $perm) {
                Permission::findOrCreate($perm, 'admin-api');
            }

            $teacherA = $this->insertUser('fm_http_a_'.$suffix, 'teacher', (int) $schoolA);
            $teacherB = $this->insertUser('fm_http_b_'.$suffix, 'teacher', (int) $schoolA);
            $teacherNoPerm = $this->insertUser('fm_http_nop_'.$suffix, 'teacher', (int) $schoolA);
            $admin = $this->insertUser('fm_http_adm_'.$suffix, 'admin', null);
            $createdUserIds = [$teacherA->id, $teacherB->id, $teacherNoPerm->id, $admin->id];

            $teacherA->givePermissionTo(['view-file_managers', 'add-file_managers', 'delete-file_managers']);
            $teacherB->givePermissionTo(['view-file_managers', 'add-file_managers', 'delete-file_managers']);
            $admin->givePermissionTo(['view-file_managers', 'add-file_managers', 'delete-file_managers']);
            // teacherNoPerm: deliberately no file_managers permissions.

            $createdRoleIds[] = SchoolsRoles::create([
                'user_id' => $teacherA->id,
                'school_id' => (int) $schoolA,
                'role_id' => 1,
                'status' => 1,
            ])->id;
            $createdRoleIds[] = SchoolsRoles::create([
                'user_id' => $teacherB->id,
                'school_id' => (int) $schoolA,
                'role_id' => 1,
                'status' => 1,
            ])->id;
            $createdRoleIds[] = SchoolsRoles::create([
                'user_id' => $teacherNoPerm->id,
                'school_id' => (int) $schoolA,
                'role_id' => 1,
                'status' => 1,
            ])->id;

            $createdGradeIds[] = TeachersGrades::create([
                'user_id' => $teacherA->id,
                'school_id' => (int) $schoolA,
                'status' => 1,
            ])->id;
            $createdGradeIds[] = TeachersGrades::create([
                'user_id' => $teacherB->id,
                'school_id' => (int) $schoolA,
                'status' => 1,
            ])->id;

            $fileA = $this->insertManagedFile('fm_http_a_own_'.$suffix, (int) $schoolA, (int) $teacherA->id, 'fixture-a-own');
            $fileB = $this->insertManagedFile('fm_http_b_peer_'.$suffix, (int) $schoolA, (int) $teacherB->id, 'fixture-b-peer');
            // Same creator as A but unauthorized school — school scope must block.
            $fileOther = $this->insertManagedFile('fm_http_other_'.$suffix, (int) $schoolB, (int) $teacherA->id, 'fixture-other-school');
            $createdFileIds = [$fileA->id, $fileB->id, $fileOther->id];

            $this->fx = [
                'school_a' => (int) $schoolA,
                'school_b' => (int) $schoolB,
                'teacher_a' => $teacherA->fresh(),
                'teacher_b' => $teacherB->fresh(),
                'teacher_no_perm' => $teacherNoPerm->fresh(),
                'admin' => $admin->fresh(),
                'file_a_own' => $fileA,
                'file_b_peer' => $fileB,
                'file_other_school' => $fileOther,
                'created_user_ids' => $createdUserIds,
                'created_role_ids' => $createdRoleIds,
                'created_grade_ids' => $createdGradeIds,
                'created_file_ids' => $createdFileIds,
                'uploaded_ids' => $uploadedIds,
            ];

            return $this->fx;
        } catch (Throwable $e) {
            $this->fx = [
                'created_user_ids' => $createdUserIds,
                'created_role_ids' => $createdRoleIds,
                'created_grade_ids' => $createdGradeIds,
                'created_file_ids' => $createdFileIds,
                'uploaded_ids' => $uploadedIds,
            ];
            $this->seedError = get_class($e).': '.$e->getMessage();
            try {
                $this->destroyFixture();
            } catch (Throwable $cleanupError) {
                $this->seedError .= ' | cleanup: '.$cleanupError->getMessage();
            }

            return null;
        }
    }

    private function insertUser(string $username, string $type, ?int $schoolId): User
    {
        $id = (int) DB::table('users')->insertGetId([
            'name' => $username,
            'username' => $username,
            'email' => $username.'@fm-http.test',
            'phone' => '017'.random_int(1000000, 9999999),
            'password' => bcrypt('secret'),
            'type' => $type,
            'status' => '1',
            'verify' => '1',
            'school_id' => $schoolId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return User::query()->findOrFail($id);
    }

    private function insertManagedFile(string $name, int $schoolId, int $createdBy, string $contents): FileManagement
    {
        $relative = 'files_maanger/fm_http_'.$name.'.bin';
        $absolute = storage_path('app/public/'.$relative);
        $dir = dirname($absolute);
        if (! is_dir($dir)) {
            mkdir($dir, 0777, true);
        }
        file_put_contents($absolute, $contents);
        $this->tempAbsPaths[] = $absolute;

        return FileManagement::create([
            'name' => $name,
            'hashName' => basename($relative),
            'type' => 'bin',
            'size' => (string) strlen($contents),
            'path' => $relative,
            'school_id' => $schoolId,
            'created_by' => $createdBy,
        ]);
    }

    private function destroyFixture(): void
    {
        foreach ($this->tempAbsPaths as $path) {
            if (is_string($path) && is_file($path)) {
                @unlink($path);
            }
        }
        $this->tempAbsPaths = [];

        if (! is_array($this->fx)) {
            return;
        }

        $fileIds = array_filter(array_merge(
            $this->fx['created_file_ids'] ?? [],
            $this->fx['uploaded_ids'] ?? []
        ));
        if ($fileIds !== []) {
            // Also pick up upload rows by creator if listed.
            FileManagement::query()->whereIn('id', $fileIds)->delete();
        }
        $teacherAId = isset($this->fx['teacher_a']) && is_object($this->fx['teacher_a'])
            ? (int) $this->fx['teacher_a']->id
            : 0;
        if ($teacherAId > 0) {
            FileManagement::query()
                ->where('created_by', $teacherAId)
                ->where(function ($q) {
                    $q->where('name', 'like', 'http_ok_%')
                        ->orWhere('name', 'like', 'fm_http_%');
                })
                ->delete();
        }

        if (! empty($this->fx['created_grade_ids'])) {
            TeachersGrades::query()->whereIn('id', $this->fx['created_grade_ids'])->delete();
        }
        if (! empty($this->fx['created_role_ids'])) {
            SchoolsRoles::query()->whereIn('id', $this->fx['created_role_ids'])->delete();
        }

        if (! empty($this->fx['created_user_ids'])) {
            foreach ($this->fx['created_user_ids'] as $userId) {
                try {
                    $user = User::query()->find($userId);
                    if ($user) {
                        $user->permissions()->detach();
                        $user->roles()->detach();
                        $user->delete();
                    }
                } catch (Throwable $e) {
                    DB::table('users')->where('id', $userId)->delete();
                }
            }
        }

        try {
            app()[PermissionRegistrar::class]->forgetCachedPermissions();
        } catch (Throwable $e) {
            // ignore
        }

        $this->fx = null;
    }
}
