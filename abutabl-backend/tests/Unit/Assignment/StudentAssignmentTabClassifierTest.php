<?php

namespace Tests\Unit\Assignment;

use App\Support\Assignment\StudentAssignmentTabClassifier;
use Carbon\Carbon;
use Tests\TestCase;

/**
 * Tab classification — COMPLETE = graded only; waiting stays in TO DO.
 */
class StudentAssignmentTabClassifierTest extends TestCase
{
    public function test_matrix_matches_product_rules(): void
    {
        $now = Carbon::parse('2026-09-09 12:00:00', 'UTC');

        $cases = [
            // active + before due → TO DO
            ['status' => 'active', 'due' => '2026-09-10 12:00:00', 'expect' => 'todo'],
            // active + after due → PAST DUE (expired & unsubmitted)
            ['status' => 'active', 'due' => '2026-09-08 12:00:00', 'expect' => 'past_due'],
            // submitted + before due → TO DO (waiting on teacher)
            ['status' => 'submitted', 'due' => '2026-09-10 12:00:00', 'expect' => 'todo'],
            // submitted + after due → TO DO (still waiting; not PAST DUE / not COMPLETE)
            ['status' => 'submitted', 'due' => '2026-09-08 12:00:00', 'expect' => 'todo'],
            // graded + before due → COMPLETE
            ['status' => 'graded', 'due' => '2026-09-10 12:00:00', 'expect' => 'completed'],
            // graded + after due → COMPLETE
            ['status' => 'graded', 'due' => '2026-09-08 12:00:00', 'expect' => 'completed'],
            // REDO-shaped active after due → PAST DUE
            ['status' => 'active', 'due' => '2026-09-01 12:00:00', 'expect' => 'past_due'],
            // due_at null + active → TO DO
            ['status' => 'active', 'due' => null, 'expect' => 'todo'],
            // due_at null + submitted → TO DO (waiting)
            ['status' => 'submitted', 'due' => null, 'expect' => 'todo'],
            // due_at null + graded → COMPLETE
            ['status' => 'graded', 'due' => null, 'expect' => 'completed'],
            // exact boundary: due_at == now is NOT past (strict lt)
            ['status' => 'active', 'due' => '2026-09-09 12:00:00', 'expect' => 'todo'],
            // one second past due → PAST DUE
            ['status' => 'active', 'due' => '2026-09-09 11:59:59', 'expect' => 'past_due'],
        ];

        foreach ($cases as $i => $case) {
            $due = $case['due'] === null ? null : Carbon::parse($case['due'], 'UTC');
            $actual = StudentAssignmentTabClassifier::classify(
                (string) $case['status'],
                $due,
                $now
            );
            $this->assertSame(
                $case['expect'],
                $actual,
                "case {$i} expected {$case['expect']}, got {$actual}"
            );
        }
    }

    public function test_classify_from_flags_matches_status_matrix(): void
    {
        $now = Carbon::parse('2026-09-09 12:00:00', 'UTC');
        $future = Carbon::parse('2026-09-10 12:00:00', 'UTC');
        $past = Carbon::parse('2026-09-08 12:00:00', 'UTC');

        $this->assertSame(
            'completed',
            StudentAssignmentTabClassifier::classifyFromFlags(true, true, $past, $now)
        );
        $this->assertSame(
            'todo',
            StudentAssignmentTabClassifier::classifyFromFlags(false, true, $past, $now)
        );
        $this->assertSame(
            'past_due',
            StudentAssignmentTabClassifier::classifyFromFlags(false, false, $past, $now)
        );
        $this->assertSame(
            'todo',
            StudentAssignmentTabClassifier::classifyFromFlags(false, false, $future, $now)
        );
    }

    public function test_constants(): void
    {
        $this->assertSame('todo', StudentAssignmentTabClassifier::TAB_TODO);
        $this->assertSame('past_due', StudentAssignmentTabClassifier::TAB_PAST_DUE);
        $this->assertSame('completed', StudentAssignmentTabClassifier::TAB_COMPLETED);
    }
}
