<?php

namespace Tests\Feature\Student;

use App\Models\Student;
use App\Models\StudentFriendship;
use App\Services\SmartInsight\InsightMetricsReader;
use App\Services\Student\StudentFriendshipService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Mockery;
use Tests\TestCase;
use Throwable;

class StudentFriendsApiTest extends TestCase
{
    /** @var int[] */
    private $createdFriendshipIds = [];

    protected function tearDown(): void
    {
        if ($this->createdFriendshipIds !== []) {
            try {
                StudentFriendship::query()->whereIn('id', $this->createdFriendshipIds)->delete();
            } catch (Throwable $e) {
                // ignore cleanup failures
            }
        }

        Mockery::close();
        parent::tearDown();
    }

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

    private function requireFriendshipsTable(): void
    {
        try {
            if (! Schema::hasTable('student_friendships')) {
                $this->markTestSkipped('student_friendships missing — run Phase 1 migration.');
            }
        } catch (Throwable $e) {
            $this->markTestSkipped('Database unavailable: '.$e->getMessage());
        }
    }

    /**
     * @return array{0: Student, 1: Student}|null
     */
    private function classmatePair(): ?array
    {
        $students = Student::query()
            ->where(function ($q) {
                $q->where('status', 1)->orWhere('status', '1');
            })
            ->whereNotNull('school_id')
            ->whereNotNull('class_id')
            ->where('school_id', '>', 0)
            ->where('class_id', '>', 0)
            ->orderBy('id')
            ->get(['id', 'name', 'name_ar', 'photo', 'status', 'school_id', 'class_id']);

        foreach ($students as $a) {
            foreach ($students as $b) {
                if ((int) $a->id === (int) $b->id) {
                    continue;
                }
                if ((int) $a->school_id === (int) $b->school_id
                    && (int) $a->class_id === (int) $b->class_id) {
                    return [$a, $b];
                }
            }
        }

        return null;
    }

    private function track(StudentFriendship $friendship): StudentFriendship
    {
        $this->createdFriendshipIds[] = (int) $friendship->id;

        return $friendship;
    }

    private function wipeBetween(int $a, int $b): void
    {
        StudentFriendship::query()
            ->where(function ($q) use ($a, $b) {
                $q->where(function ($inner) use ($a, $b) {
                    $inner->where('student_id', $a)->where('friend_student_id', $b);
                })->orWhere(function ($inner) use ($a, $b) {
                    $inner->where('student_id', $b)->where('friend_student_id', $a);
                });
            })
            ->delete();
    }

    public function test_unauthenticated_access_is_rejected(): void
    {
        $this->requireFriendshipsTable();

        $response = $this->withHeaders([
            'apiSecret' => $this->apiSecret(),
            'Accept' => 'application/json',
        ])->getJson('/api/student/friends');

        $response->assertStatus(401);
        $response->assertJson([
            'status' => false,
            'errNum' => 'E3001',
        ]);
    }

    public function test_authenticated_student_receives_empty_friends_list(): void
    {
        $this->requireFriendshipsTable();

        $pair = $this->classmatePair();
        if ($pair === null) {
            $this->markTestSkipped('Need two classmates in same school/class.');
        }

        [$actor] = $pair;
        StudentFriendship::query()
            ->where(function ($q) use ($actor) {
                $q->where('student_id', (int) $actor->id)
                    ->orWhere('friend_student_id', (int) $actor->id);
            })
            ->delete();

        $response = $this->withHeaders($this->studentHeaders($actor))
            ->getJson('/api/student/friends');

        $response->assertStatus(200);
        $response->assertJsonPath('status', true);
        $response->assertJsonPath('friends.available', true);
        $this->assertSame([], $response->json('friends.items'));
    }

    public function test_student_id_query_cannot_override_authenticated_identity(): void
    {
        $this->requireFriendshipsTable();

        $pair = $this->classmatePair();
        if ($pair === null) {
            $this->markTestSkipped('Need two classmates in same school/class.');
        }

        [$actor, $other] = $pair;
        $this->wipeBetween((int) $actor->id, (int) $other->id);

        $this->track(StudentFriendship::query()->create([
            'student_id' => (int) $other->id,
            'friend_student_id' => (int) $actor->id,
            'status' => StudentFriendship::STATUS_ACCEPTED,
            'school_id' => (int) $actor->school_id,
            'accepted_at' => now(),
        ]));

        // Other has actor as friend; actor listing with forged student_id must still be actor's list.
        $response = $this->withHeaders($this->studentHeaders($actor))
            ->getJson('/api/student/friends?student_id='.$other->id);

        $response->assertStatus(200);
        $items = $response->json('friends.items');
        $this->assertIsArray($items);
        $ids = array_column($items, 'student_id');
        $this->assertContains((int) $other->id, $ids);
        $this->assertNotContains((int) $actor->id, $ids);
    }

    public function test_invite_creates_pending_friendship(): void
    {
        $this->requireFriendshipsTable();

        $pair = $this->classmatePair();
        if ($pair === null) {
            $this->markTestSkipped('Need two classmates in same school/class.');
        }

        [$actor, $target] = $pair;
        $this->wipeBetween((int) $actor->id, (int) $target->id);

        $response = $this->withHeaders($this->studentHeaders($actor))
            ->postJson('/api/student/friends/invite', [
                'target_student_id' => (int) $target->id,
            ]);

        $response->assertStatus(201);
        $response->assertJsonPath('friendship.status', StudentFriendship::STATUS_PENDING);
        $response->assertJsonPath('friendship.target_student_id', (int) $target->id);

        $this->createdFriendshipIds[] = (int) $response->json('friendship.id');

        $this->assertDatabaseHas('student_friendships', [
            'id' => (int) $response->json('friendship.id'),
            'student_id' => (int) $actor->id,
            'friend_student_id' => (int) $target->id,
            'status' => StudentFriendship::STATUS_PENDING,
        ]);
    }

    public function test_self_invite_is_rejected(): void
    {
        $this->requireFriendshipsTable();

        $pair = $this->classmatePair();
        if ($pair === null) {
            $this->markTestSkipped('Need two classmates in same school/class.');
        }

        [$actor] = $pair;

        $response = $this->withHeaders($this->studentHeaders($actor))
            ->postJson('/api/student/friends/invite', [
                'target_student_id' => (int) $actor->id,
            ]);

        $response->assertStatus(400);
        $response->assertJsonPath('status', false);
    }

    public function test_nonexistent_target_is_rejected(): void
    {
        $this->requireFriendshipsTable();

        $pair = $this->classmatePair();
        if ($pair === null) {
            $this->markTestSkipped('Need two classmates in same school/class.');
        }

        [$actor] = $pair;

        $response = $this->withHeaders($this->studentHeaders($actor))
            ->postJson('/api/student/friends/invite', [
                'target_student_id' => 999999999,
            ]);

        $response->assertStatus(404);
    }

    public function test_inactive_target_is_rejected(): void
    {
        $this->requireFriendshipsTable();

        $pair = $this->classmatePair();
        if ($pair === null) {
            $this->markTestSkipped('Need two classmates in same school/class.');
        }

        [$actor, $target] = $pair;
        $this->wipeBetween((int) $actor->id, (int) $target->id);

        $originalStatus = $target->status;
        Student::query()->where('id', $target->id)->update(['status' => 0]);

        try {
            $response = $this->withHeaders($this->studentHeaders($actor))
                ->postJson('/api/student/friends/invite', [
                    'target_student_id' => (int) $target->id,
                ]);

            $response->assertStatus(400);
            $this->assertStringContainsString('not available', (string) $response->json('msg'));
        } finally {
            Student::query()->where('id', $target->id)->update(['status' => $originalStatus]);
        }
    }

    public function test_different_school_is_rejected(): void
    {
        $this->requireFriendshipsTable();

        $pair = $this->classmatePair();
        if ($pair === null) {
            $this->markTestSkipped('Need two classmates in same school/class.');
        }

        [$actor, $target] = $pair;
        $this->wipeBetween((int) $actor->id, (int) $target->id);

        $originalSchool = $target->school_id;
        $otherSchoolId = (int) (\DB::table('schools')
            ->where('id', '!=', (int) $actor->school_id)
            ->orderBy('id')
            ->value('id') ?? 0);

        $createdTempSchool = false;
        if ($otherSchoolId <= 0) {
            $otherSchoolId = (int) \DB::table('schools')->insertGetId([
                'name' => 'Temp Friends Test School',
                'contanct_number' => '000',
                'status' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $createdTempSchool = true;
        }

        Student::query()->where('id', $target->id)->update(['school_id' => $otherSchoolId]);

        try {
            $response = $this->withHeaders($this->studentHeaders($actor))
                ->postJson('/api/student/friends/invite', [
                    'target_student_id' => (int) $target->id,
                ]);

            $response->assertStatus(400);
            $this->assertStringContainsString('same school', (string) $response->json('msg'));
        } finally {
            Student::query()->where('id', $target->id)->update(['school_id' => $originalSchool]);
            if ($createdTempSchool) {
                \DB::table('schools')->where('id', $otherSchoolId)->delete();
            }
        }
    }

    public function test_different_class_same_school_is_rejected(): void
    {
        $this->requireFriendshipsTable();

        $pair = $this->classmatePair();
        if ($pair === null) {
            $this->markTestSkipped('Need two classmates in same school/class.');
        }

        [$actor, $target] = $pair;
        $this->wipeBetween((int) $actor->id, (int) $target->id);

        $originalClass = $target->class_id;
        $otherClassId = (int) (\DB::table('classes')
            ->where('id', '!=', (int) $actor->class_id)
            ->orderBy('id')
            ->value('id') ?? 0);

        $createdTempClass = false;
        if ($otherClassId <= 0) {
            $otherClassId = (int) \DB::table('classes')->insertGetId([
                'name' => 'Temp Friends Test Class',
                'num_students' => 0,
                'grade_id' => $actor->grade_id ?? null,
                'school_id' => (int) $actor->school_id,
                'status' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $createdTempClass = true;
        }

        Student::query()->where('id', $target->id)->update(['class_id' => $otherClassId]);

        try {
            $response = $this->withHeaders($this->studentHeaders($actor))
                ->postJson('/api/student/friends/invite', [
                    'target_student_id' => (int) $target->id,
                ]);

            $response->assertStatus(400);
            $this->assertStringContainsString('same class', (string) $response->json('msg'));
        } finally {
            Student::query()->where('id', $target->id)->update(['class_id' => $originalClass]);
            if ($createdTempClass) {
                \DB::table('classes')->where('id', $otherClassId)->delete();
            }
        }
    }

    public function test_duplicate_invite_is_rejected(): void
    {
        $this->requireFriendshipsTable();

        $pair = $this->classmatePair();
        if ($pair === null) {
            $this->markTestSkipped('Need two classmates in same school/class.');
        }

        [$actor, $target] = $pair;
        $this->wipeBetween((int) $actor->id, (int) $target->id);

        $first = $this->withHeaders($this->studentHeaders($actor))
            ->postJson('/api/student/friends/invite', [
                'target_student_id' => (int) $target->id,
            ]);
        $first->assertStatus(201);
        $this->createdFriendshipIds[] = (int) $first->json('friendship.id');

        $second = $this->withHeaders($this->studentHeaders($actor))
            ->postJson('/api/student/friends/invite', [
                'target_student_id' => (int) $target->id,
            ]);

        $second->assertStatus(400);
        $this->assertStringContainsString('pending', strtolower((string) $second->json('msg')));
    }

    public function test_mutual_pending_invite_is_rejected_without_second_row_m1(): void
    {
        $this->requireFriendshipsTable();

        $pair = $this->classmatePair();
        if ($pair === null) {
            $this->markTestSkipped('Need two classmates in same school/class.');
        }

        [$a, $b] = $pair;
        $this->wipeBetween((int) $a->id, (int) $b->id);

        $invite = $this->withHeaders($this->studentHeaders($a))
            ->postJson('/api/student/friends/invite', [
                'target_student_id' => (int) $b->id,
            ]);
        $invite->assertStatus(201);
        $this->createdFriendshipIds[] = (int) $invite->json('friendship.id');

        $reverse = $this->withHeaders($this->studentHeaders($b))
            ->postJson('/api/student/friends/invite', [
                'target_student_id' => (int) $a->id,
            ]);

        $reverse->assertStatus(400);
        $this->assertStringContainsString('incoming pending', strtolower((string) $reverse->json('msg')));

        $count = StudentFriendship::query()
            ->where(function ($q) use ($a, $b) {
                $q->where(function ($inner) use ($a, $b) {
                    $inner->where('student_id', $a->id)->where('friend_student_id', $b->id);
                })->orWhere(function ($inner) use ($a, $b) {
                    $inner->where('student_id', $b->id)->where('friend_student_id', $a->id);
                });
            })
            ->count();

        $this->assertSame(1, $count);
    }

    public function test_inviter_cannot_accept_own_invitation(): void
    {
        $this->requireFriendshipsTable();

        $pair = $this->classmatePair();
        if ($pair === null) {
            $this->markTestSkipped('Need two classmates in same school/class.');
        }

        [$actor, $target] = $pair;
        $this->wipeBetween((int) $actor->id, (int) $target->id);

        $invite = $this->withHeaders($this->studentHeaders($actor))
            ->postJson('/api/student/friends/invite', [
                'target_student_id' => (int) $target->id,
            ]);
        $invite->assertStatus(201);
        $id = (int) $invite->json('friendship.id');
        $this->createdFriendshipIds[] = $id;

        $accept = $this->withHeaders($this->studentHeaders($actor))
            ->postJson('/api/student/friends/'.$id.'/accept');

        $accept->assertStatus(403);
    }

    public function test_invitee_can_accept_and_accepted_at_is_set(): void
    {
        $this->requireFriendshipsTable();

        $pair = $this->classmatePair();
        if ($pair === null) {
            $this->markTestSkipped('Need two classmates in same school/class.');
        }

        [$actor, $target] = $pair;
        $this->wipeBetween((int) $actor->id, (int) $target->id);

        $invite = $this->withHeaders($this->studentHeaders($actor))
            ->postJson('/api/student/friends/invite', [
                'target_student_id' => (int) $target->id,
            ]);
        $id = (int) $invite->json('friendship.id');
        $this->createdFriendshipIds[] = $id;

        $accept = $this->withHeaders($this->studentHeaders($target))
            ->postJson('/api/student/friends/'.$id.'/accept');

        $accept->assertStatus(200);
        $accept->assertJsonPath('friendship.status', StudentFriendship::STATUS_ACCEPTED);
        $this->assertNotEmpty($accept->json('friendship.accepted_at'));

        $this->assertDatabaseHas('student_friendships', [
            'id' => $id,
            'status' => StudentFriendship::STATUS_ACCEPTED,
        ]);
        $this->assertNotNull(StudentFriendship::query()->find($id)->accepted_at);
    }

    public function test_accepted_friendship_appears_for_both_participants(): void
    {
        $this->requireFriendshipsTable();

        $pair = $this->classmatePair();
        if ($pair === null) {
            $this->markTestSkipped('Need two classmates in same school/class.');
        }

        [$a, $b] = $pair;
        $this->wipeBetween((int) $a->id, (int) $b->id);

        $invite = $this->withHeaders($this->studentHeaders($a))
            ->postJson('/api/student/friends/invite', [
                'target_student_id' => (int) $b->id,
            ]);
        $id = (int) $invite->json('friendship.id');
        $this->createdFriendshipIds[] = $id;

        $this->withHeaders($this->studentHeaders($b))
            ->postJson('/api/student/friends/'.$id.'/accept')
            ->assertStatus(200);

        $listA = $this->withHeaders($this->studentHeaders($a))->getJson('/api/student/friends');
        $listB = $this->withHeaders($this->studentHeaders($b))->getJson('/api/student/friends');

        $listA->assertStatus(200);
        $listB->assertStatus(200);

        $this->assertContains((int) $b->id, array_column($listA->json('friends.items'), 'student_id'));
        $this->assertContains((int) $a->id, array_column($listB->json('friends.items'), 'student_id'));
    }

    public function test_pending_friendship_does_not_appear_in_friends_list(): void
    {
        $this->requireFriendshipsTable();

        $pair = $this->classmatePair();
        if ($pair === null) {
            $this->markTestSkipped('Need two classmates in same school/class.');
        }

        [$a, $b] = $pair;
        $this->wipeBetween((int) $a->id, (int) $b->id);

        $invite = $this->withHeaders($this->studentHeaders($a))
            ->postJson('/api/student/friends/invite', [
                'target_student_id' => (int) $b->id,
            ]);
        $this->createdFriendshipIds[] = (int) $invite->json('friendship.id');

        $listA = $this->withHeaders($this->studentHeaders($a))->getJson('/api/student/friends');
        $listB = $this->withHeaders($this->studentHeaders($b))->getJson('/api/student/friends');

        $this->assertNotContains((int) $b->id, array_column($listA->json('friends.items') ?? [], 'student_id'));
        $this->assertNotContains((int) $a->id, array_column($listB->json('friends.items') ?? [], 'student_id'));
    }

    public function test_inviter_can_cancel_pending_invitation(): void
    {
        $this->requireFriendshipsTable();

        $pair = $this->classmatePair();
        if ($pair === null) {
            $this->markTestSkipped('Need two classmates in same school/class.');
        }

        [$a, $b] = $pair;
        $this->wipeBetween((int) $a->id, (int) $b->id);

        $invite = $this->withHeaders($this->studentHeaders($a))
            ->postJson('/api/student/friends/invite', [
                'target_student_id' => (int) $b->id,
            ]);
        $id = (int) $invite->json('friendship.id');

        $delete = $this->withHeaders($this->studentHeaders($a))
            ->deleteJson('/api/student/friends/'.$id);

        $delete->assertStatus(200);
        $this->assertDatabaseMissing('student_friendships', ['id' => $id]);
    }

    public function test_invitee_cannot_cancel_outgoing_invite(): void
    {
        $this->requireFriendshipsTable();

        $pair = $this->classmatePair();
        if ($pair === null) {
            $this->markTestSkipped('Need two classmates in same school/class.');
        }

        [$a, $b] = $pair;
        $this->wipeBetween((int) $a->id, (int) $b->id);

        $invite = $this->withHeaders($this->studentHeaders($a))
            ->postJson('/api/student/friends/invite', [
                'target_student_id' => (int) $b->id,
            ]);
        $id = (int) $invite->json('friendship.id');
        $this->createdFriendshipIds[] = $id;

        $delete = $this->withHeaders($this->studentHeaders($b))
            ->deleteJson('/api/student/friends/'.$id);

        $delete->assertStatus(403);
        $this->assertDatabaseHas('student_friendships', ['id' => $id]);
    }

    public function test_either_participant_can_unfriend_accepted(): void
    {
        $this->requireFriendshipsTable();

        $pair = $this->classmatePair();
        if ($pair === null) {
            $this->markTestSkipped('Need two classmates in same school/class.');
        }

        [$a, $b] = $pair;
        $this->wipeBetween((int) $a->id, (int) $b->id);

        $invite = $this->withHeaders($this->studentHeaders($a))
            ->postJson('/api/student/friends/invite', [
                'target_student_id' => (int) $b->id,
            ]);
        $id = (int) $invite->json('friendship.id');

        $this->withHeaders($this->studentHeaders($b))
            ->postJson('/api/student/friends/'.$id.'/accept')
            ->assertStatus(200);

        $delete = $this->withHeaders($this->studentHeaders($b))
            ->deleteJson('/api/student/friends/'.$id);

        $delete->assertStatus(200);
        $this->assertDatabaseMissing('student_friendships', ['id' => $id]);
    }

    public function test_already_friends_invite_is_rejected(): void
    {
        $this->requireFriendshipsTable();

        $pair = $this->classmatePair();
        if ($pair === null) {
            $this->markTestSkipped('Need two classmates in same school/class.');
        }

        [$a, $b] = $pair;
        $this->wipeBetween((int) $a->id, (int) $b->id);

        $row = $this->track(StudentFriendship::query()->create([
            'student_id' => (int) $a->id,
            'friend_student_id' => (int) $b->id,
            'status' => StudentFriendship::STATUS_ACCEPTED,
            'school_id' => (int) $a->school_id,
            'accepted_at' => now(),
        ]));

        $response = $this->withHeaders($this->studentHeaders($b))
            ->postJson('/api/student/friends/invite', [
                'target_student_id' => (int) $a->id,
            ]);

        $response->assertStatus(400);
        $this->assertStringContainsString('already friends', strtolower((string) $response->json('msg')));
        $this->assertSame(1, StudentFriendship::query()->where('id', $row->id)->count());
    }

    public function test_friend_limit_enforced_for_actor_and_target(): void
    {
        $this->requireFriendshipsTable();

        $pair = $this->classmatePair();
        if ($pair === null) {
            $this->markTestSkipped('Need two classmates in same school/class.');
        }

        [$a, $b] = $pair;
        $this->wipeBetween((int) $a->id, (int) $b->id);

        config(['student_friends.max_accepted' => 1]);

        // Fill actor's accepted slot with a third classmate if available; otherwise use a direct accepted row to self-class peer via temporary third id.
        $third = Student::query()
            ->where(function ($q) {
                $q->where('status', 1)->orWhere('status', '1');
            })
            ->where('school_id', (int) $a->school_id)
            ->where('class_id', (int) $a->class_id)
            ->whereNotIn('id', [(int) $a->id, (int) $b->id])
            ->orderBy('id')
            ->first();

        if ($third === null) {
            $this->markTestSkipped('Need a third classmate to fill friend limit.');
        }

        $this->wipeBetween((int) $a->id, (int) $third->id);
        $this->track(StudentFriendship::query()->create([
            'student_id' => (int) $a->id,
            'friend_student_id' => (int) $third->id,
            'status' => StudentFriendship::STATUS_ACCEPTED,
            'school_id' => (int) $a->school_id,
            'accepted_at' => now(),
        ]));

        $actorBlocked = $this->withHeaders($this->studentHeaders($a))
            ->postJson('/api/student/friends/invite', [
                'target_student_id' => (int) $b->id,
            ]);
        $actorBlocked->assertStatus(400);
        $this->assertStringContainsString('limit', strtolower((string) $actorBlocked->json('msg')));

        // Target already at limit
        $this->wipeBetween((int) $b->id, (int) $third->id);
        $this->track(StudentFriendship::query()->create([
            'student_id' => (int) $b->id,
            'friend_student_id' => (int) $third->id,
            'status' => StudentFriendship::STATUS_ACCEPTED,
            'school_id' => (int) $b->school_id,
            'accepted_at' => now(),
        ]));

        // Clear actor's limit so only target limit fires
        StudentFriendship::query()->acceptedForStudent((int) $a->id)->delete();

        $targetBlocked = $this->withHeaders($this->studentHeaders($a))
            ->postJson('/api/student/friends/invite', [
                'target_student_id' => (int) $b->id,
            ]);
        $targetBlocked->assertStatus(400);
        $this->assertStringContainsString('limit', strtolower((string) $targetBlocked->json('msg')));
    }

    public function test_list_uses_insight_metrics_reader_for_streak_and_ordering(): void
    {
        $this->requireFriendshipsTable();

        $pair = $this->classmatePair();
        if ($pair === null) {
            $this->markTestSkipped('Need two classmates in same school/class.');
        }

        [$a, $b] = $pair;

        $third = Student::query()
            ->where(function ($q) {
                $q->where('status', 1)->orWhere('status', '1');
            })
            ->where('school_id', (int) $a->school_id)
            ->where('class_id', (int) $a->class_id)
            ->whereNotIn('id', [(int) $a->id, (int) $b->id])
            ->orderBy('id')
            ->first();

        if ($third === null) {
            $this->markTestSkipped('Need a third classmate for ordering test.');
        }

        $this->wipeBetween((int) $a->id, (int) $b->id);
        $this->wipeBetween((int) $a->id, (int) $third->id);

        $this->track(StudentFriendship::query()->create([
            'student_id' => (int) $a->id,
            'friend_student_id' => (int) $b->id,
            'status' => StudentFriendship::STATUS_ACCEPTED,
            'school_id' => (int) $a->school_id,
            'accepted_at' => now(),
        ]));
        $this->track(StudentFriendship::query()->create([
            'student_id' => (int) $a->id,
            'friend_student_id' => (int) $third->id,
            'status' => StudentFriendship::STATUS_ACCEPTED,
            'school_id' => (int) $a->school_id,
            'accepted_at' => now(),
        ]));

        $reader = Mockery::mock(InsightMetricsReader::class);
        $reader->shouldReceive('streakPayloadForStudent')
            ->andReturnUsing(function (int $studentId) use ($b, $third) {
                if ($studentId === (int) $third->id) {
                    return [
                        'has_learning_behaviour_data' => true,
                        'current_streak' => 5,
                        'longest_streak' => 5,
                    ];
                }

                if ($studentId === (int) $b->id) {
                    return [
                        'has_learning_behaviour_data' => true,
                        'current_streak' => 0,
                        'longest_streak' => 0,
                    ];
                }

                return [
                    'has_learning_behaviour_data' => false,
                    'current_streak' => 0,
                    'longest_streak' => 0,
                ];
            });

        $this->app->instance(InsightMetricsReader::class, $reader);

        /** @var StudentFriendshipService $service */
        $service = $this->app->make(StudentFriendshipService::class);
        $payload = $service->listAcceptedFriends($a);

        $this->assertTrue($payload['available']);
        $this->assertGreaterThanOrEqual(2, count($payload['items']));
        $this->assertSame((int) $third->id, (int) $payload['items'][0]['student_id']);
        $this->assertSame(5, (int) $payload['items'][0]['current_streak']);
        $this->assertTrue($payload['items'][0]['streak_active']);

        $zeroFriend = collect($payload['items'])->firstWhere('student_id', (int) $b->id);
        $this->assertNotNull($zeroFriend);
        $this->assertSame(0, (int) $zeroFriend['current_streak']);
        $this->assertFalse($zeroFriend['streak_active']);

        foreach ($payload['items'] as $item) {
            $this->assertArrayNotHasKey('rank', $item);
            $this->assertArrayNotHasKey('weekly_xp', $item);
            $this->assertArrayNotHasKey('score_percent', $item);
            $this->assertArrayHasKey('current_streak', $item);
            $this->assertArrayHasKey('streak_active', $item);
        }
    }
}
