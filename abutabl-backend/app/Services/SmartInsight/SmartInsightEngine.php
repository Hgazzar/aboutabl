<?php

namespace App\Services\SmartInsight;

use App\Contracts\InsightRuleInterface;
use Throwable;

/**
 * Aggregates isolated insight rules into a deduplicated, conflict-resolved list.
 */
class SmartInsightEngine
{
    /** @var InsightRuleRegistry */
    private $registry;

    public function __construct(InsightRuleRegistry $registry)
    {
        $this->registry = $registry;
    }

    /**
     * @param  array<string, mixed>  $context
     * @return array<int, array<string, mixed>>
     */
    public function generate(array $context): array
    {
        $insights = [];

        foreach ($this->registry->all() as $rule) {
            if (! $rule instanceof InsightRuleInterface) {
                continue;
            }

            try {
                $insight = $rule->evaluate($context);
            } catch (Throwable $e) {
                // One failing rule must never stop the others.
                continue;
            }

            if ($insight === null) {
                continue;
            }

            $id = (string) ($insight['id'] ?? '');
            if ($id === '' || isset($insights[$id])) {
                continue;
            }

            $insights[$id] = $insight;
        }

        $resolved = $this->resolveConflicts(array_values($insights));

        usort($resolved, function (array $a, array $b) {
            $pa = (int) ($a['priority'] ?? 100);
            $pb = (int) ($b['priority'] ?? 100);
            if ($pa === $pb) {
                return strcmp((string) ($a['id'] ?? ''), (string) ($b['id'] ?? ''));
            }

            return $pa <=> $pb;
        });

        $max = (int) ($context['config']['engine']['max_insights'] ?? 0);
        // max_insights <= 0 means unlimited (F-039 presentation limits apply later).
        if ($max > 0) {
            $resolved = array_slice($resolved, 0, $max);
        }

        return array_values($resolved);
    }

    /**
     * @param  array<int, array<string, mixed>>  $insights
     * @return array<int, array<string, mixed>>
     */
    private function resolveConflicts(array $insights): array
    {
        $byId = [];
        foreach ($insights as $insight) {
            $byId[(string) $insight['id']] = $insight;
        }

        // Outstanding supersedes high_progress.
        if (isset($byId['outstanding_student'])) {
            unset($byId['high_progress']);
        }

        // Progress level band — mutually exclusive (keep most urgent).
        $this->keepBestOfGroup($byId, [
            'no_progress',
            'low_progress',
            'medium_progress',
            'high_progress',
        ]);

        // Progress pace band.
        $this->keepBestOfGroup($byId, [
            'fast_progress',
            'slow_progress',
        ]);

        // Progress trend band.
        $this->keepBestOfGroup($byId, [
            'progress_improvement',
            'progress_regression',
        ]);

        // Performance level band (F-037B).
        $this->keepBestOfGroup($byId, [
            'weak_performance',
            'average_performance',
            'excellent_performance',
        ]);

        // Performance trend / pace — one winner (most urgent).
        $this->keepBestOfGroup($byId, [
            'performance_decline',
            'performance_declining',
            'rapid_improvement',
            'performance_improving',
        ]);

        // Standards level band (F-037C).
        $this->keepBestOfGroup($byId, [
            'weak_standards',
            'strong_standards',
        ]);

        // Standards gap vs improvement — mutually exclusive.
        $this->keepBestOfGroup($byId, [
            'standards_gap',
            'standards_improvement',
        ]);

        // Assessment accuracy band (F-037D).
        $this->keepBestOfGroup($byId, [
            'low_quiz_accuracy',
            'high_quiz_accuracy',
        ]);

        // Assessment outcome streaks — mutually exclusive.
        $this->keepBestOfGroup($byId, [
            'repeated_failures',
            'repeated_success',
        ]);

        // Assessment improvement vs repeated failures.
        $this->keepBestOfGroup($byId, [
            'repeated_failures',
            'quiz_improvement',
        ]);

        // Learning behaviour engagement band (F-037E).
        $this->keepBestOfGroup($byId, [
            'low_engagement',
            'excellent_engagement',
        ]);

        // Returning vs inactive — mutually exclusive.
        $this->keepBestOfGroup($byId, [
            'returning_student',
            'inactive_student',
        ]);

        // Learning pattern consistency — mutually exclusive.
        $this->keepBestOfGroup($byId, [
            'irregular_learning_pattern',
            'consistent_learning_pattern',
        ]);

        // Educational risk level band (F-037F) — mutually exclusive.
        $this->keepBestOfGroup($byId, [
            'critical_risk',
            'high_risk',
            'at_risk',
        ]);

        // Critical risk supersedes celebratory achievement bands (contradictory UX).
        if (isset($byId['critical_risk'])) {
            unset(
                $byId['learning_excellence'],
                $byId['outstanding_student'],
                $byId['high_achiever'],
                $byId['top_performer'],
                $byId['consistent_excellence']
            );
        }

        // Achievement level band (F-037G) — mutually exclusive; excellence supersedes outstanding_student.
        $this->keepBestOfGroup($byId, [
            'learning_excellence',
            'outstanding_student',
            'high_achiever',
        ]);

        // Fast learner vs fast progress — complementary but avoid duplicate pace messaging.
        $this->keepBestOfGroup($byId, [
            'fast_learner',
            'fast_progress',
        ]);

        return array_values($byId);
    }

    /**
     * @param  array<string, array<string, mixed>>  $byId
     * @param  string[]  $groupIds
     */
    private function keepBestOfGroup(array &$byId, array $groupIds): void
    {
        $present = [];
        foreach ($groupIds as $id) {
            if (isset($byId[$id])) {
                $present[] = $byId[$id];
            }
        }

        if (count($present) <= 1) {
            return;
        }

        usort($present, function (array $a, array $b) {
            return ((int) ($a['priority'] ?? 100)) <=> ((int) ($b['priority'] ?? 100));
        });

        $winnerId = (string) $present[0]['id'];
        foreach ($groupIds as $id) {
            if ($id !== $winnerId) {
                unset($byId[$id]);
            }
        }
    }
}
