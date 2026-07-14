<?php

namespace App\Services;

use App\Models\Assigns;
use App\Models\AssignsStudents;
use App\Models\AssignStandard;
use App\Models\ContentStandard;
use App\Models\Standard;
use App\Models\Student;
use App\Models\Subject;
use App\Services\StandardAuditLogger;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class ClassStandardsService
{
    private const EXPLORER_SLUGS = ['letters-explorer', 'math-explorer'];

    private const TAB_LABELS = [
        'letters-explorer' => 'Letter Explorer',
        'math-explorer'    => 'MATH EXPLORER',
    ];

    /**
     * @return array<string, mixed>
     */
    public function buildReport(
        int $classId,
        string $subjectSlug,
        string $range = 'week',
        ?int $studentId = null
    ): array {
        $range = $this->normalizeRange($range);
        $rangeStart = $this->resolveRangeStart($range);

        $classStudentIds = Student::query()
            ->where('class_id', $classId)
            ->where('status', '1')
            ->when($studentId !== null, function ($query) use ($studentId) {
                $query->where('id', $studentId);
            })
            ->pluck('id')
            ->map(fn ($id) => (int) $id);

        $tabs = $this->buildTabs($subjectSlug);
        $activeTab = collect($tabs)->firstWhere('active', true);
        $subjectId = (int) ($activeTab['subject_id'] ?? 0);

        if ($subjectId <= 0) {
            return $this->emptyReport($classId, $range, $tabs);
        }

        $standards = Standard::query()
            ->with([
                'domain:id,name,sort_order',
                'pages:id,standard_id,page_number',
                'contentStandards:id,content_type,content_id,standard_id,link_source,created_at',
                'auditLogs' => function ($query) {
                    $query
                        ->where('action', 'linked')
                        ->orderByDesc('created_at')
                        ->select([
                            'id',
                            'content_standard_id',
                            'standard_id',
                            'action',
                            'link_type',
                            'reason',
                            'confidence_score',
                            'created_at',
                        ]);
                },
            ])
            ->where('subject_id', $subjectId)
            ->where('status', 1)
            ->orderBy('sort_order')
            ->orderBy('code')
            ->get();

        if ($standards->isEmpty()) {
            return $this->emptyReport($classId, $range, $tabs, $activeTab);
        }

        $standardIds = $standards->pluck('id')->map(fn ($id) => (int) $id)->all();
        $assignLinks = AssignStandard::query()
            ->whereIn('standard_id', $standardIds)
            ->get(['assign_id', 'standard_id', 'link_source']);

        $subjectAssigns = Assigns::query()
            ->where('subject_id', $subjectId)
            ->where('status', 1)
            ->where('created_at', '>=', $rangeStart)
            ->get(['id', 'type', 'type_id']);

        $standardAssignMap = $this->buildStandardAssignMap($standards, $assignLinks, $subjectAssigns);
        $allAssignIds = collect($standardAssignMap)->flatten()->unique()->values();

        $submissionStats = $this->loadSubmissionStatsByAssign(
            $allAssignIds,
            $classStudentIds
        );

        $items = [];
        $linkSourcesAudit = [];

        foreach ($standards as $standard) {
            $assignIds = collect($standardAssignMap[$standard->id] ?? [])->unique();
            $completed = 0;
            $total = 0;

            foreach ($assignIds as $assignId) {
                $stats = $submissionStats[$assignId] ?? ['completed' => 0, 'total' => 0];
                $completed += $stats['completed'];
                $total += $stats['total'];
            }

            $percent = $total > 0 ? (int) round(($completed / $total) * 100) : 0;
            $statusMeta = $this->resolveStandardStatus($percent);
            $sources = $this->collectLinkSources($standard, $assignLinks);
            $auditDetails = $this->buildAuditDetails($standard);

            $linkSourcesAudit[$standard->code] = $sources;

            $items[] = [
                'standard_id'  => (int) $standard->id,
                'code'         => $standard->code,
                'label'        => $standard->code,
                'percent'      => $percent,
                'status'       => $statusMeta['status'],
                'color'        => $statusMeta['color'],
                'definition'   => $standard->definition,
                'domain'       => $standard->domain->name ?? '',
                'submissions'  => [
                    'completed' => $completed,
                    'total'     => $total,
                ],
                'assign_count'  => $assignIds->count(),
                'content_count' => $standard->contentStandards->count(),
                'link_sources'  => $sources,
                'audit_details' => $auditDetails,
            ];
        }

        $selected = $this->resolveSelectedItem($items);

        return [
            'source'   => 'quizzes_and_assignments',
            'range'    => $range,
            'class_id' => $classId,
            'tabs'     => $tabs,
            'selected' => $selected,
            'items'    => $items,
            'audit'    => [
                'link_sources_by_standard' => $linkSourcesAudit,
            ],
        ];
    }

    /**
     * @return array<int, array{subject_id: int, slug: string, label: string, active: bool}>
     */
    private function buildTabs(string $activeSlug): array
    {
        $subjects = Subject::query()
            ->whereIn('slug', self::EXPLORER_SLUGS)
            ->where('status', '1')
            ->get(['id', 'name', 'slug']);

        $order = array_flip(self::EXPLORER_SLUGS);

        $tabs = $subjects
            ->sortBy(fn (Subject $subject) => $order[$subject->slug] ?? 99)
            ->map(function (Subject $subject) use ($activeSlug) {
                return [
                    'subject_id' => (int) $subject->id,
                    'slug'       => (string) $subject->slug,
                    'label'      => self::TAB_LABELS[$subject->slug] ?? $subject->name,
                    'active'     => $subject->slug === $activeSlug,
                ];
            })
            ->values()
            ->all();

        if ($tabs !== [] && ! collect($tabs)->contains(fn (array $tab) => $tab['active'])) {
            $tabs[0]['active'] = true;
        }

        return $tabs;
    }

    /**
     * @param  Collection<int, Standard>  $standards
     * @param  Collection<int, AssignStandard>  $assignLinks
     * @param  Collection<int, Assigns>  $subjectAssigns
     * @return array<int, array<int, int>>
     */
    private function buildStandardAssignMap(
        Collection $standards,
        Collection $assignLinks,
        Collection $subjectAssigns
    ): array {
        $map = [];

        foreach ($standards as $standard) {
            $map[$standard->id] = [];
        }

        foreach ($assignLinks as $link) {
            $map[$link->standard_id][] = (int) $link->assign_id;
        }

        $assignsByTypeId = [];
        foreach ($subjectAssigns as $assign) {
            $key = ($assign->type ?? '').':'.(int) $assign->type_id;
            $assignsByTypeId[$key][] = (int) $assign->id;
        }

        foreach ($standards as $standard) {
            foreach ($standard->contentStandards as $contentLink) {
                $key = $contentLink->content_type.':'.(int) $contentLink->content_id;
                foreach ($assignsByTypeId[$key] ?? [] as $assignId) {
                    $map[$standard->id][] = $assignId;
                }
            }
        }

        foreach ($map as $standardId => $assignIds) {
            $map[$standardId] = array_values(array_unique($assignIds));
        }

        return $map;
    }

    /**
     * @param  Collection<int, int>  $assignIds
     * @param  Collection<int, int>  $classStudentIds
     * @return array<int, array{completed: int, total: int}>
     */
    private function loadSubmissionStatsByAssign(Collection $assignIds, Collection $classStudentIds): array
    {
        if ($assignIds->isEmpty() || $classStudentIds->isEmpty()) {
            return [];
        }

        $rows = AssignsStudents::query()
            ->whereIn('assign_id', $assignIds->all())
            ->whereIn('student_id', $classStudentIds->all())
            ->where('status', 1)
            ->get(['assign_id', 'opened_at']);

        $stats = [];

        foreach ($rows as $row) {
            $assignId = (int) $row->assign_id;

            if (! isset($stats[$assignId])) {
                $stats[$assignId] = ['completed' => 0, 'total' => 0];
            }

            $stats[$assignId]['total']++;

            if ($row->opened_at !== null) {
                $stats[$assignId]['completed']++;
            }
        }

        return $stats;
    }

    /**
     * @return array<int, string>
     */
    private function collectLinkSources(Standard $standard, Collection $assignLinks): array
    {
        $sources = $standard->contentStandards
            ->pluck('link_source')
            ->merge(
                $assignLinks
                    ->where('standard_id', $standard->id)
                    ->pluck('link_source')
            )
            ->filter()
            ->unique()
            ->values()
            ->all();

        return $sources;
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     * @return array<string, mixed>|null
     */
    private function resolveSelectedItem(array $items): ?array
    {
        if ($items === []) {
            return null;
        }

        usort($items, function (array $a, array $b) {
            if ($a['percent'] === $b['percent']) {
                return strcmp($a['code'], $b['code']);
            }

            return $b['percent'] <=> $a['percent'];
        });

        $top = $items[0];

        return [
            'standard_id'   => $top['standard_id'],
            'code'          => $top['code'],
            'label'         => $top['label'],
            'percent'       => $top['percent'],
            'status'        => $top['status'],
            'color'         => $top['color'],
            'definition'    => $top['definition'],
            'link_sources'  => $top['link_sources'],
            'audit_details' => $top['audit_details'] ?? [],
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function buildAuditDetails(Standard $standard): array
    {
        $details = [];

        foreach ($standard->auditLogs as $log) {
            $details[] = [
                'linked_at'         => $log->created_at?->toIso8601String(),
                'link_type'         => $log->link_type,
                'reason'            => $log->reason,
                'confidence_score'  => $log->confidence_score !== null
                    ? (float) $log->confidence_score
                    : null,
                'action'            => $log->action,
            ];
        }

        if ($details !== []) {
            return $details;
        }

        foreach ($standard->contentStandards as $link) {
            $details[] = [
                'linked_at'        => $link->created_at?->toIso8601String(),
                'link_type'        => StandardAuditLogger::resolveLinkType((string) $link->link_source),
                'reason'           => sprintf(
                    'Legacy link via %s (no audit log recorded).',
                    $link->link_source
                ),
                'confidence_score' => null,
                'action'           => 'linked',
            ];
        }

        return $details;
    }

  /**
     * @return array{status: string, color: string}
     */
    private function resolveStandardStatus(int $percent): array
    {
        if ($percent >= 90) {
            return ['status' => 'excellent', 'color' => '#059669'];
        }

        if ($percent >= 80) {
            return ['status' => 'good', 'color' => '#00A78E'];
        }

        return ['status' => 'warning', 'color' => '#D4A843'];
    }

    private function normalizeRange(string $range): string
    {
        return in_array($range, ['week', 'month', 'term'], true) ? $range : 'week';
    }

    private function resolveRangeStart(string $range): Carbon
    {
        if ($range === 'month') {
            return now()->subDays(30)->startOfDay();
        }

        if ($range === 'term') {
            return now()->subMonths(4)->startOfDay();
        }

        return now()->subDays(7)->startOfDay();
    }

    /**
     * @param  array<int, array<string, mixed>>  $tabs
     * @param  array<string, mixed>|null  $activeTab
     * @return array<string, mixed>
     */
    private function emptyReport(int $classId, string $range, array $tabs, ?array $activeTab = null): array
    {
        return [
            'source'   => 'quizzes_and_assignments',
            'range'    => $range,
            'class_id' => $classId,
            'tabs'     => $tabs,
            'selected' => null,
            'items'    => [],
            'audit'    => [
                'link_sources_by_standard' => [],
                'note'                       => $activeTab
                    ? 'No standards found for the selected subject.'
                    : 'No explorer subjects configured.',
            ],
        ];
    }
}
