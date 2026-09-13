<?php

namespace Tests\Unit\Student;

use App\Models\Student;
use App\Models\StudentFriendship;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Schema;
use InvalidArgumentException;
use Tests\TestCase;
use Throwable;

class StudentFriendshipInfrastructureTest extends TestCase
{
    protected function tearDown(): void
    {
        try {
            if (Schema::hasTable('student_friendships')) {
                StudentFriendship::query()->delete();
            }
        } catch (Throwable $e) {
            // Database may be unavailable in CI/local teardown.
        }

        parent::tearDown();
    }

    private function requireFriendshipsTable(): void
    {
        try {
            if (! Schema::hasTable('student_friendships')) {
                $this->markTestSkipped('student_friendships missing — run migrations.');
            }
        } catch (Throwable $e) {
            $this->markTestSkipped('Database unavailable: '.$e->getMessage());
        }
    }

    /**
     * @return array{0: Student, 1: Student}
     */
    private function twoDistinctStudents(): array
    {
        $students = Student::query()
            ->where(function ($q) {
                $q->where('status', 1)->orWhere('status', '1');
            })
            ->orderBy('id')
            ->limit(2)
            ->get(['id', 'school_id']);

        if ($students->count() < 2) {
            $this->markTestSkipped('Need at least two active students.');
        }

        return [$students[0], $students[1]];
    }

    public function test_migration_schema_exists_with_expected_columns(): void
    {
        $this->requireFriendshipsTable();

        foreach ([
            'id',
            'student_id',
            'friend_student_id',
            'status',
            'school_id',
            'accepted_at',
            'created_at',
            'updated_at',
        ] as $column) {
            $this->assertTrue(
                Schema::hasColumn('student_friendships', $column),
                "Missing column: {$column}"
            );
        }
    }

    public function test_unique_and_status_indexes_exist(): void
    {
        $this->requireFriendshipsTable();

        $indexes = collect(\DB::select('SHOW INDEX FROM student_friendships'));

        $this->assertNotNull($indexes->first(fn ($idx) => $idx->Key_name === 'student_friendships_directed_unique'));
        $this->assertNotNull($indexes->first(fn ($idx) => $idx->Key_name === 'student_friendships_friend_status_idx'));
        $this->assertNotNull($indexes->first(fn ($idx) => $idx->Key_name === 'student_friendships_student_status_idx'));
        $this->assertNotNull($indexes->first(fn ($idx) => $idx->Key_name === 'student_friendships_school_status_idx'));
    }

    public function test_valid_pending_and_accepted_relationships_can_be_stored(): void
    {
        $this->requireFriendshipsTable();

        [$inviter, $invitee] = $this->twoDistinctStudents();
        $schoolId = (int) ($inviter->school_id ?? $invitee->school_id ?? 0);
        if ($schoolId <= 0) {
            $this->markTestSkipped('Students missing school_id.');
        }

        $pending = StudentFriendship::query()->create([
            'student_id' => (int) $inviter->id,
            'friend_student_id' => (int) $invitee->id,
            'status' => StudentFriendship::STATUS_PENDING,
            'school_id' => $schoolId,
        ]);

        $this->assertSame(StudentFriendship::STATUS_PENDING, $pending->status);
        $this->assertNull($pending->accepted_at);

        $accepted = StudentFriendship::query()->create([
            'student_id' => (int) $invitee->id,
            'friend_student_id' => (int) $inviter->id,
            'status' => StudentFriendship::STATUS_ACCEPTED,
            'school_id' => $schoolId,
            'accepted_at' => now(),
        ]);

        $this->assertSame(StudentFriendship::STATUS_ACCEPTED, $accepted->status);
        $this->assertNotNull($accepted->accepted_at);
        $this->assertDatabaseHas('student_friendships', [
            'id' => $pending->id,
            'status' => StudentFriendship::STATUS_PENDING,
        ]);
    }

    public function test_self_friendship_is_rejected_by_model(): void
    {
        $this->requireFriendshipsTable();

        $student = Student::query()->orderBy('id')->first();
        if ($student === null) {
            $this->markTestSkipped('No students available.');
        }

        $schoolId = (int) ($student->school_id ?? 0);
        if ($schoolId <= 0) {
            $this->markTestSkipped('Student missing school_id.');
        }

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('cannot befriend themselves');

        StudentFriendship::query()->create([
            'student_id' => (int) $student->id,
            'friend_student_id' => (int) $student->id,
            'status' => StudentFriendship::STATUS_PENDING,
            'school_id' => $schoolId,
        ]);
    }

    public function test_duplicate_directed_relationship_is_rejected(): void
    {
        $this->requireFriendshipsTable();

        [$inviter, $invitee] = $this->twoDistinctStudents();
        $schoolId = (int) ($inviter->school_id ?? $invitee->school_id ?? 0);
        if ($schoolId <= 0) {
            $this->markTestSkipped('Students missing school_id.');
        }

        StudentFriendship::query()->create([
            'student_id' => (int) $inviter->id,
            'friend_student_id' => (int) $invitee->id,
            'status' => StudentFriendship::STATUS_PENDING,
            'school_id' => $schoolId,
        ]);

        $this->expectException(QueryException::class);

        StudentFriendship::query()->create([
            'student_id' => (int) $inviter->id,
            'friend_student_id' => (int) $invitee->id,
            'status' => StudentFriendship::STATUS_PENDING,
            'school_id' => $schoolId,
        ]);
    }

    public function test_invalid_status_is_rejected_by_model(): void
    {
        $this->requireFriendshipsTable();

        [$inviter, $invitee] = $this->twoDistinctStudents();
        $schoolId = (int) ($inviter->school_id ?? $invitee->school_id ?? 0);
        if ($schoolId <= 0) {
            $this->markTestSkipped('Students missing school_id.');
        }

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Invalid friendship status');

        StudentFriendship::query()->create([
            'student_id' => (int) $inviter->id,
            'friend_student_id' => (int) $invitee->id,
            'status' => 'blocked',
            'school_id' => $schoolId,
        ]);
    }

    public function test_status_constants_are_valid(): void
    {
        $this->assertTrue(StudentFriendship::isValidStatus(StudentFriendship::STATUS_PENDING));
        $this->assertTrue(StudentFriendship::isValidStatus(StudentFriendship::STATUS_ACCEPTED));
        $this->assertFalse(StudentFriendship::isValidStatus('declined'));
        $this->assertFalse(StudentFriendship::isValidStatus('blocked'));
    }

    public function test_foreign_keys_reject_invalid_student_or_school(): void
    {
        $this->requireFriendshipsTable();

        [$inviter, $invitee] = $this->twoDistinctStudents();
        $schoolId = (int) ($inviter->school_id ?? $invitee->school_id ?? 0);
        if ($schoolId <= 0) {
            $this->markTestSkipped('Students missing school_id.');
        }

        $this->expectException(QueryException::class);

        StudentFriendship::query()->create([
            'student_id' => (int) $inviter->id,
            'friend_student_id' => 999999999,
            'status' => StudentFriendship::STATUS_PENDING,
            'school_id' => $schoolId,
        ]);
    }

    public function test_scopes_filter_accepted_and_pending_directionally(): void
    {
        $this->requireFriendshipsTable();

        [$inviter, $invitee] = $this->twoDistinctStudents();
        $schoolId = (int) ($inviter->school_id ?? $invitee->school_id ?? 0);
        if ($schoolId <= 0) {
            $this->markTestSkipped('Students missing school_id.');
        }

        StudentFriendship::query()->create([
            'student_id' => (int) $inviter->id,
            'friend_student_id' => (int) $invitee->id,
            'status' => StudentFriendship::STATUS_PENDING,
            'school_id' => $schoolId,
        ]);

        StudentFriendship::query()->create([
            'student_id' => (int) $invitee->id,
            'friend_student_id' => (int) $inviter->id,
            'status' => StudentFriendship::STATUS_ACCEPTED,
            'school_id' => $schoolId,
            'accepted_at' => now(),
        ]);

        $this->assertSame(1, StudentFriendship::query()->pendingOutgoingForStudent((int) $inviter->id)->count());
        $this->assertSame(1, StudentFriendship::query()->pendingIncomingForStudent((int) $invitee->id)->count());
        $this->assertSame(0, StudentFriendship::query()->pendingIncomingForStudent((int) $inviter->id)->count());

        $acceptedForInviter = StudentFriendship::query()
            ->acceptedForStudent((int) $inviter->id)
            ->pluck('id')
            ->all();
        $this->assertCount(1, $acceptedForInviter);
    }

    public function test_model_relationships_resolve(): void
    {
        $this->requireFriendshipsTable();

        [$inviter, $invitee] = $this->twoDistinctStudents();
        $schoolId = (int) ($inviter->school_id ?? $invitee->school_id ?? 0);
        if ($schoolId <= 0) {
            $this->markTestSkipped('Students missing school_id.');
        }

        $friendship = StudentFriendship::query()->create([
            'student_id' => (int) $inviter->id,
            'friend_student_id' => (int) $invitee->id,
            'status' => StudentFriendship::STATUS_PENDING,
            'school_id' => $schoolId,
        ]);

        $friendship->load(['student', 'friendStudent', 'school']);

        $this->assertSame((int) $inviter->id, (int) $friendship->student->id);
        $this->assertSame((int) $invitee->id, (int) $friendship->friendStudent->id);
        $this->assertSame($schoolId, (int) $friendship->school->id);
    }
}
