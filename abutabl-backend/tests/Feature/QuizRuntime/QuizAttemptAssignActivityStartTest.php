<?php

namespace Tests\Feature\QuizRuntime;

use App\Http\Controllers\Api\Student\QuizRuntime\StudentQuizRuntimeController;
use App\Http\Requests\QuizRuntime\StartAttemptRequest;
use App\Models\Student;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class QuizAttemptAssignActivityStartTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        if (config('database.default') !== 'sqlite') {
            $this->markTestSkipped('Quiz attempt start tests use a private sqlite schema.');
        }

        Schema::dropAllTables();
        $this->buildSchema();
        $this->seedPlayableQuiz(234, 348);
    }

    public function test_start_stores_assign_activity_id_when_it_matches_assignment_student_and_quiz(): void
    {
        $this->seedStudent(59);
        DB::table('assigns')->insert(['id' => 1597]);
        DB::table('assigns_students')->insert([
            'id' => 1486,
            'assign_id' => 1597,
            'student_id' => 59,
        ]);
        DB::table('assign_activities')->insert([
            'id' => 824,
            'assign_id' => 1597,
            'activity_type' => 'quiz',
            'activity_id' => 234,
        ]);

        $response = $this->startAs(59, [
            'quiz_id' => 234,
            'assign_student_id' => 1486,
            'assign_activity_id' => 824,
        ]);

        $this->assertSame(201, $response->getStatusCode());
        $attempt = DB::table('quiz_attempts')->where('student_id', 59)->where('quiz_id', 234)->first();
        $this->assertNotNull($attempt);
        $this->assertSame(1597, (int) $attempt->assign_id);
        $this->assertSame(1486, (int) $attempt->assign_student_id);
        $this->assertSame(824, (int) $attempt->assign_activity_id);
        $this->assertSame(1, DB::table('quiz_attempts')->count());
        $this->assertSame(0, DB::table('quiz_attempt_answers')->count());
        $this->assertSame(0, DB::table('quiz_results')->count());
    }

    public function test_start_with_only_assign_activity_id_still_links_the_attempt(): void
    {
        $this->seedStudent(59);
        DB::table('assigns')->insert(['id' => 10]);
        DB::table('assigns_students')->insert([
            'id' => 11,
            'assign_id' => 10,
            'student_id' => 59,
        ]);
        DB::table('assign_activities')->insert([
            'id' => 12,
            'assign_id' => 10,
            'activity_type' => 'quiz',
            'activity_id' => 234,
        ]);

        $response = $this->startAs(59, [
            'quiz_id' => 234,
            'assign_activity_id' => 12,
        ]);

        $this->assertSame(201, $response->getStatusCode());
        $attempt = DB::table('quiz_attempts')->where('student_id', 59)->first();
        $this->assertSame(10, (int) $attempt->assign_id);
        $this->assertNull($attempt->assign_student_id);
        $this->assertSame(12, (int) $attempt->assign_activity_id);
    }

    public function test_start_rejects_activity_for_a_different_quiz(): void
    {
        $this->seedStudent(59);
        DB::table('assigns')->insert(['id' => 10]);
        DB::table('assigns_students')->insert([
            'id' => 11,
            'assign_id' => 10,
            'student_id' => 59,
        ]);
        DB::table('assign_activities')->insert([
            'id' => 12,
            'assign_id' => 10,
            'activity_type' => 'quiz',
            'activity_id' => 999,
        ]);

        $response = $this->startAs(59, [
            'quiz_id' => 234,
            'assign_student_id' => 11,
            'assign_activity_id' => 12,
        ]);

        $this->assertSame(422, $response->getStatusCode());
        $this->assertSame(0, DB::table('quiz_attempts')->count());
    }

    public function test_start_rejects_activity_that_is_not_a_quiz(): void
    {
        $this->seedStudent(59);
        DB::table('assigns')->insert(['id' => 10]);
        DB::table('assigns_students')->insert([
            'id' => 11,
            'assign_id' => 10,
            'student_id' => 59,
        ]);
        DB::table('assign_activities')->insert([
            'id' => 12,
            'assign_id' => 10,
            'activity_type' => 'worksheet',
            'activity_id' => 234,
        ]);

        $response = $this->startAs(59, [
            'quiz_id' => 234,
            'assign_student_id' => 11,
            'assign_activity_id' => 12,
        ]);

        $this->assertSame(422, $response->getStatusCode());
        $this->assertSame(0, DB::table('quiz_attempts')->count());
    }

    public function test_start_rejects_activity_the_student_does_not_own(): void
    {
        $this->seedStudent(59);
        $this->seedStudent(60);
        DB::table('assigns')->insert(['id' => 10]);
        DB::table('assigns_students')->insert([
            'id' => 11,
            'assign_id' => 10,
            'student_id' => 60,
        ]);
        DB::table('assign_activities')->insert([
            'id' => 12,
            'assign_id' => 10,
            'activity_type' => 'quiz',
            'activity_id' => 234,
        ]);

        $response = $this->startAs(59, [
            'quiz_id' => 234,
            'assign_activity_id' => 12,
        ]);

        $this->assertSame(403, $response->getStatusCode());
        $this->assertSame(0, DB::table('quiz_attempts')->count());
    }

    public function test_start_rejects_activity_from_a_different_assignment(): void
    {
        $this->seedStudent(59);
        DB::table('assigns')->insert(['id' => 10]);
        DB::table('assigns')->insert(['id' => 20]);
        DB::table('assigns_students')->insert([
            'id' => 11,
            'assign_id' => 10,
            'student_id' => 59,
        ]);
        DB::table('assign_activities')->insert([
            'id' => 21,
            'assign_id' => 20,
            'activity_type' => 'quiz',
            'activity_id' => 234,
        ]);

        $response = $this->startAs(59, [
            'quiz_id' => 234,
            'assign_student_id' => 11,
            'assign_activity_id' => 21,
        ]);

        $this->assertSame(403, $response->getStatusCode());
        $this->assertSame(0, DB::table('quiz_attempts')->count());
    }

    public function test_start_rejects_when_student_owns_both_assignments_but_ids_disagree(): void
    {
        $this->seedStudent(59);
        DB::table('assigns')->insert(['id' => 10]);
        DB::table('assigns')->insert(['id' => 20]);
        DB::table('assigns_students')->insert([
            'id' => 11,
            'assign_id' => 10,
            'student_id' => 59,
        ]);
        DB::table('assigns_students')->insert([
            'id' => 22,
            'assign_id' => 20,
            'student_id' => 59,
        ]);
        DB::table('assign_activities')->insert([
            'id' => 21,
            'assign_id' => 20,
            'activity_type' => 'quiz',
            'activity_id' => 234,
        ]);

        $response = $this->startAs(59, [
            'quiz_id' => 234,
            'assign_student_id' => 11,
            'assign_activity_id' => 21,
        ]);

        $this->assertSame(422, $response->getStatusCode());
        $this->assertSame(0, DB::table('quiz_attempts')->count());
    }

    public function test_start_without_assignment_still_creates_an_attempt(): void
    {
        $this->seedStudent(59, 204, 52);
        DB::table('subjects_schools')->insert([
            'id' => 1,
            'school_id' => 204,
            'subject_id' => 348,
            'status' => '1',
        ]);
        DB::table('subjects_grades')->insert([
            'id' => 1,
            'subjects_schools_id' => 1,
            'grade_id' => 52,
            'subject_id' => 348,
            'status' => '1',
        ]);

        $response = $this->startAs(59, ['quiz_id' => 234]);

        $this->assertSame(201, $response->getStatusCode());
        $attempt = DB::table('quiz_attempts')->where('student_id', 59)->first();
        $this->assertNotNull($attempt);
        $this->assertNull($attempt->assign_id);
        $this->assertNull($attempt->assign_student_id);
        $this->assertNull($attempt->assign_activity_id);
        $this->assertSame(0, DB::table('quiz_results')->count());
    }

    public function test_grading_services_do_not_read_assign_activity_id(): void
    {
        $grading = (string) file_get_contents(
            app_path('Services/QuizRuntime/QuizAutoGradingService.php')
        );
        $submit = (string) file_get_contents(
            app_path('Services/QuizRuntime/QuizSubmitService.php')
        );

        $this->assertStringNotContainsString('assign_activity_id', $grading);
        $this->assertStringNotContainsString('assign_activity_id', $submit);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function startAs(int $studentId, array $payload)
    {
        $student = Student::query()->findOrFail($studentId);
        Auth::guard('user-api')->setUser($student);

        $request = StartAttemptRequest::create(
            '/api/student/quiz-runtime/attempts',
            'POST',
            $payload
        );
        $request->setContainer($this->app);
        $request->setRedirector($this->app->make('redirect'));
        $request->setUserResolver(function () use ($student) {
            return $student;
        });
        $request->validateResolved();

        return $this->app->make(StudentQuizRuntimeController::class)->start($request);
    }

    private function seedStudent(int $id, int $schoolId = 204, int $gradeId = 52): void
    {
        DB::table('students')->insert([
            'id' => $id,
            'name' => 'Student '.$id,
            'school_id' => $schoolId,
            'grade_id' => $gradeId,
        ]);
        DB::table('quizes')->updateOrInsert(
            ['id' => 234],
            ['subject_id' => 348, 'title_en' => 'First']
        );
    }

    private function seedPlayableQuiz(int $quizId, int $subjectId): void
    {
        DB::table('quizes')->insert([
            'id' => $quizId,
            'subject_id' => $subjectId,
            'title_en' => 'First',
        ]);
        DB::table('quiz_versions')->insert([
            'id' => 20,
            'quiz_id' => $quizId,
            'version_number' => 1,
            'status' => 'published',
            'settings_frozen' => json_encode(new \stdClass()),
            'published_at' => '2026-11-22 12:31:29',
        ]);
        DB::table('quiz_snapshots')->insert([
            'id' => 20,
            'quiz_version_id' => 20,
            'quiz_id' => $quizId,
            'payload' => json_encode([
                'questions' => [
                    ['snapshot_question_key' => 'i1_q13'],
                ],
            ]),
            'item_count' => 1,
        ]);
    }

    private function buildSchema(): void
    {
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->unsignedBigInteger('school_id')->nullable();
            $table->unsignedBigInteger('grade_id')->nullable();
            $table->timestamps();
        });

        Schema::create('quizes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->string('title_en')->nullable();
            $table->timestamps();
        });

        Schema::create('subjects_schools', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('school_id')->nullable();
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->string('status')->nullable();
            $table->timestamps();
        });

        Schema::create('subjects_grades', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('subjects_schools_id')->nullable();
            $table->unsignedBigInteger('grade_id')->nullable();
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->string('status')->nullable();
            $table->timestamps();
        });

        Schema::create('assigns', function (Blueprint $table) {
            $table->id();
            $table->timestamps();
        });

        Schema::create('assigns_students', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('assign_id')->nullable();
            $table->unsignedBigInteger('student_id')->nullable();
            $table->timestamps();
        });

        Schema::create('assign_activities', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('assign_id')->nullable();
            $table->string('activity_type')->nullable();
            $table->unsignedBigInteger('activity_id')->nullable();
            $table->timestamps();
        });

        Schema::create('quiz_versions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('quiz_id');
            $table->integer('version_number')->default(1);
            $table->string('status');
            $table->text('settings_frozen')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
        });

        Schema::create('quiz_snapshots', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('quiz_version_id');
            $table->unsignedBigInteger('quiz_id');
            $table->text('payload')->nullable();
            $table->integer('item_count')->default(0);
            $table->timestamps();
        });

        Schema::create('quiz_attempts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('quiz_id');
            $table->unsignedBigInteger('quiz_version_id')->nullable();
            $table->unsignedBigInteger('quiz_snapshot_id')->nullable();
            $table->unsignedBigInteger('student_id');
            $table->unsignedBigInteger('school_id')->nullable();
            $table->unsignedBigInteger('assign_id')->nullable();
            $table->unsignedBigInteger('assign_student_id')->nullable();
            $table->unsignedBigInteger('assign_activity_id')->nullable();
            $table->string('status')->nullable();
            $table->integer('attempt_no')->default(1);
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->integer('time_limit_seconds')->nullable();
            $table->string('do_when_time_end')->nullable();
            $table->text('question_order')->nullable();
            $table->text('answer_order')->nullable();
            $table->string('client_instance_id')->nullable();
            $table->string('start_idempotency_key')->nullable();
            $table->integer('row_version')->default(1);
            $table->string('active_slot_key')->nullable();
            $table->timestamps();
        });

        Schema::create('quiz_attempt_answers', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('attempt_id');
            $table->timestamps();
        });

        Schema::create('quiz_results', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('attempt_id');
            $table->timestamps();
        });
    }
}
