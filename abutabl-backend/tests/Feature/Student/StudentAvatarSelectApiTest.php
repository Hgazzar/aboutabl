<?php

namespace Tests\Feature\Student;

use App\Models\Student;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;
use Throwable;

class StudentAvatarSelectApiTest extends TestCase
{
    private function apiSecret(): string
    {
        return (string) env('API_SECRET', 'OASzRok654E0AJ20KH');
    }

    /**
     * @return array<string, string>
     */
    private function studentHeaders(Student $student): array
    {
        auth()->setDefaultDriver('user-api');
        $token = Auth::guard('user-api')->login($student);

        return [
            'Authorization'  => 'Bearer '.$token,
            'Authorizations' => 'Bearer '.$token,
            'apiSecret'      => $this->apiSecret(),
            'Accept'         => 'application/json',
        ];
    }

    private function requireColumns(): void
    {
        try {
            if (! Schema::hasColumn('students', 'avatar_preset')
                || ! Schema::hasColumn('students', 'avatar_selected_at')) {
                $this->markTestSkipped('avatar onboarding columns missing — run migration.');
            }
        } catch (Throwable $e) {
            $this->markTestSkipped('Database unavailable: '.$e->getMessage());
        }
    }

    private function findStudent(): ?Student
    {
        return Student::query()
            ->where(function ($q) {
                $q->where('status', 1)->orWhere('status', '1');
            })
            ->where(function ($q) {
                $q->where('verify', 1)->orWhere('verify', '1');
            })
            ->orderBy('id')
            ->first();
    }

    public function test_unauthenticated_select_is_rejected(): void
    {
        $this->requireColumns();

        $response = $this->withHeaders([
            'apiSecret' => $this->apiSecret(),
            'Accept' => 'application/json',
        ])->postJson('/api/student/avatar/select', [
            'avatar_preset' => 'a2',
        ]);

        $response->assertStatus(401);
    }

    public function test_select_avatar_persists_preset_and_clears_needs_flag(): void
    {
        $this->requireColumns();
        $student = $this->findStudent();
        if (! $student) {
            $this->markTestSkipped('No active student in DB.');
        }

        $prevPreset = $student->avatar_preset;
        $prevSelectedAt = $student->avatar_selected_at;

        $student->avatar_preset = null;
        $student->avatar_selected_at = null;
        $student->save();

        try {
            $response = $this->withHeaders($this->studentHeaders($student))
                ->postJson('/api/student/avatar/select', [
                    'avatar_preset' => 'a3',
                ]);

            $response->assertStatus(200)
                ->assertJson([
                    'status' => true,
                    'avatar' => [
                        'avatar_preset' => 'a3',
                        'needs_avatar_selection' => false,
                    ],
                ]);

            $student->refresh();
            $this->assertSame('a3', $student->avatar_preset);
            $this->assertNotNull($student->avatar_selected_at);

            $profile = $this->withHeaders($this->studentHeaders($student))
                ->getJson('/api/student/profile');

            $profile->assertStatus(200)
                ->assertJsonPath('profile.avatar_preset', 'a3')
                ->assertJsonPath('profile.needs_avatar_selection', false);
        } finally {
            $student->avatar_preset = $prevPreset;
            $student->avatar_selected_at = $prevSelectedAt;
            $student->save();
        }
    }

    public function test_select_avatar_rejects_invalid_preset(): void
    {
        $this->requireColumns();
        $student = $this->findStudent();
        if (! $student) {
            $this->markTestSkipped('No active student in DB.');
        }

        $response = $this->withHeaders($this->studentHeaders($student))
            ->postJson('/api/student/avatar/select', [
                'avatar_preset' => 'not-real',
            ]);

        $response->assertStatus(400)
            ->assertJson(['status' => false]);
    }
}
