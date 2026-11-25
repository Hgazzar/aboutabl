<?php

namespace Tests\Feature\QuizRuntime;

use App\Http\Resources\QuizRuntime\TeacherAttemptDetailResource;
use App\Http\Resources\QuizRuntime\TeacherAttemptListResource;
use App\Models\QuizRuntime\QuizAttempt;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class TeacherAttemptAssignActivityResourceTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        if (config('database.default') !== 'sqlite' || config('database.connections.sqlite.database') !== ':memory:') {
            $this->markTestSkipped('Teacher report resource tests run only on sqlite :memory:.');
        }

        Schema::dropAllTables();
        Schema::create('quiz_attempts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('quiz_id');
            $table->unsignedBigInteger('quiz_snapshot_id')->nullable();
            $table->unsignedBigInteger('student_id');
            $table->unsignedBigInteger('school_id')->nullable();
            $table->unsignedBigInteger('assign_id')->nullable();
            $table->unsignedBigInteger('assign_student_id')->nullable();
            $table->unsignedBigInteger('assign_activity_id')->nullable();
            $table->string('status')->nullable();
            $table->integer('attempt_no')->default(1);
            $table->timestamp('started_at')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->timestamp('last_saved_at')->nullable();
            $table->integer('row_version')->default(1);
            $table->timestamps();
        });
    }

    public function test_list_and_detail_expose_assign_activity_id_from_the_attempt_row(): void
    {
        DB::table('quiz_attempts')->insert([
            'id' => 9101,
            'quiz_id' => 501,
            'quiz_snapshot_id' => 11,
            'student_id' => 61,
            'school_id' => 1,
            'assign_id' => 1701,
            'assign_student_id' => 1801,
            'assign_activity_id' => 824,
            'status' => 'finalized',
            'attempt_no' => 1,
            'row_version' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $attempt = QuizAttempt::query()->find(9101);
        $request = Request::create('/api/quiz-runtime/attempts', 'GET');

        $list = TeacherAttemptListResource::collection(collect([$attempt]))->resolve();
        $detail = (new TeacherAttemptDetailResource([
            'attempt' => $attempt,
            'answers' => [],
            'result' => null,
            'snapshot_questions' => [],
        ]))->resolve($request);

        $this->assertSame(824, $list[0]['assign_activity_id']);
        $this->assertSame(1701, $list[0]['assign_id']);
        $this->assertSame(1801, $list[0]['assign_student_id']);
        $this->assertSame(824, $detail['attempt']['assign_activity_id']);
        $this->assertSame(1701, $detail['attempt']['assign_id']);
        $this->assertSame(1801, $detail['attempt']['assign_student_id']);
        $this->assertSame(11, $detail['attempt']['quiz_snapshot_id']);
        $this->assertNull($detail['result']);
    }

    public function test_list_and_detail_keep_a_null_assign_activity_id(): void
    {
        DB::table('quiz_attempts')->insert([
            'id' => 9102,
            'quiz_id' => 501,
            'quiz_snapshot_id' => 11,
            'student_id' => 61,
            'school_id' => 1,
            'assign_id' => 1701,
            'assign_student_id' => 1801,
            'assign_activity_id' => null,
            'status' => 'finalized',
            'attempt_no' => 1,
            'row_version' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $attempt = QuizAttempt::query()->find(9102);
        $request = Request::create('/api/quiz-runtime/attempts/9102', 'GET');

        $list = (new TeacherAttemptListResource($attempt))->resolve($request);
        $detail = (new TeacherAttemptDetailResource([
            'attempt' => $attempt,
            'answers' => [],
            'result' => null,
            'snapshot_questions' => [],
        ]))->resolve($request);

        $this->assertNull($list['assign_activity_id']);
        $this->assertSame(1701, $list['assign_id']);
        $this->assertNull($detail['attempt']['assign_activity_id']);
        $this->assertSame(1801, $detail['attempt']['assign_student_id']);
        $this->assertSame('finalized', $detail['attempt']['status']);
    }
}
