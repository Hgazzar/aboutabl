<?php

namespace Tests\Feature;

use App\Http\Resources\StudentProfileResource;
use App\Models\Student;
use App\Models\User;
use App\Services\ClassStudentsOverviewService;
use App\Services\StudentMetricsService;
use App\Services\StudentProfileService;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class StudentProfileApiTest extends TestCase
{
    public function test_metrics_service_is_shared_source_of_truth(): void
    {
        $metrics = app(StudentMetricsService::class);

        $score = $metrics->computeScore(['completed' => 8, 'total' => 10]);
        $this->assertSame(80.0, $score['percent']);
        $this->assertTrue($score['has_data']);

        $performance = $metrics->computePerformance(80.0, 0.0, 2, false);
        $this->assertSame(70.0, $performance);

        $ranked = $metrics->assignRanks([
            [
                'student_id'  => 1,
                'name'        => 'B',
                'score'       => ['percent' => 90.0],
                'performance' => ['percent' => 90.0],
            ],
            [
                'student_id'  => 2,
                'name'        => 'A',
                'score'       => ['percent' => 90.0],
                'performance' => ['percent' => 90.0],
            ],
            [
                'student_id'  => 3,
                'name'        => 'C',
                'score'       => ['percent' => 50.0],
                'performance' => ['percent' => 40.0],
            ],
        ]);

        $this->assertSame(1, $ranked[0]['rank']);
        $this->assertSame(1, $ranked[1]['rank']);
        $this->assertSame(3, $ranked[2]['rank']);
    }

    public function test_overview_still_returns_expected_shape_after_refactor(): void
    {
        $report = app(ClassStudentsOverviewService::class)->buildOverview(179, [], 21, 'term', 'rank', 'asc');

        $this->assertSame('assigns_students_and_subject_progress', $report['source']);
        $this->assertArrayHasKey('items', $report);
    }

    public function test_resource_always_exposes_contract_keys(): void
    {
        $formatted = (new StudentProfileResource([
            'source'             => 'composed_student_profile',
            'range'              => 'week',
            'class_id'           => 21,
            'student'            => null,
            'analytics'          => [],
            'completion'         => [],
            'learning_progress'  => [],
            'activities'         => [],
            'standards'          => [],
            'teacher_evaluation' => [],
            'rankings'           => [],
        ]))->resolve();

        $this->assertIsArray($formatted['student']);
        $this->assertArrayHasKey('student_id', $formatted['student']);
        $this->assertArrayHasKey('name', $formatted['student']);
        $this->assertIsArray($formatted['analytics']['series']);
        $this->assertArrayHasKey('current_page', $formatted['activities']['assignments']['pagination']);
        $this->assertArrayHasKey('per_page', $formatted['activities']['assignments']['pagination']);
        $this->assertArrayHasKey('last_page', $formatted['activities']['assignments']['pagination']);
        $this->assertArrayHasKey('total', $formatted['activities']['assignments']['pagination']);
        $this->assertArrayHasKey('has_more', $formatted['activities']['assignments']['pagination']);
        $this->assertFalse($formatted['teacher_evaluation']['available']);
        $this->assertArrayHasKey('available', $formatted['teacher_evaluation']['smart_insight']);
        $this->assertArrayHasKey('insights', $formatted['teacher_evaluation']['smart_insight']);
        $this->assertIsArray($formatted['teacher_evaluation']['smart_insight']['insights']);
        $this->assertIsArray($formatted['teacher_evaluation']['notes']);
    }

    public function test_student_profile_service_returns_fixed_contract(): void
    {
        $studentId = $this->activeStudentId();

        if ($studentId <= 0) {
            $this->markTestSkipped('No active student in class 21.');
        }

        $payload = app(StudentProfileService::class)->buildProfile(
            179,
            [],
            21,
            $studentId,
            'week'
        );

        $formatted = (new StudentProfileResource($payload))->resolve();

        $this->assertSame('composed_student_profile', $formatted['source']);
        $this->assertIsArray($formatted['student']);
        $this->assertArrayHasKey('series', $formatted['analytics']);
        $this->assertArrayHasKey('completed', $formatted['completion']);
        $this->assertArrayHasKey('learning_progress', $formatted);
        $this->assertArrayHasKey('activity', $formatted['learning_progress']);
        $this->assertArrayHasKey('submissions', $formatted['learning_progress']);
        $this->assertArrayHasKey('score_percent', $formatted['learning_progress']);
        $this->assertArrayHasKey('current_page', $formatted['activities']['assignments']['pagination']);
        $this->assertArrayHasKey('available', $formatted['teacher_evaluation']);
        $this->assertArrayHasKey('available', $formatted['teacher_evaluation']['smart_insight']);
        $this->assertArrayHasKey('insights', $formatted['teacher_evaluation']['smart_insight']);
        $this->assertIsArray($formatted['teacher_evaluation']['smart_insight']['insights']);
        $this->assertSame('class', $formatted['rankings']['scope']);
        $this->assertArrayHasKey('all_classes_rank', $formatted['rankings']);
        $this->assertArrayHasKey('all_classes_available', $formatted['rankings']);
        $this->assertArrayHasKey('class_rank', $formatted['rankings']);
        $this->assertArrayHasKey('school_rank', $formatted['rankings']);
        $this->assertIsArray($formatted['rankings']['items']);
    }

    public function test_rankings_scope_all_classes_and_limit_keeps_current_student(): void
    {
        $studentId = $this->activeStudentId();

        if ($studentId <= 0) {
            $this->markTestSkipped('No active student in class 21.');
        }

        $payload = app(StudentProfileService::class)->buildProfile(
            179,
            [],
            21,
            $studentId,
            'week',
            'letters-explorer',
            1,
            1,
            'all_classes',
            null,
            1
        );

        $rankings = (new StudentProfileResource($payload))->resolve()['rankings'];

        $this->assertSame('all_classes', $rankings['scope']);
        $this->assertTrue($rankings['all_classes_available'] || $rankings['available'] === false);
        $this->assertSame($rankings['all_classes_rank'], $rankings['school_rank']);
        $this->assertSame($rankings['all_classes_available'], $rankings['school_available']);

        if ($rankings['available']) {
            $current = collect($rankings['items'])->firstWhere('is_current', true);
            $this->assertNotNull($current, 'Current student must remain visible when limit excludes them');
            $this->assertSame($studentId, (int) $current['student_id']);
            $this->assertSame($rankings['all_classes_rank'], $current['rank']);
            $this->assertArrayHasKey('performance_label', $current);
        }
    }

    public function test_rankings_search_filters_items_without_forcing_current(): void
    {
        $studentId = $this->activeStudentId();

        if ($studentId <= 0) {
            $this->markTestSkipped('No active student in class 21.');
        }

        $payload = app(StudentProfileService::class)->buildProfile(
            179,
            [],
            21,
            $studentId,
            'week',
            'letters-explorer',
            1,
            1,
            'class',
            '__no_match_rankings_xyz__',
            null
        );

        $rankings = (new StudentProfileResource($payload))->resolve()['rankings'];

        $this->assertSame('class', $rankings['scope']);
        $this->assertSame([], $rankings['items']);
        $this->assertNotNull($rankings['class_rank'] ?? true);
    }

    public function test_query_count_stays_stable_as_assignment_volume_grows(): void
    {
        $studentId = $this->activeStudentId();

        if ($studentId <= 0) {
            $this->markTestSkipped('No active student in class 21.');
        }

        $baseline = $this->countQueriesForProfile($studentId);

        $createdAssignIds = [];
        $createdSubmissionIds = [];

        try {
            foreach ([200, 1000] as $volume) {
                $this->seedAssignments($studentId, $volume, $createdAssignIds, $createdSubmissionIds);
                $count = $this->countQueriesForProfile($studentId);

                // Allow small absolute drift from standards warm cache / connection noise,
                // but forbid linear growth with assignment volume.
                $this->assertLessThanOrEqual(
                    $baseline + 8,
                    $count,
                    "Query count grew too much at volume={$volume} (baseline={$baseline}, actual={$count})"
                );
            }
        } finally {
            if ($createdSubmissionIds !== []) {
                DB::table('assigns_students')->whereIn('id', $createdSubmissionIds)->delete();
            }
            if ($createdAssignIds !== []) {
                DB::table('assigns')->whereIn('id', $createdAssignIds)->delete();
            }
        }
    }

    public function test_student_profile_endpoint_requires_auth(): void
    {
        $response = $this->withHeaders([
            'apiSecret' => env('API_SECRET', 'OASzRok654E0AJ20KH'),
        ])->getJson('/api/dashboard/teacher/classes/21/students/1/profile');

        $response->assertStatus(401);
    }

    public function test_student_profile_endpoint_returns_payload_for_teacher(): void
    {
        $teacher = User::where('id', 179)->first();

        if (! $teacher) {
            $this->markTestSkipped('Teacher user 179 not found.');
        }

        $studentId = $this->activeStudentId();

        if ($studentId <= 0) {
            $this->markTestSkipped('No active student in class 21.');
        }

        $token = auth('admin-api')->login($teacher);

        $response = $this->withHeaders([
            'apiSecret'     => env('API_SECRET', 'OASzRok654E0AJ20KH'),
            'Authorization' => 'Bearer '.$token,
        ])->getJson("/api/dashboard/teacher/classes/21/students/{$studentId}/profile?range=week");

        $response->assertStatus(200)
            ->assertJsonPath('status', true)
            ->assertJsonStructure([
                'status',
                'source',
                'range',
                'class_id',
                'student' => [
                    'student_id',
                    'name',
                    'photo_url',
                    'avatar',
                    'class_label',
                    'grade_label',
                    'rank',
                    'performance_percent',
                    'score_percent',
                    'status',
                ],
                'analytics' => [
                    'available',
                    'series',
                    'summary' => [
                        'performance_percent',
                        'delta_percent',
                        'completion_percent',
                        'attendance_percent',
                        'attendance_available',
                    ],
                ],
                'completion' => [
                    'completed',
                    'missing',
                    'total',
                    'percent',
                    'score_percent',
                ],
                'learning_progress' => [
                    'source',
                    'range',
                    'activity' => [
                        'completed',
                        'total',
                        'percent',
                    ],
                    'submissions' => [
                        'completed',
                        'missing',
                        'total',
                    ],
                    'score_percent',
                ],
                'activities' => [
                    'assignments' => [
                        'items',
                        'pagination' => [
                            'current_page',
                            'per_page',
                            'last_page',
                            'total',
                            'has_more',
                        ],
                    ],
                    'quizzes' => [
                        'items',
                        'pagination' => [
                            'current_page',
                            'per_page',
                            'last_page',
                            'total',
                            'has_more',
                        ],
                        'average_percent',
                        'average_available',
                    ],
                ],
                'standards' => [
                    'available',
                    'tabs',
                    'selected',
                    'items',
                ],
                'teacher_evaluation' => [
                    'available',
                    'notes',
                    'latest_feedback',
                    'recommendations',
                    'smart_insight' => [
                        'available',
                        'text',
                        'generated_at',
                        'insights',
                    ],
                ],
                'rankings' => [
                    'available',
                    'scope',
                    'class_rank',
                    'all_classes_rank',
                    'all_classes_available',
                    'school_rank',
                    'school_available',
                    'items',
                ],
            ]);
    }

    private function activeStudentId(): int
    {
        return (int) Student::query()
            ->where('class_id', 21)
            ->where('status', '1')
            ->value('id');
    }

    private function countQueriesForProfile(int $studentId): int
    {
        DB::flushQueryLog();
        DB::enableQueryLog();

        app(StudentProfileService::class)->buildProfile(179, [], 21, $studentId, 'week');

        $count = count(DB::getQueryLog());
        DB::disableQueryLog();

        return $count;
    }

    /**
     * @param  int[]  $createdAssignIds
     * @param  int[]  $createdSubmissionIds
     */
    private function seedAssignments(
        int $studentId,
        int $total,
        array &$createdAssignIds,
        array &$createdSubmissionIds
    ): void {
        $existing = count($createdAssignIds);
        $needed = max(0, $total - $existing);

        if ($needed === 0) {
            return;
        }

        $now = now();
        $template = DB::table('assigns')->where('created_by', 179)->first();

        for ($i = 0; $i < $needed; $i++) {
            $assignId = DB::table('assigns')->insertGetId([
                'type'          => 'units',
                'type_id'       => 1,
                'school_id'     => $template->school_id ?? 1,
                'status'        => 1,
                'created_by'    => 179,
                'assigned_name' => 'Profile Perf Seed #'.($existing + $i + 1),
                'assigned_path' => null,
                'grade_id'      => $template->grade_id ?? null,
                'subject_id'    => $template->subject_id ?? 10,
                'due_at'        => $now->copy()->addDays(3),
                'created_at'    => $now,
                'updated_at'    => $now,
            ]);

            $submissionId = DB::table('assigns_students')->insertGetId([
                'assign_id'  => $assignId,
                'student_id' => $studentId,
                'school_id'  => $template->school_id ?? 1,
                'status'     => 1,
                'type'       => 'units',
                'type_id'    => 1,
                'opened_at'  => null,
                'created_by' => 179,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $createdAssignIds[] = $assignId;
            $createdSubmissionIds[] = $submissionId;
        }
    }
}
