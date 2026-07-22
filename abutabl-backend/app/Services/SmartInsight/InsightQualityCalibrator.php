<?php

namespace App\Services\SmartInsight;

/**
 * F-039 — Read-only quality calibration & executive intelligence.
 * Operates ONLY on existing rule outputs. Never invents insights or writes data.
 */
class InsightQualityCalibrator
{
    public const CATEGORY_ORDER = [
        'risk',
        'progress',
        'performance',
        'assessment',
        'standards',
        'learning_behaviour',
        'achievement',
    ];

    public const PRIORITY_ORDER = [
        'Critical' => 0,
        'High' => 1,
        'Medium' => 2,
        'Low' => 3,
        'Info' => 4,
    ];

    private const MAX_VISIBLE_PER_CATEGORY = 5;

    private function maxVisiblePerCategory(): int
    {
        $configured = (int) config('smart_insight.engine.max_visible_per_category', self::MAX_VISIBLE_PER_CATEGORY);

        return $configured > 0 ? $configured : self::MAX_VISIBLE_PER_CATEGORY;
    }

    /** Presentation merge groups (rules stay independent; presentation only). */
    private const PRESENTATION_GROUPS = [
        'executive_risk' => [
            'label' => 'Executive Risk Focus',
            'ids' => [
                'critical_risk',
                'high_risk',
                'at_risk',
                'dropout_risk',
                'intervention_required',
            ],
        ],
        'executive_achievement' => [
            'label' => 'Executive Achievement',
            'ids' => [
                'learning_excellence',
                'outstanding_student',
                'high_achiever',
                'top_performer',
                'fast_learner',
                'high_progress',
                'consistent_excellence',
                'milestone_achieved',
                'outstanding_improvement',
                'subject_mastery',
            ],
        ],
        'executive_performance' => [
            'label' => 'Executive Performance',
            'ids' => [
                'excellent_performance',
                'weak_performance',
                'average_performance',
                'rapid_improvement',
                'performance_decline',
                'performance_declining',
                'performance_improving',
                'inconsistent_performance',
            ],
        ],
    ];

    /**
     * @param  array<int, array<string, mixed>>  $insights
     * @return array{
     *   insights: array<int, array<string, mixed>>,
     *   text: string|null,
     *   executive_summary: array<string, mixed>,
     *   executive_score: float,
     *   executive_level: string,
     *   executive_confidence: float,
     *   categories: array<int, array<string, mixed>>,
     *   recommendations: array<int, array<string, mixed>>,
     *   presentation_sections: array<int, array<string, mixed>>
     * }
     */
    public function calibrate(array $insights): array
    {
        $calibrated = [];
        foreach ($insights as $insight) {
            if (! is_array($insight) || (string) ($insight['id'] ?? '') === '') {
                continue;
            }
            $calibrated[] = $this->calibrateInsight($insight);
        }

        $calibrated = $this->dedupeInsightsById($calibrated);
        usort($calibrated, [$this, 'compareInsights']);

        $categories = $this->buildCategories($calibrated);
        $recommendations = $this->dedupeRecommendations($calibrated);
        $sections = $this->buildPresentationSections($calibrated);
        $summary = $this->buildExecutiveSummary($calibrated, $recommendations);
        $scorePayload = $this->buildExecutiveScore($calibrated);

        $text = $this->composeExecutiveText($summary);

        return [
            'insights' => array_values($calibrated),
            'text' => $text,
            'executive_summary' => $summary,
            'executive_score' => $scorePayload['executive_score'],
            'executive_level' => $scorePayload['executive_level'],
            'executive_confidence' => $scorePayload['executive_confidence'],
            'categories' => $categories,
            'recommendations' => $recommendations,
            'presentation_sections' => $sections,
        ];
    }

    /**
     * @param  array<string, mixed>  $insight
     * @return array<string, mixed>
     */
    private function calibrateInsight(array $insight): array
    {
        $priorityLabel = $this->normalizePriority($insight);
        $confidence = $this->normalizeConfidence($insight['confidence'] ?? null);

        $insight['priority'] = $priorityLabel;
        $insight['priority_rank'] = self::PRIORITY_ORDER[$priorityLabel];
        if ($confidence !== null) {
            $insight['confidence'] = $confidence;
        }

        if (isset($insight['recommendations']) && is_array($insight['recommendations'])) {
            $insight['recommendations'] = array_values(array_map(function ($row) {
                if (! is_array($row)) {
                    return $row;
                }
                if (array_key_exists('priority', $row)) {
                    $row['priority'] = $this->normalizePriorityLabelOrNumeric($row['priority'], $row['category'] ?? null);
                }
                if (array_key_exists('confidence', $row)) {
                    $c = $this->normalizeConfidence($row['confidence']);
                    if ($c !== null) {
                        $row['confidence'] = $c;
                    }
                }

                return $row;
            }, $insight['recommendations']));
        }

        return $insight;
    }

    /**
     * @param  array<string, mixed>  $insight
     */
    private function normalizePriority(array $insight): string
    {
        if (isset($insight['priority']) && is_string($insight['priority'])) {
            $mapped = $this->mapPriorityToken($insight['priority']);
            if ($mapped !== null) {
                return $mapped;
            }
        }

        $severity = strtolower((string) ($insight['severity'] ?? ''));
        $category = strtolower((string) ($insight['category'] ?? ''));
        $numeric = is_numeric($insight['priority'] ?? null)
            ? (int) $insight['priority']
            : 100;

        if ($severity === 'critical' || ($category === 'risk' && $numeric <= 10)) {
            return 'Critical';
        }
        if ($severity === 'warning' || ($category === 'risk' && $numeric <= 20)) {
            return 'High';
        }
        if ($severity === 'info') {
            return 'Info';
        }
        if ($severity === 'success') {
            return $numeric <= 15 ? 'Medium' : 'Low';
        }

        return $this->normalizePriorityLabelOrNumeric($insight['priority'] ?? $numeric, $category);
    }

    /**
     * @param  mixed  $priority
     */
    private function normalizePriorityLabelOrNumeric($priority, $category = null): string
    {
        if (is_string($priority)) {
            $mapped = $this->mapPriorityToken($priority);
            if ($mapped !== null) {
                return $mapped;
            }
        }

        $numeric = is_numeric($priority) ? (int) $priority : 100;
        if ($numeric <= 10) {
            return 'Critical';
        }
        if ($numeric <= 25) {
            return 'High';
        }
        if ($numeric <= 40) {
            return 'Medium';
        }
        if ($numeric <= 55) {
            return 'Low';
        }

        return 'Info';
    }

    private function mapPriorityToken(string $token): ?string
    {
        $t = strtolower(trim($token));
        $map = [
            'critical' => 'Critical',
            'high' => 'High',
            'medium' => 'Medium',
            'med' => 'Medium',
            'low' => 'Low',
            'info' => 'Info',
            'informational' => 'Info',
        ];

        return $map[$t] ?? null;
    }

    /**
     * @param  mixed  $value
     */
    private function normalizeConfidence($value): ?float
    {
        if ($value === null || $value === '') {
            return null;
        }
        if (! is_numeric($value)) {
            return null;
        }
        $n = (float) $value;
        // Percentages are typically >= 10; values like 1.2 are overflow on the 0..1 scale.
        if ($n > 1.0 && $n <= 100.0 && $n >= 10.0) {
            $n = $n / 100.0;
        }

        return round(max(0.0, min(1.0, $n)), 2);
    }

    /**
     * @param  array<int, array<string, mixed>>  $insights
     * @return array<int, array<string, mixed>>
     */
    private function dedupeInsightsById(array $insights): array
    {
        $byId = [];
        foreach ($insights as $insight) {
            $id = (string) $insight['id'];
            if (! isset($byId[$id])) {
                $byId[$id] = $insight;
            }
        }

        return array_values($byId);
    }

    /**
     * @param  array<string, mixed>  $a
     * @param  array<string, mixed>  $b
     */
    private function compareInsights(array $a, array $b): int
    {
        $pa = (int) ($a['priority_rank'] ?? 99);
        $pb = (int) ($b['priority_rank'] ?? 99);
        if ($pa !== $pb) {
            return $pa <=> $pb;
        }

        $ca = $this->categoryRank((string) ($a['category'] ?? ''));
        $cb = $this->categoryRank((string) ($b['category'] ?? ''));
        if ($ca !== $cb) {
            return $ca <=> $cb;
        }

        return strcmp((string) ($a['id'] ?? ''), (string) ($b['id'] ?? ''));
    }

    private function categoryRank(string $category): int
    {
        $idx = array_search($category, self::CATEGORY_ORDER, true);

        return $idx === false ? 100 : (int) $idx;
    }

    /**
     * @param  array<int, array<string, mixed>>  $insights
     * @return array<int, array<string, mixed>>
     */
    private function buildCategories(array $insights): array
    {
        $grouped = [];
        foreach ($insights as $insight) {
            $cat = (string) ($insight['category'] ?? 'general');
            if ($cat === '') {
                $cat = 'general';
            }
            if (! isset($grouped[$cat])) {
                $grouped[$cat] = [];
            }
            $grouped[$cat][] = $insight;
        }

        $out = [];
        foreach (self::CATEGORY_ORDER as $cat) {
            if (! isset($grouped[$cat]) || $grouped[$cat] === []) {
                continue;
            }
            $all = $grouped[$cat];
            $limit = $this->maxVisiblePerCategory();
            $visible = array_slice($all, 0, $limit);
            $collapsed = array_slice($all, $limit);
            $collapsedCount = count($collapsed);
            $out[] = [
                'category' => $cat,
                'insights' => array_values($all),
                'visible' => array_values($visible),
                'collapsed' => array_values($collapsed),
                'collapsed_count' => $collapsedCount,
                'more_label' => $collapsedCount > 0 ? '+ '.$collapsedCount.' More' : null,
            ];
            unset($grouped[$cat]);
        }

        // Preserve unexpected categories after the fixed order (should be rare post F-038).
        foreach ($grouped as $cat => $all) {
            if ($all === []) {
                continue;
            }
            $visible = array_slice($all, 0, $this->maxVisiblePerCategory());
            $collapsed = array_slice($all, $this->maxVisiblePerCategory());
            $collapsedCount = count($collapsed);
            $out[] = [
                'category' => $cat,
                'insights' => array_values($all),
                'visible' => array_values($visible),
                'collapsed' => array_values($collapsed),
                'collapsed_count' => $collapsedCount,
                'more_label' => $collapsedCount > 0 ? '+ '.$collapsedCount.' More' : null,
            ];
        }

        return $out;
    }

    /**
     * @param  array<int, array<string, mixed>>  $insights
     * @return array<int, array<string, mixed>>
     */
    private function dedupeRecommendations(array $insights): array
    {
        $rows = [];
        $seen = [];

        foreach ($insights as $insight) {
            $category = (string) ($insight['category'] ?? 'general');
            $priority = (string) ($insight['priority'] ?? 'Info');
            $recs = $insight['recommendations'] ?? null;

            if (is_array($recs) && $recs !== []) {
                foreach ($recs as $rec) {
                    if (! is_array($rec)) {
                        continue;
                    }
                    $title = trim((string) ($rec['title'] ?? ''));
                    $description = trim((string) ($rec['description'] ?? ''));
                    $action = trim((string) ($rec['action_type'] ?? ''));
                    if ($title === '' && $description === '') {
                        continue;
                    }
                    $key = strtolower($action.'|'.$title.'|'.$description);
                    if ($key === '||' || isset($seen[$key])) {
                        continue;
                    }
                    $seen[$key] = true;
                    $rows[] = array_merge($rec, [
                        'title' => $title !== '' ? $title : $description,
                        'description' => $description !== '' ? $description : $title,
                        'category' => (string) ($rec['category'] ?? $category),
                        'priority' => $this->normalizePriorityLabelOrNumeric(
                            $rec['priority'] ?? $priority,
                            $rec['category'] ?? $category
                        ),
                        'source_insight_id' => (string) ($insight['id'] ?? ''),
                    ]);
                }
                continue;
            }

            $legacy = trim((string) ($insight['recommendation'] ?? ''));
            if ($legacy === '') {
                continue;
            }
            $key = strtolower('legacy|'.$legacy);
            if (isset($seen[$key])) {
                continue;
            }
            $seen[$key] = true;
            $rows[] = [
                'title' => (string) ($insight['title'] ?? 'Recommendation'),
                'description' => $legacy,
                'priority' => $priority,
                'category' => $category,
                'action_type' => 'follow_recommendation',
                'target_type' => 'student',
                'target_id' => null,
                'source_insight_id' => (string) ($insight['id'] ?? ''),
            ];
        }

        usort($rows, function (array $a, array $b) {
            $pa = self::PRIORITY_ORDER[$a['priority'] ?? 'Info'] ?? 99;
            $pb = self::PRIORITY_ORDER[$b['priority'] ?? 'Info'] ?? 99;
            if ($pa !== $pb) {
                return $pa <=> $pb;
            }
            $ca = $this->categoryRank((string) ($a['category'] ?? ''));
            $cb = $this->categoryRank((string) ($b['category'] ?? ''));
            if ($ca !== $cb) {
                return $ca <=> $cb;
            }

            return strcmp((string) ($a['title'] ?? ''), (string) ($b['title'] ?? ''));
        });

        return array_values($rows);
    }

    /**
     * @param  array<int, array<string, mixed>>  $insights
     * @return array<int, array<string, mixed>>
     */
    private function buildPresentationSections(array $insights): array
    {
        $byId = [];
        foreach ($insights as $insight) {
            $byId[(string) $insight['id']] = $insight;
        }

        $sections = [];
        $claimed = [];

        foreach (self::PRESENTATION_GROUPS as $sectionId => $meta) {
            $members = [];
            foreach ($meta['ids'] as $id) {
                if (! isset($byId[$id]) || isset($claimed[$id])) {
                    continue;
                }
                $members[] = $byId[$id];
                $claimed[$id] = true;
            }
            if (count($members) < 2) {
                // Keep singles in category accordion only; section is for overlap merge.
                foreach ($members as $m) {
                    unset($claimed[(string) $m['id']]);
                }
                continue;
            }

            usort($members, [$this, 'compareInsights']);
            $lead = $members[0];
            $titles = [];
            foreach ($members as $m) {
                $t = trim((string) ($m['title'] ?? ''));
                if ($t !== '' && ! in_array($t, $titles, true)) {
                    $titles[] = $t;
                }
            }

            $sections[] = [
                'id' => $sectionId,
                'title' => $meta['label'],
                'insight_ids' => array_values(array_map(function ($m) {
                    return (string) $m['id'];
                }, $members)),
                'lead_insight_id' => (string) ($lead['id'] ?? ''),
                'summary' => $this->joinUnique([
                    (string) ($lead['description'] ?? ''),
                    count($titles) > 1 ? 'Related findings: '.implode('; ', array_slice($titles, 0, 4)).'.' : null,
                ]),
                'priority' => (string) ($lead['priority'] ?? 'Info'),
                'category' => (string) ($lead['category'] ?? ''),
            ];
        }

        return $sections;
    }

    /**
     * @param  array<int, array<string, mixed>>  $insights
     * @param  array<int, array<string, mixed>>  $recommendations
     * @return array<string, mixed>
     */
    private function buildExecutiveSummary(array $insights, array $recommendations): array
    {
        $concern = $this->firstMatching($insights, function (array $i) {
            $p = (string) ($i['priority'] ?? '');
            $c = (string) ($i['category'] ?? '');

            return in_array($p, ['Critical', 'High'], true)
                || $c === 'risk'
                || in_array((string) ($i['severity'] ?? ''), ['critical', 'warning'], true);
        });

        $positive = $this->firstMatching($insights, function (array $i) {
            return (string) ($i['severity'] ?? '') === 'success'
                || (string) ($i['category'] ?? '') === 'achievement'
                || ! empty($i['positive_findings']);
        });

        $focus = $concern ?? $this->firstMatching($insights, function () {
            return true;
        });

        $action = null;
        if ($recommendations !== []) {
            $action = $recommendations[0];
        } elseif ($concern !== null) {
            $action = [
                'title' => (string) ($concern['title'] ?? ''),
                'description' => (string) ($concern['recommendation'] ?? $concern['description'] ?? ''),
            ];
        } elseif ($positive !== null) {
            $action = [
                'title' => (string) ($positive['title'] ?? ''),
                'description' => (string) ($positive['recommendation'] ?? $positive['description'] ?? ''),
            ];
        }

        $status = $this->deriveOverallStatus($insights, $concern, $positive);
        $confidence = $this->averageConfidence($insights);

        $strongestPositive = $positive !== null
            ? $this->insightHeadline($positive)
            : null;
        $highestConcern = $concern !== null
            ? $this->insightHeadline($concern)
            : null;
        $teacherFocus = $focus !== null
            ? $this->insightHeadline($focus)
            : null;
        $immediateAction = null;
        if (is_array($action)) {
            $immediateAction = $this->joinUnique([
                trim((string) ($action['title'] ?? '')),
                trim((string) ($action['description'] ?? '')),
            ]);
        }

        // Deduplicate executive finding lines.
        $findings = [];
        foreach ([$strongestPositive, $highestConcern, $teacherFocus] as $line) {
            if ($line === null || $line === '') {
                continue;
            }
            $key = strtolower($line);
            if (isset($findings[$key])) {
                continue;
            }
            $findings[$key] = $line;
        }

        return [
            'overall_student_status' => $status,
            'strongest_positive_finding' => $strongestPositive,
            'highest_priority_concern' => $highestConcern,
            'teacher_focus_area' => $teacherFocus,
            'immediate_recommended_action' => $immediateAction,
            'overall_confidence' => $confidence,
            'findings' => array_values($findings),
        ];
    }

    /**
     * @param  array<int, array<string, mixed>>  $insights
     * @param  array<string, mixed>|null  $concern
     * @param  array<string, mixed>|null  $positive
     */
    private function deriveOverallStatus(array $insights, ?array $concern, ?array $positive): string
    {
        $hasCritical = false;
        $hasHigh = false;
        $hasSuccess = false;
        foreach ($insights as $i) {
            $p = (string) ($i['priority'] ?? '');
            if ($p === 'Critical') {
                $hasCritical = true;
            }
            if ($p === 'High') {
                $hasHigh = true;
            }
            if ((string) ($i['severity'] ?? '') === 'success') {
                $hasSuccess = true;
            }
        }

        if ($hasCritical) {
            return $concern !== null
                ? 'Needs immediate attention — '.(string) ($concern['title'] ?? 'critical signals present')
                : 'Needs immediate attention';
        }
        if ($hasHigh) {
            return $concern !== null
                ? 'Requires focused support — '.(string) ($concern['title'] ?? 'elevated concerns')
                : 'Requires focused support';
        }
        if ($hasSuccess && $positive !== null) {
            return 'On track with strengths — '.(string) ($positive['title'] ?? 'positive signals');
        }
        if ($insights !== []) {
            $lead = $insights[0];

            return 'Mixed signals — '.(string) ($lead['title'] ?? 'review insights');
        }

        return 'Insufficient insight signals';
    }

    /**
     * @param  array<string, mixed>  $insight
     */
    private function insightHeadline(array $insight): string
    {
        return $this->joinUnique([
            trim((string) ($insight['title'] ?? '')),
            trim((string) ($insight['description'] ?? '')),
        ]);
    }

    /**
     * @param  array<int, array<string, mixed>>  $insights
     * @param  callable(array<string, mixed>): bool  $predicate
     * @return array<string, mixed>|null
     */
    private function firstMatching(array $insights, callable $predicate): ?array
    {
        foreach ($insights as $insight) {
            if ($predicate($insight)) {
                return $insight;
            }
        }

        return null;
    }

    /**
     * @param  array<int, array<string, mixed>>  $insights
     */
    private function averageConfidence(array $insights): float
    {
        $vals = [];
        foreach ($insights as $insight) {
            if (! isset($insight['confidence']) || ! is_numeric($insight['confidence'])) {
                continue;
            }
            $vals[] = (float) $insight['confidence'];
        }
        if ($vals === []) {
            return 0.5;
        }

        return round(array_sum($vals) / count($vals), 2);
    }

    /**
     * @param  array<int, array<string, mixed>>  $insights
     * @return array{executive_score: float, executive_level: string, executive_confidence: float}
     */
    private function buildExecutiveScore(array $insights): array
    {
        if ($insights === []) {
            return [
                'executive_score' => 0.0,
                'executive_level' => 'none',
                'executive_confidence' => 0.0,
            ];
        }

        $score = 0.5;
        $weight = 0.0;

        foreach ($insights as $insight) {
            $category = (string) ($insight['category'] ?? '');
            $priority = (string) ($insight['priority'] ?? 'Info');
            $severity = (string) ($insight['severity'] ?? '');
            $conf = isset($insight['confidence']) && is_numeric($insight['confidence'])
                ? (float) $insight['confidence']
                : 0.55;

            $delta = 0.0;
            if ($category === 'risk' || in_array($priority, ['Critical', 'High'], true) || $severity === 'critical') {
                $delta = -0.18;
            } elseif ($severity === 'warning') {
                $delta = -0.1;
            } elseif ($category === 'achievement' || $severity === 'success') {
                $delta = 0.14;
            } elseif ($severity === 'info') {
                $delta = 0.02;
            } else {
                $delta = 0.0;
            }

            $score += $delta * $conf;
            $weight += $conf;
        }

        $score = round(max(0.0, min(1.0, $score)), 2);
        $confidence = $this->averageConfidence($insights);

        if ($score >= 0.75) {
            $level = 'strong';
        } elseif ($score >= 0.55) {
            $level = 'stable';
        } elseif ($score >= 0.35) {
            $level = 'mixed';
        } else {
            $level = 'concern';
        }

        return [
            'executive_score' => $score,
            'executive_level' => $level,
            'executive_confidence' => $confidence,
        ];
    }

    /**
     * @param  array<string, mixed>  $summary
     */
    private function composeExecutiveText(array $summary): ?string
    {
        $parts = [];
        foreach ([
            'Status' => $summary['overall_student_status'] ?? null,
            'Strength' => $summary['strongest_positive_finding'] ?? null,
            'Concern' => $summary['highest_priority_concern'] ?? null,
            'Focus' => $summary['teacher_focus_area'] ?? null,
            'Action' => $summary['immediate_recommended_action'] ?? null,
        ] as $label => $value) {
            $value = is_string($value) ? trim($value) : '';
            if ($value === '') {
                continue;
            }
            $parts[] = $label.': '.$value;
        }

        if ($parts === []) {
            return null;
        }

        $conf = $summary['overall_confidence'] ?? null;
        if (is_numeric($conf)) {
            $parts[] = 'Confidence: '.number_format((float) $conf, 2);
        }

        // Deduplicate identical sentences.
        $unique = [];
        foreach ($parts as $part) {
            $key = strtolower($part);
            if (isset($unique[$key])) {
                continue;
            }
            $unique[$key] = $part;
        }

        return implode(' | ', array_values($unique));
    }

    /**
     * @param  array<int, string|null>  $parts
     */
    private function joinUnique(array $parts): string
    {
        $out = [];
        foreach ($parts as $part) {
            $part = is_string($part) ? trim($part) : '';
            if ($part === '') {
                continue;
            }
            $key = strtolower($part);
            if (isset($out[$key])) {
                continue;
            }
            $out[$key] = $part;
        }

        return implode(' — ', array_values($out));
    }
}
