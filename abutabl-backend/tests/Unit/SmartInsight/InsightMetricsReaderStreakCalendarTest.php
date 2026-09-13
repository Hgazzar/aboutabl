<?php

namespace Tests\Unit\SmartInsight;

use App\Services\SmartInsight\InsightMetricsReader;
use Carbon\Carbon;
use Tests\TestCase;

class InsightMetricsReaderStreakCalendarTest extends TestCase
{
    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_build_calendar_days_marks_completed_today_pending_future_and_missed(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-04-02 12:00:00'));

        /** @var InsightMetricsReader $reader */
        $reader = $this->app->make(InsightMetricsReader::class);

        $method = new \ReflectionMethod(InsightMetricsReader::class, 'buildCalendarDaysForMonth');
        $method->setAccessible(true);

        $days = $method->invoke(
            $reader,
            ['2026-04-01'],
            2026,
            4,
            Carbon::parse('2026-04-02')
        );

        $this->assertCount(30, $days);
        $this->assertSame(['date' => '2026-04-01', 'status' => 'completed'], $days[0]);
        $this->assertSame(['date' => '2026-04-02', 'status' => 'today_pending'], $days[1]);
        $this->assertSame(['date' => '2026-04-03', 'status' => 'future'], $days[2]);
        $this->assertSame('future', $days[29]['status']);
        $this->assertSame('2026-04-30', $days[29]['date']);
    }

    public function test_build_calendar_days_marks_past_inactive_days_as_missed(): void
    {
        /** @var InsightMetricsReader $reader */
        $reader = $this->app->make(InsightMetricsReader::class);

        $method = new \ReflectionMethod(InsightMetricsReader::class, 'buildCalendarDaysForMonth');
        $method->setAccessible(true);

        $days = $method->invoke(
            $reader,
            ['2026-04-10'],
            2026,
            4,
            Carbon::parse('2026-04-15')
        );

        $statusByDate = collect($days)->pluck('status', 'date');
        $this->assertSame('missed', $statusByDate['2026-04-14']);
        $this->assertSame('completed', $statusByDate['2026-04-10']);
        $this->assertSame('today_pending', $statusByDate['2026-04-15']);
        $this->assertSame('future', $statusByDate['2026-04-16']);
    }

    public function test_build_calendar_days_marks_today_completed_when_active(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-04-02 12:00:00'));

        /** @var InsightMetricsReader $reader */
        $reader = $this->app->make(InsightMetricsReader::class);

        $method = new \ReflectionMethod(InsightMetricsReader::class, 'buildCalendarDaysForMonth');
        $method->setAccessible(true);

        $days = $method->invoke(
            $reader,
            ['2026-04-02'],
            2026,
            4,
            Carbon::parse('2026-04-02')
        );

        $this->assertSame(['date' => '2026-04-02', 'status' => 'completed'], $days[1]);
    }

    public function test_calendar_payload_returns_full_month_without_fake_dates(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-02-15 10:00:00'));

        /** @var InsightMetricsReader $reader */
        $reader = $this->app->make(InsightMetricsReader::class);

        $payload = $reader->calendarPayloadForStudent(0, 2026, 2);

        $this->assertSame(2026, $payload['year']);
        $this->assertSame(2, $payload['month']);
        $this->assertCount(28, $payload['days']);
        $this->assertSame('2026-02-01', $payload['days'][0]['date']);
        $this->assertSame('2026-02-28', $payload['days'][27]['date']);

        foreach ($payload['days'] as $day) {
            $this->assertMatchesRegularExpression('/^\d{4}-\d{2}-\d{2}$/', $day['date']);
            $this->assertContains($day['status'], ['completed', 'today_pending', 'future', 'missed']);
        }
    }

    public function test_streak_payload_for_student_unchanged_shape(): void
    {
        /** @var InsightMetricsReader $reader */
        $reader = $this->app->make(InsightMetricsReader::class);

        $payload = $reader->streakPayloadForStudent(0);

        $this->assertArrayHasKey('has_learning_behaviour_data', $payload);
        $this->assertArrayHasKey('current_streak', $payload);
        $this->assertArrayHasKey('longest_streak', $payload);
        $this->assertArrayHasKey('today_completed', $payload);
        $this->assertArrayHasKey('weekly_days', $payload);
        $this->assertArrayNotHasKey('active_day_dates', $payload);
    }
}
