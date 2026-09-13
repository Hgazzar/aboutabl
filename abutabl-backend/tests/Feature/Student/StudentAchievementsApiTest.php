<?php

namespace Tests\Feature\Student;

use App\Models\Student;
use App\Models\StudentXpBalance;
use App\Services\Student\StudentAchievementService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class StudentAchievementsApiTest extends TestCase
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

    private function firstActiveStudent(): ?Student
    {
        return Student::query()
            ->where(function ($q) {
                $q->where('status', 1)->orWhere('status', '1');
            })
            ->orderBy('id')
            ->first();
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $response = $this->withHeaders([
            'apiSecret' => $this->apiSecret(),
            'Accept'    => 'application/json',
        ])->getJson('/api/student/achievements');

        $response->assertStatus(401);
        $response->assertJson([
            'status' => false,
            'errNum' => 'E3001',
        ]);
    }

    public function test_missing_api_secret_is_rejected(): void
    {
        $student = $this->firstActiveStudent();
        if ($student === null) {
            $this->markTestSkipped('No active student available.');
        }

        auth()->setDefaultDriver('user-api');
        $token = Auth::guard('user-api')->login($student);

        $response = $this->withHeaders([
            'Authorization'  => 'Bearer '.$token,
            'Authorizations' => 'Bearer '.$token,
            'Accept'         => 'application/json',
        ])->getJson('/api/student/achievements');

        $response->assertStatus(403);
        $response->assertJson([
            'status' => false,
            'errNum' => 'E3000',
        ]);
    }

    public function test_authenticated_student_receives_figma_catalog_shape(): void
    {
        $student = $this->firstActiveStudent();
        if ($student === null) {
            $this->markTestSkipped('No active student available.');
        }

        $response = $this->withHeaders($this->studentHeaders($student))
            ->getJson('/api/student/achievements');

        $response->assertStatus(200);
        $response->assertJson([
            'status' => true,
            'errNum' => '200',
        ]);
        $response->assertJsonStructure([
            'achievements' => [
                '*' => [
                    'key',
                    'title',
                    'description',
                    'icon',
                    'progress',
                    'earned',
                    'earned_at',
                ],
            ],
        ]);

        $achievements = $response->json('achievements');
        $this->assertIsArray($achievements);
        $this->assertCount(2, $achievements);

        $keys = array_column($achievements, 'key');
        $this->assertSame(['3_stars_badge', 'builder_badge'], $keys);

        $byKey = $this->byKey($achievements);
        $this->assertSame('3 Stars Badge', $byKey['3_stars_badge']['title']);
        $this->assertSame('Builder Badge', $byKey['builder_badge']['title']);
        $this->assertSame('You earned your first 100 XP', $byKey['3_stars_badge']['description']);
        $this->assertSame('Reach Builder level.', $byKey['builder_badge']['description']);
        $this->assertSame('achievement-3-stars', $byKey['3_stars_badge']['icon']);
        $this->assertSame('achievement-builder', $byKey['builder_badge']['icon']);

        foreach ($achievements as $row) {
            $this->assertIsInt($row['progress']);
            $this->assertGreaterThanOrEqual(0, $row['progress']);
            $this->assertLessThanOrEqual(100, $row['progress']);
            $this->assertIsBool($row['earned']);
            $this->assertTrue($row['earned_at'] === null || is_string($row['earned_at']));
        }
    }

    public function test_response_matches_service_for_authenticated_student(): void
    {
        $student = $this->firstActiveStudent();
        if ($student === null) {
            $this->markTestSkipped('No active student available.');
        }

        /** @var StudentAchievementService $service */
        $service = $this->app->make(StudentAchievementService::class);
        $expected = $service->buildForStudent((int) $student->id);

        $response = $this->withHeaders($this->studentHeaders($student))
            ->getJson('/api/student/achievements');

        $response->assertStatus(200);
        $this->assertSame($expected, $response->json('achievements'));
    }

    public function test_student_isolation_uses_only_authenticated_student(): void
    {
        $students = Student::query()
            ->where(function ($q) {
                $q->where('status', 1)->orWhere('status', '1');
            })
            ->orderBy('id')
            ->limit(2)
            ->get();

        if ($students->count() < 2) {
            $this->markTestSkipped('Need at least two active students.');
        }

        /** @var StudentAchievementService $service */
        $service = $this->app->make(StudentAchievementService::class);

        $studentA = $students[0];
        $studentB = $students[1];

        $expectedA = $service->buildForStudent((int) $studentA->id);
        $expectedB = $service->buildForStudent((int) $studentB->id);

        $responseA = $this->withHeaders($this->studentHeaders($studentA))
            ->getJson('/api/student/achievements');
        $responseB = $this->withHeaders($this->studentHeaders($studentB))
            ->getJson('/api/student/achievements');

        $responseA->assertStatus(200);
        $responseB->assertStatus(200);

        $this->assertSame($expectedA, $responseA->json('achievements'));
        $this->assertSame($expectedB, $responseB->json('achievements'));

        $forged = $this->withHeaders($this->studentHeaders($studentA))
            ->getJson('/api/student/achievements?student_id='.$studentB->id);

        $forged->assertStatus(200);
        $this->assertSame($expectedA, $forged->json('achievements'));
    }

    public function test_zero_xp_student_gets_zero_stars_progress_not_fake_values(): void
    {
        if (! Schema::hasTable('students')) {
            $this->markTestSkipped('students table unavailable.');
        }

        /** @var StudentAchievementService $service */
        $service = $this->app->make(StudentAchievementService::class);

        $candidate = Student::query()
            ->where(function ($q) {
                $q->where('status', 1)->orWhere('status', '1');
            })
            ->orderBy('id')
            ->limit(80)
            ->get()
            ->first(function (Student $student) use ($service) {
                $metrics = $service->gatherMetrics((int) $student->id);

                return (int) ($metrics['total_xp'] ?? 0) === 0;
            });

        if ($candidate === null) {
            $this->markTestSkipped('No zero-XP student available.');
        }

        $expected = $service->buildForStudent((int) $candidate->id);

        $response = $this->withHeaders($this->studentHeaders($candidate))
            ->getJson('/api/student/achievements');

        $response->assertStatus(200);
        $achievements = $response->json('achievements');
        $this->assertSame($expected, $achievements);
        $this->assertCount(2, $achievements);

        $byKey = $this->byKey($achievements);
        $this->assertSame(0, $byKey['3_stars_badge']['progress']);
        $this->assertFalse($byKey['3_stars_badge']['earned']);
        $this->assertNull($byKey['3_stars_badge']['earned_at']);
        $this->assertFalse($byKey['builder_badge']['earned']);
        $this->assertSame(11, $byKey['builder_badge']['progress']); // floor(1/9*100) at level 1
    }

    public function test_endpoint_is_read_only_on_gamification_tables(): void
    {
        $student = $this->firstActiveStudent();
        if ($student === null) {
            $this->markTestSkipped('No active student available.');
        }

        $before = [
            'xp_events'   => Schema::hasTable('student_xp_events')
                ? (int) DB::table('student_xp_events')->count()
                : 0,
            'xp_balances' => Schema::hasTable('student_xp_balances')
                ? (int) DB::table('student_xp_balances')->count()
                : 0,
            'quests'      => Schema::hasTable('student_quests')
                ? (int) DB::table('student_quests')->count()
                : 0,
        ];

        $response = $this->withHeaders($this->studentHeaders($student))
            ->getJson('/api/student/achievements');

        $response->assertStatus(200);

        $after = [
            'xp_events'   => Schema::hasTable('student_xp_events')
                ? (int) DB::table('student_xp_events')->count()
                : 0,
            'xp_balances' => Schema::hasTable('student_xp_balances')
                ? (int) DB::table('student_xp_balances')->count()
                : 0,
            'quests'      => Schema::hasTable('student_quests')
                ? (int) DB::table('student_quests')->count()
                : 0,
        ];

        $this->assertSame($before, $after);
    }

    public function test_real_xp_data_reflected_for_three_stars_badge(): void
    {
        if (! Schema::hasTable('student_xp_balances')) {
            $this->markTestSkipped('student_xp_balances unavailable.');
        }

        $balance = StudentXpBalance::query()
            ->where('total_xp', '>=', 100)
            ->orderBy('total_xp')
            ->first();

        if ($balance === null) {
            $this->markTestSkipped('No student with XP >= 100.');
        }

        $student = Student::query()->find((int) $balance->student_id);
        if ($student === null) {
            $this->markTestSkipped('Student for XP balance missing.');
        }

        /** @var StudentAchievementService $service */
        $service = $this->app->make(StudentAchievementService::class);
        $expected = $this->byKey($service->buildForStudent((int) $student->id));

        $response = $this->withHeaders($this->studentHeaders($student))
            ->getJson('/api/student/achievements');

        $response->assertStatus(200);
        $actual = $this->byKey($response->json('achievements'));

        $this->assertTrue($actual['3_stars_badge']['earned']);
        $this->assertSame(100, $actual['3_stars_badge']['progress']);
        $this->assertSame($expected['3_stars_badge'], $actual['3_stars_badge']);
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     * @return array<string, array<string, mixed>>
     */
    private function byKey(array $items): array
    {
        $map = [];
        foreach ($items as $item) {
            $map[$item['key']] = $item;
        }

        return $map;
    }
}
