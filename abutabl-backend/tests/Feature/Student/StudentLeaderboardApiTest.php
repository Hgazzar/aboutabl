<?php

namespace Tests\Feature\Student;

use App\Models\Student;
use App\Models\StudentXpBalance;
use App\Models\StudentXpEvent;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;
use Throwable;

class StudentLeaderboardApiTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config([
            'student_xp.xp_per_level' => 300,
            'student_xp.max_level'    => 12,
        ]);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

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
            'Authorization'  => 'Bearer ' . $token,
            'Authorizations' => 'Bearer ' . $token,
            'apiSecret'      => $this->apiSecret(),
            'Accept'         => 'application/json',
        ];
    }

    /**
     * Find an active student with valid school_id and class_id.
     */
    private function activeStudent(): ?Student
    {
        return Student::query()
            ->where(function ($q) {
                $q->where('status', 1)->orWhere('status', '1');
            })
            ->whereNotNull('school_id')
            ->whereNotNull('class_id')
            ->where('school_id', '>', 0)
            ->where('class_id', '>', 0)
            ->first();
    }

    private function requireXpTables(): void
    {
        try {
            if (! Schema::hasTable('student_xp_events') || ! Schema::hasTable('student_xp_balances')) {
                $this->markTestSkipped('student_xp tables missing — run migration.');
            }
        } catch (Throwable $e) {
            $this->markTestSkipped('Database unavailable: ' . $e->getMessage());
        }
    }

    // -------------------------------------------------------------------------
    // Authorization
    // -------------------------------------------------------------------------

    public function test_unauthenticated_request_is_rejected(): void
    {
        $response = $this->withHeaders([
            'apiSecret' => $this->apiSecret(),
            'Accept'    => 'application/json',
        ])->getJson('/api/student/leaderboard');

        $response->assertStatus(401);
        $response->assertJson(['status' => false]);
    }

    // -------------------------------------------------------------------------
    // Basic response shape
    // -------------------------------------------------------------------------

    public function test_authenticated_student_receives_leaderboard_with_correct_shape(): void
    {
        $this->requireXpTables();

        $student = $this->activeStudent();
        if ($student === null) {
            $this->markTestSkipped('No active student with school_id and class_id found.');
        }

        $response = $this->withHeaders($this->studentHeaders($student))
            ->getJson('/api/student/leaderboard');

        $response->assertStatus(200);
        $response->assertJsonPath('status', true);

        $data = $response->json('leaderboard');

        $this->assertIsArray($data);
        $this->assertArrayHasKey('current_user_summary', $data);
        $this->assertArrayHasKey('tabs', $data);
        $this->assertArrayHasKey('items', $data);

        $summary = $data['current_user_summary'];
        $this->assertArrayHasKey('student_id', $summary);
        $this->assertArrayHasKey('name', $summary);
        $this->assertArrayHasKey('rank', $summary);
        $this->assertArrayHasKey('rank_delta', $summary);
        $this->assertArrayHasKey('total_xp', $summary);
        $this->assertArrayHasKey('range_xp', $summary);
        $this->assertArrayHasKey('current_streak', $summary);
        $this->assertArrayHasKey('level', $summary);

        $this->assertSame((int) $student->id, (int) $summary['student_id']);
    }

    // -------------------------------------------------------------------------
    // Scope & range validation
    // -------------------------------------------------------------------------

    public function test_invalid_scope_returns_validation_error(): void
    {
        $student = $this->activeStudent();
        if ($student === null) {
            $this->markTestSkipped('No active student found.');
        }

        $response = $this->withHeaders($this->studentHeaders($student))
            ->getJson('/api/student/leaderboard?scope=grade');

        $response->assertStatus(400);
    }

    public function test_invalid_range_returns_validation_error(): void
    {
        $student = $this->activeStudent();
        if ($student === null) {
            $this->markTestSkipped('No active student found.');
        }

        $response = $this->withHeaders($this->studentHeaders($student))
            ->getJson('/api/student/leaderboard?range=day');

        $response->assertStatus(400);
    }

    public function test_scope_defaults_to_school(): void
    {
        $this->requireXpTables();

        $student = $this->activeStudent();
        if ($student === null) {
            $this->markTestSkipped('No active student found.');
        }

        $response = $this->withHeaders($this->studentHeaders($student))
            ->getJson('/api/student/leaderboard');

        $response->assertStatus(200);
        $response->assertJsonPath('leaderboard.tabs.active_scope', 'school');
    }

    public function test_scope_class_is_respected(): void
    {
        $this->requireXpTables();

        $student = $this->activeStudent();
        if ($student === null) {
            $this->markTestSkipped('No active student found.');
        }

        $response = $this->withHeaders($this->studentHeaders($student))
            ->getJson('/api/student/leaderboard?scope=class');

        $response->assertStatus(200);
        $response->assertJsonPath('leaderboard.tabs.active_scope', 'class');
    }

    public function test_range_all_time_is_accepted(): void
    {
        $this->requireXpTables();

        $student = $this->activeStudent();
        if ($student === null) {
            $this->markTestSkipped('No active student found.');
        }

        $response = $this->withHeaders($this->studentHeaders($student))
            ->getJson('/api/student/leaderboard?range=all_time');

        $response->assertStatus(200);
        $response->assertJsonPath('leaderboard.tabs.active_range', 'all_time');
    }

    // -------------------------------------------------------------------------
    // Current user is present in items
    // -------------------------------------------------------------------------

    public function test_current_user_is_marked_in_items(): void
    {
        $this->requireXpTables();

        $student = $this->activeStudent();
        if ($student === null) {
            $this->markTestSkipped('No active student found.');
        }

        $response = $this->withHeaders($this->studentHeaders($student))
            ->getJson('/api/student/leaderboard');

        $response->assertStatus(200);

        $items = $response->json('leaderboard.items');
        $this->assertIsArray($items);

        if ($items === []) {
            // Empty school — acceptable, skip further assertions.
            $this->markTestSkipped('School has no peer students.');
        }

        $currentItems = array_filter($items, fn ($item) => (bool) $item['is_current']);
        $this->assertCount(1, $currentItems, 'Exactly one item should be marked is_current=true');

        $current = array_values($currentItems)[0];
        $this->assertSame((int) $student->id, (int) $current['student_id']);
    }

    // -------------------------------------------------------------------------
    // School scope isolates to correct school
    // -------------------------------------------------------------------------

    public function test_school_scope_only_returns_students_from_same_school(): void
    {
        $this->requireXpTables();

        $student = $this->activeStudent();
        if ($student === null) {
            $this->markTestSkipped('No active student found.');
        }

        $response = $this->withHeaders($this->studentHeaders($student))
            ->getJson('/api/student/leaderboard?scope=school');

        $response->assertStatus(200);

        $items = $response->json('leaderboard.items');
        if (! is_array($items) || $items === []) {
            return; // Nothing to assert
        }

        $studentIds = array_column($items, 'student_id');
        $foreignSchoolIds = Student::query()
            ->whereIn('id', $studentIds)
            ->where('school_id', '!=', (int) $student->school_id)
            ->pluck('id')
            ->toArray();

        $this->assertEmpty($foreignSchoolIds, 'Items must only contain students from the same school.');
    }

    // -------------------------------------------------------------------------
    // Class scope narrower than school scope
    // -------------------------------------------------------------------------

    public function test_class_scope_is_subset_of_school_scope(): void
    {
        $this->requireXpTables();

        $student = $this->activeStudent();
        if ($student === null) {
            $this->markTestSkipped('No active student found.');
        }

        $schoolResponse = $this->withHeaders($this->studentHeaders($student))
            ->getJson('/api/student/leaderboard?scope=school');

        $classResponse = $this->withHeaders($this->studentHeaders($student))
            ->getJson('/api/student/leaderboard?scope=class');

        $schoolResponse->assertStatus(200);
        $classResponse->assertStatus(200);

        $schoolCount = count($schoolResponse->json('leaderboard.items') ?? []);
        $classCount  = count($classResponse->json('leaderboard.items') ?? []);

        $this->assertLessThanOrEqual($schoolCount, $classCount,
            'Class scope must have ≤ students than school scope.');
    }

    // -------------------------------------------------------------------------
    // Rank ordering
    // -------------------------------------------------------------------------

    public function test_items_are_ranked_correctly_by_xp(): void
    {
        $this->requireXpTables();

        $student = $this->activeStudent();
        if ($student === null) {
            $this->markTestSkipped('No active student found.');
        }

        $response = $this->withHeaders($this->studentHeaders($student))
            ->getJson('/api/student/leaderboard?range=week');

        $response->assertStatus(200);

        $items = $response->json('leaderboard.items');
        if (! is_array($items) || count($items) < 2) {
            return; // Not enough items to verify ordering
        }

        for ($i = 0; $i < count($items) - 1; $i++) {
            $this->assertGreaterThanOrEqual(
                (int) $items[$i]['rank'],
                (int) $items[$i + 1]['rank'],
                'Items must be sorted by rank ascending.'
            );
            $this->assertGreaterThanOrEqual(
                (int) $items[$i + 1]['xp'],
                (int) $items[$i]['xp'],
                'XP must be non-ascending.'
            );
        }
    }
}
