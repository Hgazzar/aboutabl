<?php

namespace Tests\Unit\Student;

use App\Models\Student;
use App\Services\SmartInsight\InsightMetricsReader;
use App\Services\Student\StudentLeaderboardService;
use App\Services\Student\StudentXpService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Mockery;
use Tests\TestCase;
use Throwable;

class StudentLeaderboardServiceTest extends TestCase
{
    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private function service(
        ?StudentXpService $xp = null,
        ?InsightMetricsReader $reader = null
    ): StudentLeaderboardService {
        $xp     = $xp     ?? $this->app->make(StudentXpService::class);
        $reader = $reader ?? $this->app->make(InsightMetricsReader::class);

        return new StudentLeaderboardService($xp, $reader);
    }

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

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    // -------------------------------------------------------------------------
    // Scope normalization
    // -------------------------------------------------------------------------

    public function test_invalid_scope_falls_back_to_school(): void
    {
        $this->requireXpTables();

        $student = $this->activeStudent();
        if ($student === null) {
            $this->markTestSkipped('No active student found.');
        }

        $service = $this->service();
        $payload = $service->build((int) $student->id, 'grade', 'week');

        $this->assertSame('school', $payload['tabs']['active_scope']);
    }

    public function test_invalid_range_falls_back_to_week(): void
    {
        $this->requireXpTables();

        $student = $this->activeStudent();
        if ($student === null) {
            $this->markTestSkipped('No active student found.');
        }

        $service = $this->service();
        $payload = $service->build((int) $student->id, 'school', 'day');

        $this->assertSame('week', $payload['tabs']['active_range']);
    }

    // -------------------------------------------------------------------------
    // Response keys
    // -------------------------------------------------------------------------

    public function test_payload_has_required_keys(): void
    {
        $this->requireXpTables();

        $student = $this->activeStudent();
        if ($student === null) {
            $this->markTestSkipped('No active student found.');
        }

        $service = $this->service();
        $payload = $service->build((int) $student->id);

        $this->assertArrayHasKey('current_user_summary', $payload);
        $this->assertArrayHasKey('tabs', $payload);
        $this->assertArrayHasKey('items', $payload);

        $summary = $payload['current_user_summary'];
        foreach (['student_id', 'name', 'rank', 'rank_delta', 'total_xp', 'range_xp', 'level', 'current_streak'] as $key) {
            $this->assertArrayHasKey($key, $summary, "summary missing key: $key");
        }
    }

    // -------------------------------------------------------------------------
    // Current student identity
    // -------------------------------------------------------------------------

    public function test_current_student_id_matches_authenticated_user(): void
    {
        $this->requireXpTables();

        $student = $this->activeStudent();
        if ($student === null) {
            $this->markTestSkipped('No active student found.');
        }

        $service = $this->service();
        $payload = $service->build((int) $student->id);

        $this->assertSame((int) $student->id, (int) $payload['current_user_summary']['student_id']);
    }

    public function test_exactly_one_is_current_flag_in_items(): void
    {
        $this->requireXpTables();

        $student = $this->activeStudent();
        if ($student === null) {
            $this->markTestSkipped('No active student found.');
        }

        $service = $this->service();
        $payload = $service->build((int) $student->id, 'school');

        $items = $payload['items'];
        if ($items === []) {
            $this->markTestSkipped('No peers in school — acceptable empty payload.');
        }

        $currentCount = count(array_filter($items, fn ($item) => (bool) $item['is_current']));
        $this->assertSame(1, $currentCount);
    }

    // -------------------------------------------------------------------------
    // Scope isolation (school vs class)
    // -------------------------------------------------------------------------

    public function test_class_scope_items_all_share_same_class_id(): void
    {
        $this->requireXpTables();

        $student = $this->activeStudent();
        if ($student === null) {
            $this->markTestSkipped('No active student found.');
        }

        $service = $this->service();
        $payload = $service->build((int) $student->id, 'class');

        $items = $payload['items'];
        if ($items === []) {
            return; // Empty class is valid
        }

        $studentIds = array_column($items, 'student_id');
        $foreignClassStudents = Student::query()
            ->whereIn('id', $studentIds)
            ->where('class_id', '!=', (int) $student->class_id)
            ->count();

        $this->assertSame(0, $foreignClassStudents,
            'Class scope must not include students from other classes.');
    }

    public function test_school_scope_items_all_share_same_school_id(): void
    {
        $this->requireXpTables();

        $student = $this->activeStudent();
        if ($student === null) {
            $this->markTestSkipped('No active student found.');
        }

        $service = $this->service();
        $payload = $service->build((int) $student->id, 'school');

        $items = $payload['items'];
        if ($items === []) {
            return;
        }

        $studentIds = array_column($items, 'student_id');
        $foreignStudents = Student::query()
            ->whereIn('id', $studentIds)
            ->where('school_id', '!=', (int) $student->school_id)
            ->count();

        $this->assertSame(0, $foreignStudents,
            'School scope must not include students from other schools.');
    }

    // -------------------------------------------------------------------------
    // XP ranking order
    // -------------------------------------------------------------------------

    public function test_items_are_sorted_by_xp_descending(): void
    {
        $this->requireXpTables();

        $student = $this->activeStudent();
        if ($student === null) {
            $this->markTestSkipped('No active student found.');
        }

        $service = $this->service();
        $payload = $service->build((int) $student->id, 'school', 'all_time');

        $items = $payload['items'];
        if (count($items) < 2) {
            return;
        }

        for ($i = 0; $i < count($items) - 1; $i++) {
            $this->assertGreaterThanOrEqual(
                (int) $items[$i + 1]['xp'],
                (int) $items[$i]['xp'],
                'XP in items must be non-ascending (rank ascending).'
            );
        }
    }

    // -------------------------------------------------------------------------
    // Streak comes from InsightMetricsReader
    // -------------------------------------------------------------------------

    public function test_current_streak_is_sourced_from_insight_reader(): void
    {
        $this->requireXpTables();

        $student = $this->activeStudent();
        if ($student === null) {
            $this->markTestSkipped('No active student found.');
        }

        $mockReader = Mockery::mock(InsightMetricsReader::class);
        $mockReader
            ->shouldReceive('streakPayloadForStudent')
            ->withArgs(fn ($id) => $id === (int) $student->id)
            ->once()
            ->andReturn([
                'has_learning_behaviour_data' => true,
                'current_streak' => 99,
                'longest_streak' => 99,
                'today_completed' => true,
                'weekly_days' => [],
            ]);

        $service = $this->service(null, $mockReader);
        $payload = $service->build((int) $student->id);

        $this->assertSame(99, (int) $payload['current_user_summary']['current_streak']);
    }

    // -------------------------------------------------------------------------
    // Rank delta for all_time is null
    // -------------------------------------------------------------------------

    public function test_rank_delta_is_null_for_all_time_range(): void
    {
        $this->requireXpTables();

        $student = $this->activeStudent();
        if ($student === null) {
            $this->markTestSkipped('No active student found.');
        }

        $service = $this->service();
        $payload = $service->build((int) $student->id, 'school', 'all_time');

        $this->assertNull($payload['current_user_summary']['rank_delta'],
            'rank_delta must be null for all_time range.');
    }

    // -------------------------------------------------------------------------
    // Range XP is non-negative
    // -------------------------------------------------------------------------

    public function test_range_xp_is_non_negative(): void
    {
        $this->requireXpTables();

        $student = $this->activeStudent();
        if ($student === null) {
            $this->markTestSkipped('No active student found.');
        }

        $service = $this->service();

        foreach (['week', 'month', 'all_time'] as $range) {
            $payload = $service->build((int) $student->id, 'school', $range);
            $rangeXp = (int) $payload['current_user_summary']['range_xp'];
            $this->assertGreaterThanOrEqual(0, $rangeXp, "range_xp must be ≥ 0 for range=$range");
        }
    }

    // -------------------------------------------------------------------------
    // Nonexistent student returns safe empty payload
    // -------------------------------------------------------------------------

    public function test_nonexistent_student_returns_empty_payload(): void
    {
        $service = $this->service();
        $payload = $service->build(99999999);

        $this->assertIsArray($payload);
        $this->assertArrayHasKey('current_user_summary', $payload);
        $this->assertSame(0, (int) $payload['current_user_summary']['student_id']);
        $this->assertSame([], $payload['items']);
    }
}
