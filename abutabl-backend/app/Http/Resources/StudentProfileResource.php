<?php

namespace App\Http\Resources;

use Carbon\Carbon;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Formatting only — every contract key is always present.
 */
class StudentProfileResource extends JsonResource
{
    /**
     * @param  \Illuminate\Http\Request  $request
     * @return array<string, mixed>
     */
    public function toArray($request): array
    {
        $student = is_array($this->resource['student'] ?? null)
            ? $this->resource['student']
            : [];
        $analytics = $this->resource['analytics'] ?? [];
        $completion = $this->resource['completion'] ?? [];
        $activities = $this->resource['activities'] ?? [];
        $standards = $this->resource['standards'] ?? [];
        $evaluation = $this->resource['teacher_evaluation'] ?? [];
        $rankings = $this->resource['rankings'] ?? [];

        return [
            'source'   => (string) ($this->resource['source'] ?? 'composed_student_profile'),
            'range'    => (string) ($this->resource['range'] ?? 'week'),
            'class_id' => (int) ($this->resource['class_id'] ?? 0),
            'student'  => $this->formatStudent($student),
            'analytics' => [
                'available' => (bool) ($analytics['available'] ?? false),
                'series'    => array_values(array_map(
                    [$this, 'formatSeriesPoint'],
                    $analytics['series'] ?? []
                )),
                'summary'   => [
                    'performance_percent'  => (float) ($analytics['summary']['performance_percent'] ?? 0),
                    'delta_percent'        => $analytics['summary']['delta_percent'] ?? null,
                    'completion_percent'   => (float) ($analytics['summary']['completion_percent'] ?? 0),
                    'attendance_percent'   => $analytics['summary']['attendance_percent'] ?? null,
                    'attendance_available' => (bool) ($analytics['summary']['attendance_available'] ?? false),
                ],
            ],
            'completion' => [
                'completed'     => (int) ($completion['completed'] ?? 0),
                'missing'       => (int) ($completion['missing'] ?? 0),
                'total'         => (int) ($completion['total'] ?? 0),
                'percent'       => (float) ($completion['percent'] ?? 0),
                'score_percent' => (float) ($completion['score_percent'] ?? 0),
            ],
            // Additive — same shape as class overview charts.learning_progress (BC: existing keys unchanged).
            'learning_progress' => $this->formatLearningProgress(
                $this->resource['learning_progress'] ?? null
            ),
            'activities' => [
                'assignments' => [
                    'items'      => array_values(array_map(
                        [$this, 'formatActivityItem'],
                        $activities['assignments']['items'] ?? []
                    )),
                    'pagination' => $this->paginationMeta($activities['assignments']['pagination'] ?? []),
                ],
                'quizzes' => [
                    'items'      => array_values(array_map(
                        [$this, 'formatActivityItem'],
                        $activities['quizzes']['items'] ?? []
                    )),
                    'pagination' => $this->paginationMeta($activities['quizzes']['pagination'] ?? []),
                    // Additive — null when no quiz scores stored yet (no FE average math).
                    'average_percent'   => $activities['quizzes']['average_percent'] ?? null,
                    'average_available' => (bool) ($activities['quizzes']['average_available'] ?? false),
                ],
            ],
            'standards' => [
                'available' => (bool) ($standards['available'] ?? false),
                'tabs'      => array_values($standards['tabs'] ?? []),
                'selected'  => $this->formatStandardItem($standards['selected'] ?? null),
                'items'     => array_values(array_map(
                    [$this, 'formatStandardItem'],
                    $standards['items'] ?? []
                )),
            ],
            'teacher_evaluation' => [
                'available'       => (bool) ($evaluation['available'] ?? false),
                'notes'           => array_values($evaluation['notes'] ?? []),
                'latest_feedback' => $evaluation['latest_feedback'] ?? null,
                'recommendations' => array_values($evaluation['recommendations'] ?? []),
                'smart_insight'   => [
                    'available'    => (bool) ($evaluation['smart_insight']['available'] ?? false),
                    'text'         => $evaluation['smart_insight']['text'] ?? null,
                    'generated_at' => $evaluation['smart_insight']['generated_at'] ?? null,
                ],
            ],
            'rankings' => [
                'available'             => (bool) ($rankings['available'] ?? false),
                'scope'                 => (string) ($rankings['scope'] ?? 'class'),
                'class_rank'            => $rankings['class_rank'] ?? null,
                'all_classes_rank'      => $rankings['all_classes_rank'] ?? null,
                'all_classes_available' => (bool) ($rankings['all_classes_available'] ?? false),
                'school_rank'           => $rankings['school_rank'] ?? null,
                'school_available'      => (bool) ($rankings['school_available'] ?? false),
                'items'                 => array_values(array_map(
                    [$this, 'formatRankingItem'],
                    $rankings['items'] ?? []
                )),
            ],
        ];
    }

    /**
     * @param  array<string, mixed>|null  $progress
     * @return array<string, mixed>
     */
    private function formatLearningProgress(?array $progress): array
    {
        $progress = is_array($progress) ? $progress : [];

        return [
            'source' => (string) ($progress['source'] ?? 'assignments'),
            'range'  => (string) ($progress['range'] ?? 'week'),
            'activity' => [
                'completed' => (int) ($progress['activity']['completed'] ?? 0),
                'total'     => (int) ($progress['activity']['total'] ?? 0),
                'percent'   => (float) ($progress['activity']['percent'] ?? 0),
            ],
            'submissions' => [
                'completed' => (int) ($progress['submissions']['completed'] ?? 0),
                'missing'   => (int) ($progress['submissions']['missing'] ?? 0),
                'total'     => (int) ($progress['submissions']['total'] ?? 0),
            ],
            'score_percent' => (float) ($progress['score_percent'] ?? 0),
        ];
    }

    /**
     * @param  array<string, mixed>  $student
     * @return array<string, mixed>
     */
    private function formatStudent(array $student): array
    {
        return [
            'student_id'          => (int) ($student['student_id'] ?? 0),
            'name'                => (string) ($student['name'] ?? ''),
            'photo_url'           => $student['photo_url'] ?? null,
            'avatar'              => $student['photo_url'] ?? ($student['avatar'] ?? null),
            'class_label'         => (string) ($student['class_label'] ?? ''),
            'grade_label'         => (string) ($student['grade_label'] ?? ''),
            'rank'                => (int) ($student['rank'] ?? 0),
            'performance_percent' => (float) ($student['performance_percent'] ?? 0),
            'score_percent'       => (float) ($student['score_percent'] ?? 0),
            'status'              => (string) ($student['status'] ?? 'no_data'),
            'performance_label'   => (string) ($student['performance_label'] ?? ''),
            'trend'               => (string) ($student['trend'] ?? 'stable'),
            'needs_attention'     => (bool) ($student['needs_attention'] ?? false),
            'overdue_count'       => (int) ($student['overdue_count'] ?? 0),
        ];
    }

    /**
     * @param  array<string, mixed>  $point
     * @return array<string, mixed>
     */
    private function formatSeriesPoint(array $point): array
    {
        return [
            'day'                => (string) ($point['day'] ?? ''),
            'date'               => (string) ($point['date'] ?? ''),
            'value'              => (float) ($point['value'] ?? 0),
            'completion_percent' => (float) ($point['completion_percent'] ?? 0),
            'class_avg_percent'  => (float) ($point['class_avg_percent'] ?? 0),
            'completed'          => (int) ($point['completed'] ?? 0),
            'total'              => (int) ($point['total'] ?? 0),
        ];
    }

    /**
     * @param  array<string, mixed>  $item
     * @return array<string, mixed>
     */
    private function formatActivityItem(array $item): array
    {
        $assignedAt = $item['assigned_at'] ?? null;

        return [
            'id'            => (int) ($item['id'] ?? 0),
            'assign_id'     => (int) ($item['assign_id'] ?? 0),
            'title'         => (string) ($item['title'] ?? ''),
            'type'          => (string) ($item['type'] ?? 'assignment'),
            'status'        => (string) ($item['status'] ?? 'pending'),
            'status_badge'  => (string) ($item['status_badge'] ?? 'pending'),
            'score'         => $item['score'] ?? null,
            'max_score'     => $item['max_score'] ?? null,
            'score_label'   => $item['score_label'] ?? null,
            'due_at'        => $item['due_at'] ?? null,
            'assigned_at'   => $assignedAt,
            'relative_time' => $this->formatRelativeTime($assignedAt),
            'opened_at'     => $item['opened_at'] ?? null,
        ];
    }

    /**
     * @param  array<string, mixed>|null  $item
     * @return array<string, mixed>|null
     */
    private function formatStandardItem(?array $item): ?array
    {
        if ($item === null) {
            return null;
        }

        $percent = (int) ($item['percentage'] ?? $item['percent'] ?? 0);

        return [
            'standard_id' => (int) ($item['standard_id'] ?? 0),
            'code'        => (string) ($item['code'] ?? ''),
            'label'       => (string) ($item['label'] ?? ''),
            'definition'  => $item['definition'] ?? null,
            'domain'      => (string) ($item['domain'] ?? ''),
            'percentage'  => $percent,
            'percent'     => $percent,
            'status'      => (string) ($item['status'] ?? 'warning'),
            'color'       => (string) ($item['color'] ?? '#D4A843'),
            'trend'       => $item['trend'] ?? null,
            'submissions' => [
                'completed' => (int) ($item['submissions']['completed'] ?? 0),
                'total'     => (int) ($item['submissions']['total'] ?? 0),
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $item
     * @return array<string, mixed>
     */
    private function formatRankingItem(array $item): array
    {
        return [
            'student_id'          => (int) ($item['student_id'] ?? 0),
            'name'                => (string) ($item['name'] ?? ''),
            'photo_url'           => $item['photo_url'] ?? null,
            'class_label'         => (string) ($item['class_label'] ?? ''),
            'status'              => (string) ($item['status'] ?? 'no_data'),
            'performance_label'   => (string) ($item['performance_label'] ?? ''),
            'score_percent'       => (float) ($item['score_percent'] ?? 0),
            'performance_percent' => (float) ($item['performance_percent'] ?? 0),
            'rank'                => (int) ($item['rank'] ?? 0),
            'is_current'          => (bool) ($item['is_current'] ?? false),
        ];
    }

    private function formatRelativeTime(?string $iso): ?string
    {
        if ($iso === null || $iso === '') {
            return null;
        }

        try {
            return ucfirst(Carbon::parse($iso)->locale('en')->diffForHumans());
        } catch (\Throwable $e) {
            return null;
        }
    }

    /**
     * @param  array<string, mixed>  $meta
     * @return array<string, mixed>
     */
    private function paginationMeta(array $meta): array
    {
        $currentPage = (int) ($meta['current_page'] ?? $meta['page'] ?? 1);

        return [
            'current_page' => $currentPage,
            'per_page'     => (int) ($meta['per_page'] ?? 10),
            'last_page'    => (int) ($meta['last_page'] ?? 1),
            'total'        => (int) ($meta['total'] ?? 0),
            'has_more'     => (bool) ($meta['has_more'] ?? false),
        ];
    }
}
