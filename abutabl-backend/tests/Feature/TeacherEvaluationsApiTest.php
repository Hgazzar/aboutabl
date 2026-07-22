<?php

namespace Tests\Feature;

use App\Models\Student;
use App\Models\TeacherEvaluation;
use App\Models\User;
use App\Services\StudentProfileService;
use App\Services\TeacherEvaluationService;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class TeacherEvaluationsApiTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        if (! Schema::hasTable('teacher_evaluations')) {
            $this->markTestSkipped('teacher_evaluations table missing — run migrations.');
        }
    }

    public function test_teacher_can_create_and_list_evaluation(): void
    {
        $teacher = User::where('id', 179)->first();
        $studentId = $this->activeStudentId();

        if (! $teacher || $studentId <= 0) {
            $this->markTestSkipped('Teacher 179 or class-21 student missing.');
        }

        $service = app(TeacherEvaluationService::class);
        $created = $service->create(
            179,
            [],
            21,
            $studentId,
            'Shows strong analytical skills in mathematics.'
        );

        $this->assertSame($studentId, $created['student_id']);
        $this->assertTrue($created['is_latest']);
        $this->assertNotEmpty($created['note']);

        $list = $service->listForStudent(179, [], 21, $studentId);
        $this->assertTrue($list['available']);
        $this->assertNotEmpty($list['items']);
        $this->assertSame($created['id'], $list['latest']['id']);

        TeacherEvaluation::query()->where('id', $created['id'])->delete();
    }

    public function test_teacher_cannot_update_another_teachers_note(): void
    {
        $studentId = $this->activeStudentId();
        $otherTeacherId = (int) User::query()
            ->where('id', '!=', 179)
            ->orderBy('id')
            ->value('id');

        if ($studentId <= 0 || $otherTeacherId <= 0) {
            $this->markTestSkipped('No active student or alternate teacher.');
        }

        $foreign = TeacherEvaluation::query()->create([
            'school_id'  => null,
            'teacher_id' => $otherTeacherId,
            'class_id'   => 21,
            'student_id' => $studentId,
            'note'       => 'Foreign note',
        ]);

        $service = app(TeacherEvaluationService::class);

        try {
            $this->expectException(\InvalidArgumentException::class);
            $service->update(179, [], 21, $studentId, (int) $foreign->id, 'Hacked');
        } finally {
            $foreign->delete();
        }
    }

    public function test_profile_evaluation_reads_from_database(): void
    {
        $studentId = $this->activeStudentId();

        if ($studentId <= 0) {
            $this->markTestSkipped('No active student in class 21.');
        }

        $created = app(TeacherEvaluationService::class)->create(
            179,
            [],
            21,
            $studentId,
            'Profile-visible evaluation note.'
        );

        try {
            $payload = app(StudentProfileService::class)->buildProfile(
                179,
                [],
                21,
                $studentId,
                'week'
            );

            $evaluation = $payload['teacher_evaluation'];
            $this->assertTrue($evaluation['available']);
            $this->assertNotEmpty($evaluation['notes']);
            $this->assertIsArray($evaluation['latest_feedback']);
            $this->assertSame($created['id'], $evaluation['latest_feedback']['id']);
            $this->assertArrayHasKey('available', $evaluation['smart_insight']);
            $this->assertArrayHasKey('insights', $evaluation['smart_insight']);
            $this->assertIsArray($evaluation['smart_insight']['insights']);
        } finally {
            TeacherEvaluation::query()->where('id', $created['id'])->delete();
        }
    }

    private function activeStudentId(): int
    {
        return (int) Student::query()
            ->where('class_id', 21)
            ->where('status', '1')
            ->value('id');
    }
}
