<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class TeacherClassOverviewResource extends JsonResource
{
    /**
     * @param  \Illuminate\Http\Request  $request
     * @return array<string, mixed>
     */
    public function toArray($request): array
    {
        $healthStatus = $this->resource['health_status'] ?? 'at_risk';
        $topStudent = $this->resource['top_student'] ?? null;

        return [
            'class_id'                => (int) ($this->resource['class_id'] ?? 0),
            'grade_id'                => (int) ($this->resource['grade_id'] ?? 0),
            'name'                    => (string) ($this->resource['name'] ?? ''),
            'grade_name'              => (string) ($this->resource['grade_name'] ?? ''),
            'class_name'              => (string) ($this->resource['class_name'] ?? ''),
            'student_count'           => (int) ($this->resource['student_count'] ?? 0),
            'health_status'           => $healthStatus,
            'health_label'            => $this->healthLabel($healthStatus),
            'performance'             => [
                'percent' => (float) ($this->resource['performance_percent'] ?? 0),
                'trend'   => (string) ($this->resource['performance_trend'] ?? 'stable'),
            ],
            'students_need_attention' => (int) ($this->resource['students_need_attention'] ?? 0),
            'pending_assignments'     => (int) ($this->resource['pending_assignments'] ?? 0),
            'top_student'             => $topStudent ? [
                'id'                  => (int) ($topStudent['id'] ?? 0),
                'name'                => (string) ($topStudent['name'] ?? ''),
                'performance_percent' => (float) ($topStudent['performance_percent'] ?? 0),
            ] : null,
            'is_active'               => ($this->resource['status'] ?? 'inactive') === 'active',
        ];
    }

    private function healthLabel(string $healthStatus): string
    {
        $labels = [
            'good'          => 'GOOD',
            'needs_review'  => 'NEEDS REVIEW',
            'at_risk'       => 'AT RISK',
        ];

        return $labels[$healthStatus] ?? 'AT RISK';
    }
}
