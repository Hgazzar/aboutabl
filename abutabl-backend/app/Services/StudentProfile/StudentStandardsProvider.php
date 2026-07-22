<?php

namespace App\Services\StudentProfile;

use App\Services\ClassStandardsService;

class StudentStandardsProvider
{
    /** @var ClassStandardsService */
    private $standardsService;

    public function __construct(ClassStandardsService $standardsService)
    {
        $this->standardsService = $standardsService;
    }

    /**
     * @return array<string, mixed>
     */
    public function build(
        int $classId,
        int $studentId,
        string $range,
        string $subjectSlug = 'letters-explorer'
    ): array {
        $report = $this->standardsService->buildReport(
            $classId,
            $subjectSlug,
            $range,
            $studentId
        );

        $items = array_map(function (array $item) {
            return [
                'standard_id'   => (int) ($item['standard_id'] ?? 0),
                'code'          => (string) ($item['code'] ?? ''),
                'label'         => (string) ($item['label'] ?? ''),
                'definition'    => $item['definition'] ?? null,
                'domain'        => (string) ($item['domain'] ?? ''),
                'percentage'    => (int) ($item['percent'] ?? 0),
                'percent'       => (int) ($item['percent'] ?? 0),
                'status'        => (string) ($item['status'] ?? 'warning'),
                'color'         => (string) ($item['color'] ?? '#D4A843'),
                'trend'         => null,
                'submissions'   => $item['submissions'] ?? [
                    'completed' => 0,
                    'total'     => 0,
                ],
                'link_sources'  => array_values($item['link_sources'] ?? []),
                'audit_details' => array_values($item['audit_details'] ?? []),
            ];
        }, $report['items'] ?? []);

        $selected = null;

        if (! empty($report['selected'])) {
            $selected = [
                'standard_id'   => (int) ($report['selected']['standard_id'] ?? 0),
                'code'          => (string) ($report['selected']['code'] ?? ''),
                'label'         => (string) ($report['selected']['label'] ?? ''),
                'definition'    => $report['selected']['definition'] ?? null,
                'percentage'    => (int) ($report['selected']['percent'] ?? 0),
                'percent'       => (int) ($report['selected']['percent'] ?? 0),
                'status'        => (string) ($report['selected']['status'] ?? 'warning'),
                'color'         => (string) ($report['selected']['color'] ?? '#D4A843'),
                'trend'         => null,
                'link_sources'  => array_values($report['selected']['link_sources'] ?? []),
                'audit_details' => array_values($report['selected']['audit_details'] ?? []),
            ];
        }

        return [
            'available' => $items !== [],
            'tabs'      => $report['tabs'] ?? [],
            'selected'  => $selected,
            'items'     => $items,
        ];
    }
}
