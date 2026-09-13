<?php

namespace Tests\Unit\Student;

use App\Models\Student;
use App\Models\StudentXpBalance;
use App\Services\Student\StudentAchievementService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class StudentAchievementServiceTest extends TestCase
{
    private function service(): StudentAchievementService
    {
        config([
            'student_xp.xp_per_level'              => 300,
            'student_xp.max_level'                 => 12,
            'student_xp.achiever_level'            => 12,
            'student_xp.progress_track_start_level'=> 9,
        ]);

        return $this->app->make(StudentAchievementService::class);
    }

    private function emptyMetrics(array $overrides = []): array
    {
        return array_merge([
            'lessons_completed'         => 0,
            'lesson_completed_ats'      => [],
            'content_completed'         => 0,
            'content_completed_ats'     => [],
            'quizzes_completed'         => 0,
            'quiz_completed_ats'        => [],
            'quizzes_passed'            => 0,
            'quiz_passed_ats'           => [],
            'best_quiz_score'           => 0.0,
            'authoritative_quiz_scores' => [],
            'total_xp'                  => 0,
            'level'                     => 1,
            'xp_events'                 => [],
        ], $overrides);
    }

    private function byKey(array $items): array
    {
        $map = [];
        foreach ($items as $item) {
            $map[$item['key']] = $item;
        }

        return $map;
    }

    public function test_catalog_has_figma_v1_achievements_only(): void
    {
        $catalog = config('student_achievements.catalog');
        $this->assertIsArray($catalog);
        $this->assertCount(2, $catalog);

        $keys = array_column($catalog, 'key');
        $this->assertSame(['3_stars_badge', 'builder_badge'], $keys);

        foreach ($catalog as $row) {
            $this->assertNotEmpty($row['key']);
            $this->assertNotEmpty($row['title']);
            $this->assertNotEmpty($row['description']);
            $this->assertNotEmpty($row['icon']);
            $this->assertNotEmpty($row['rule_type']);
        }

        $byKey = [];
        foreach ($catalog as $row) {
            $byKey[$row['key']] = $row;
        }

        $this->assertSame('3 Stars Badge', $byKey['3_stars_badge']['title']);
        $this->assertSame('You earned your first 100 XP', $byKey['3_stars_badge']['description']);
        $this->assertSame('achievement-3-stars', $byKey['3_stars_badge']['icon']);
        $this->assertSame('total_xp', $byKey['3_stars_badge']['rule_type']);
        $this->assertSame(100, $byKey['3_stars_badge']['threshold']);

        $this->assertSame('Builder Badge', $byKey['builder_badge']['title']);
        $this->assertSame('Reach Builder level.', $byKey['builder_badge']['description']);
        $this->assertSame('achievement-builder', $byKey['builder_badge']['icon']);
        $this->assertSame('level', $byKey['builder_badge']['rule_type']);
        $this->assertSame('student_xp.progress_track_start_level', $byKey['builder_badge']['threshold_from']);
    }

    public function test_three_stars_badge_progress_from_total_xp(): void
    {
        $items = $this->byKey($this->service()->mapCatalog($this->emptyMetrics([
            'total_xp' => 80,
            'level'    => 1,
        ])));

        $this->assertSame(80, $items['3_stars_badge']['progress']);
        $this->assertFalse($items['3_stars_badge']['earned']);
        $this->assertNull($items['3_stars_badge']['earned_at']);
    }

    public function test_three_stars_badge_earned_at_one_hundred_xp(): void
    {
        $at = Carbon::parse('2026-07-01 08:00:00')->toIso8601String();

        $items = $this->byKey($this->service()->mapCatalog($this->emptyMetrics([
            'total_xp'  => 100,
            'level'     => 1,
            'xp_events' => [
                ['amount' => 100, 'earned_at' => $at],
            ],
        ])));

        $this->assertTrue($items['3_stars_badge']['earned']);
        $this->assertSame(100, $items['3_stars_badge']['progress']);
        $this->assertSame($at, $items['3_stars_badge']['earned_at']);
    }

    public function test_builder_badge_progress_from_level_nine_threshold(): void
    {
        $items = $this->byKey($this->service()->mapCatalog($this->emptyMetrics([
            'total_xp' => 500,
            'level'    => 3,
        ])));

        $this->assertFalse($items['builder_badge']['earned']);
        $this->assertSame(33, $items['builder_badge']['progress']); // floor(3/9*100)
        $this->assertNull($items['builder_badge']['earned_at']);
    }

    public function test_builder_badge_earned_at_level_nine(): void
    {
        $cross = Carbon::parse('2026-08-01 09:00:00')->toIso8601String();
        // Level 9 floor XP = (9-2)*300 = 2100
        $items = $this->byKey($this->service()->mapCatalog($this->emptyMetrics([
            'total_xp'  => 2100,
            'level'     => 9,
            'xp_events' => [
                ['amount' => 2100, 'earned_at' => $cross],
            ],
        ])));

        $this->assertTrue($items['builder_badge']['earned']);
        $this->assertSame(100, $items['builder_badge']['progress']);
        $this->assertSame($cross, $items['builder_badge']['earned_at']);
    }

    public function test_build_for_invalid_student_returns_empty(): void
    {
        $this->assertSame([], $this->service()->buildForStudent(0));
        $this->assertSame([], $this->service()->buildForStudent(-1));
    }

    public function test_build_for_student_is_isolated_between_students(): void
    {
        if (! Schema::hasTable('students') || ! Schema::hasTable('student_xp_balances')) {
            $this->markTestSkipped('students / student_xp_balances unavailable.');
        }

        $students = Student::query()->orderBy('id')->limit(2)->get();
        if ($students->count() < 2) {
            $this->markTestSkipped('Need at least two students.');
        }

        $service = $this->service();
        $a = $service->buildForStudent((int) $students[0]->id);
        $b = $service->buildForStudent((int) $students[1]->id);

        $this->assertCount(2, $a);
        $this->assertCount(2, $b);

        $xpA = (int) (StudentXpBalance::query()->where('student_id', $students[0]->id)->value('total_xp') ?? 0);
        $xpB = (int) (StudentXpBalance::query()->where('student_id', $students[1]->id)->value('total_xp') ?? 0);

        $mapA = $this->byKey($a);
        $mapB = $this->byKey($b);

        if ($xpA !== $xpB) {
            $this->assertNotSame($mapA['3_stars_badge']['progress'], $mapB['3_stars_badge']['progress']);
        } else {
            $this->assertSame($mapA['3_stars_badge']['progress'], $mapB['3_stars_badge']['progress']);
        }
    }

    public function test_build_for_student_is_read_only_on_gamification_tables(): void
    {
        if (! Schema::hasTable('students')) {
            $this->markTestSkipped('students table unavailable.');
        }

        $studentId = (int) DB::table('students')->value('id');
        if ($studentId <= 0) {
            $this->markTestSkipped('No students available.');
        }

        $countsBefore = [
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

        $payload = $this->service()->buildForStudent($studentId);
        $this->assertCount(2, $payload);

        $countsAfter = [
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

        $this->assertSame($countsBefore, $countsAfter);
    }

    public function test_gather_quiz_metrics_excludes_voided_attempts(): void
    {
        if (! Schema::hasTable('quiz_results') || ! Schema::hasTable('quiz_attempts')) {
            $this->markTestSkipped('quiz tables unavailable.');
        }

        $voided = DB::table('quiz_results as qr')
            ->join('quiz_attempts as qa', 'qa.id', '=', 'qr.attempt_id')
            ->where('qr.is_authoritative', 1)
            ->where(function ($q) {
                $q->whereNotNull('qa.voided_at')
                    ->orWhere('qa.status', 'voided');
            })
            ->first(['qr.student_id', 'qr.id as result_id', 'qa.id as attempt_id']);

        if ($voided === null) {
            $this->markTestSkipped('No voided authoritative quiz result to assert against.');
        }

        $studentId = (int) $voided->student_id;
        $metrics = $this->service()->gatherMetrics($studentId);

        $validCount = (int) DB::table('quiz_results as qr')
            ->join('quiz_attempts as qa', 'qa.id', '=', 'qr.attempt_id')
            ->where('qr.student_id', $studentId)
            ->where('qr.is_authoritative', 1)
            ->whereNull('qa.voided_at')
            ->where('qa.status', '!=', 'voided')
            ->distinct('qr.quiz_id')
            ->count('qr.quiz_id');

        $this->assertSame($validCount, $metrics['quizzes_completed']);
    }
}
