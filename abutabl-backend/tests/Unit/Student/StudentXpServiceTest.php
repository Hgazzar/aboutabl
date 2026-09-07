<?php

namespace Tests\Unit\Student;

use App\Models\StudentXpBalance;
use App\Models\StudentXpEvent;
use App\Services\Student\StudentXpService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class StudentXpServiceTest extends TestCase
{
    private function service(): StudentXpService
    {
        config([
            'student_xp.xp_per_level'               => 300,
            'student_xp.max_level'                  => 12,
            'student_xp.achiever_level'             => 12,
            'student_xp.progress_track_start_level' => 9,
        ]);

        return $this->app->make(StudentXpService::class);
    }

    public function test_zero_xp_progress(): void
    {
        $progress = $this->service()->progressFromTotalXp(0);

        $this->assertSame(0, $progress['total_xp']);
        $this->assertSame(1, $progress['level']);
        $this->assertSame(0, $progress['xp_in_level']);
        $this->assertSame(300, $progress['next_level_threshold']);
        $this->assertSame(300, $progress['xp_to_next_level']);
    }

    public function test_xp_before_level_nine(): void
    {
        $progress = $this->service()->progressFromTotalXp(1000);

        $this->assertSame(5, $progress['level']);
        $this->assertSame(1000, $progress['total_xp']);
        $this->assertSame(100, $progress['xp_in_level']);
        $this->assertSame(1500, $progress['next_level_threshold']);
        $this->assertSame(500, $progress['xp_to_next_level']);
    }

    public function test_figma_level_ten_at_2400_and_2450_xp(): void
    {
        $service = $this->service();

        foreach ([2400, 2450] as $total) {
            $progress = $service->progressFromTotalXp($total);

            $this->assertSame(10, $progress['level'], "total_xp={$total}");
            $this->assertSame(3000, $progress['next_level_threshold'], "total_xp={$total}");
            $this->assertSame(3000 - $total, $progress['xp_to_next_level'], "total_xp={$total}");
            $this->assertSame($total - 2400, $progress['xp_in_level'], "total_xp={$total}");
        }
    }

    public function test_level_eleven_at_2700_xp(): void
    {
        $progress = $this->service()->progressFromTotalXp(2700);

        $this->assertSame(11, $progress['level']);
        $this->assertSame(3300, $progress['next_level_threshold']);
        $this->assertSame(600, $progress['xp_to_next_level']);
        $this->assertSame(0, $progress['xp_in_level']);
    }

    public function test_level_twelve_at_3000_xp(): void
    {
        $progress = $this->service()->progressFromTotalXp(3000);

        $this->assertSame(12, $progress['level']);
        $this->assertNull($progress['next_level_threshold']);
        $this->assertNull($progress['xp_to_next_level']);
        $this->assertSame(0, $progress['xp_in_level']);
    }

    public function test_level_twelve_caps_beyond_max_threshold(): void
    {
        $progress = $this->service()->progressFromTotalXp(99999);

        $this->assertSame(12, $progress['level']);
        $this->assertNull($progress['next_level_threshold']);
    }

    public function test_track_fill_percent_aligns_with_level_rules(): void
    {
        $service = $this->service();
        $step = 300;
        $trackStartXp = $service->levelFloorXp(9);
        $trackEndXp = 12 * $step;

        $this->assertSame(2100, $trackStartXp);
        $this->assertSame(3600, $trackEndXp);

        $total = 2450;
        $fill = min(100, max(0, (($total - $trackStartXp) / ($trackEndXp - $trackStartXp)) * 100));
        $this->assertSame(23.33, round($fill, 2));
    }

    public function test_build_dashboard_payload_shape(): void
    {
        if (! Schema::hasTable('student_xp_balances')) {
            $this->markTestSkipped('student_xp_balances table is not available.');
        }

        $studentId = (int) DB::table('student_xp_balances')->value('student_id');

        if ($studentId <= 0) {
            $this->markTestSkipped('No student XP balance row available.');
        }

        $payload = $this->service()->buildDashboardPayload($studentId);

        $this->assertArrayHasKey('total_xp', $payload);
        $this->assertArrayHasKey('level', $payload);
        $this->assertArrayHasKey('weekly_xp', $payload);
        $this->assertArrayHasKey('next_level_threshold', $payload);
        $this->assertArrayHasKey('level_badge_label', $payload);
        $this->assertArrayHasKey('levels_away_from_achiever', $payload);
        $this->assertArrayHasKey('track', $payload);
        $this->assertArrayHasKey('fill_percent', $payload['track']);
    }

    public function test_resolve_level_badge_label(): void
    {
        config([
            'student_xp.level_badge_labels' => [
                10 => 'builder',
                12 => 'Achiever',
            ],
            'student_xp.achiever_level' => 12,
            'student_xp.progress_track_start_level' => 9,
        ]);

        $service = $this->app->make(StudentXpService::class);

        $this->assertSame('builder', $service->resolveLevelBadgeLabel(10));
        $this->assertSame('Achiever', $service->resolveLevelBadgeLabel(12));
        $this->assertSame('explorer', $service->resolveLevelBadgeLabel(3));
    }

    public function test_weekly_xp_sums_events_in_current_week(): void
    {
        if (! Schema::hasTable('student_xp_events')) {
            $this->markTestSkipped('student_xp_events table is not available.');
        }

        $studentId = (int) DB::table('students')->value('id');

        if ($studentId <= 0) {
            $this->markTestSkipped('No students available.');
        }

        $service = $this->service();
        $sourceId = 999_001;

        StudentXpEvent::query()
            ->where('student_id', $studentId)
            ->where('source_type', 'test')
            ->whereIn('source_id', [$sourceId, $sourceId + 1])
            ->delete();

        StudentXpEvent::query()->create([
            'student_id'  => $studentId,
            'source_type' => 'test',
            'source_id'   => $sourceId,
            'amount'      => 40,
            'earned_at'   => Carbon::now()->startOfWeek()->addDay(),
        ]);
        StudentXpEvent::query()->create([
            'student_id'  => $studentId,
            'source_type' => 'test',
            'source_id'   => $sourceId + 1,
            'amount'      => 60,
            'earned_at'   => Carbon::now()->startOfWeek()->subDay(),
        ]);

        $this->assertSame(40, $service->weeklyXpEarned($studentId));
        $this->assertSame(60, $service->previousWeeklyXpEarned($studentId));

        StudentXpEvent::query()
            ->where('student_id', $studentId)
            ->where('source_type', 'test')
            ->whereIn('source_id', [$sourceId, $sourceId + 1])
            ->delete();
    }

    public function test_balance_equals_sum_of_events_after_sync(): void
    {
        if (! Schema::hasTable('student_xp_events') || ! Schema::hasTable('quiz_results')) {
            $this->markTestSkipped('XP/quiz tables are not available.');
        }

        $studentId = (int) DB::table('student_xp_balances')->orderByDesc('total_xp')->value('student_id');

        if ($studentId <= 0) {
            $this->markTestSkipped('No student with XP balance in database.');
        }

        $service = $this->service();
        $core = $service->syncAndGet($studentId);
        $eventsSum = (int) StudentXpEvent::query()->where('student_id', $studentId)->sum('amount');
        $balance = StudentXpBalance::query()->where('student_id', $studentId)->first();

        $this->assertNotNull($balance);
        $this->assertSame($eventsSum, (int) $balance->total_xp);
        $this->assertSame($eventsSum, $core['total_xp']);
        $this->assertSame($service->resolveLevel($eventsSum), (int) $balance->level);
    }

    public function test_quiz_retake_does_not_stack_xp(): void
    {
        if (! Schema::hasTable('student_xp_events') || ! Schema::hasTable('quiz_results')) {
            $this->markTestSkipped('XP/quiz tables are not available.');
        }

        $studentId = (int) DB::table('quiz_results')
            ->where('is_authoritative', 1)
            ->select('student_id')
            ->groupBy('student_id')
            ->havingRaw('COUNT(*) > 1')
            ->value('student_id');

        if ($studentId <= 0) {
            $this->markTestSkipped('No student with multiple authoritative quiz results.');
        }

        $service = $this->service();
        $service->syncAndGet($studentId);

        $quizEventCount = StudentXpEvent::query()
            ->where('student_id', $studentId)
            ->whereIn('source_type', ['quiz', 'quiz_result'])
            ->count();

        $distinctQuizzes = (int) DB::table('quiz_results')
            ->where('student_id', $studentId)
            ->where('is_authoritative', 1)
            ->distinct('quiz_id')
            ->count('quiz_id');

        $this->assertSame($distinctQuizzes, $quizEventCount);
        $this->assertSame(0, StudentXpEvent::query()
            ->where('student_id', $studentId)
            ->where('source_type', 'quiz_result')
            ->count());
    }

    public function test_quiz_first_attempt_creates_single_quiz_event(): void
    {
        if (! Schema::hasTable('student_xp_events') || ! Schema::hasTable('quiz_results')) {
            $this->markTestSkipped('XP/quiz tables are not available.');
        }

        $row = DB::table('quiz_results')
            ->where('is_authoritative', 1)
            ->orderBy('id')
            ->first(['student_id', 'quiz_id', 'percent']);

        if ($row === null) {
            $this->markTestSkipped('No authoritative quiz results available.');
        }

        $studentId = (int) $row->student_id;
        $quizId = (int) $row->quiz_id;

        StudentXpEvent::query()->where('student_id', $studentId)->delete();
        StudentXpBalance::query()->where('student_id', $studentId)->delete();

        $service = $this->service();
        $service->syncAndGet($studentId);

        $event = StudentXpEvent::query()
            ->where('student_id', $studentId)
            ->where('source_type', 'quiz')
            ->where('source_id', $quizId)
            ->first();

        $bestPercent = (float) DB::table('quiz_results')
            ->where('student_id', $studentId)
            ->where('quiz_id', $quizId)
            ->where('is_authoritative', 1)
            ->max('percent');

        $this->assertNotNull($event);
        $this->assertSame(max(1, (int) round($bestPercent)), (int) $event->amount);
    }
}
