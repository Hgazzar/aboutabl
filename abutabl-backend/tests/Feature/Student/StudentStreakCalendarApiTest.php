<?php

namespace Tests\Feature\Student;

use App\Models\Student;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

class StudentStreakCalendarApiTest extends TestCase
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

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $response = $this->withHeaders([
            'apiSecret' => $this->apiSecret(),
            'Accept'    => 'application/json',
        ])->getJson('/api/student/streak/calendar?year=2026&month=4');

        $response->assertStatus(401);
        $response->assertJson([
            'status' => false,
            'errNum' => 'E3001',
        ]);
    }

    public function test_calendar_endpoint_returns_requested_month(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-04-02 12:00:00'));

        $student = $this->firstActiveStudent();
        if ($student === null) {
            $this->markTestSkipped('No active student available.');
        }

        $response = $this->withHeaders($this->studentHeaders($student))
            ->getJson('/api/student/streak/calendar?year=2026&month=4');

        $response->assertStatus(200);
        $response->assertJsonPath('status', true);
        $response->assertJsonPath('streak_calendar.year', 2026);
        $response->assertJsonPath('streak_calendar.month', 4);

        $days = $response->json('streak_calendar.days');
        $this->assertIsArray($days);
        $this->assertCount(30, $days);
        $this->assertSame('2026-04-01', $days[0]['date']);
        $this->assertSame('2026-04-30', $days[29]['date']);
    }

    public function test_calendar_future_dates_are_identified_correctly(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-04-02 12:00:00'));

        $student = $this->firstActiveStudent();
        if ($student === null) {
            $this->markTestSkipped('No active student available.');
        }

        $response = $this->withHeaders($this->studentHeaders($student))
            ->getJson('/api/student/streak/calendar?year=2026&month=4');

        $response->assertStatus(200);

        $days = $response->json('streak_calendar.days');
        $statusByDate = collect($days)->pluck('status', 'date');

        $this->assertSame('today_pending', $statusByDate['2026-04-02'] ?? null);
        $this->assertSame('future', $statusByDate['2026-04-03'] ?? null);
        $this->assertSame('future', $statusByDate['2026-04-30'] ?? null);
    }

    public function test_invalid_month_is_rejected(): void
    {
        $student = $this->firstActiveStudent();
        if ($student === null) {
            $this->markTestSkipped('No active student available.');
        }

        $response = $this->withHeaders($this->studentHeaders($student))
            ->getJson('/api/student/streak/calendar?year=2026&month=13');

        $response->assertStatus(400);
        $response->assertJsonPath('status', false);
    }
}
