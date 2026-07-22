<?php

namespace App\Services\StudentProfile;

use App\Contracts\StudentInsightProviderInterface;
use App\Services\TeacherEvaluationService;

/**
 * Teacher Evaluation for Student Profile — reads DB via TeacherEvaluationService.
 * Smart Insight is delegated exclusively to StudentInsightProviderInterface
 * (bound to SmartInsightProvider — F-032 rule engine).
 */
class StudentEvaluationProvider
{
    /** @var StudentInsightProviderInterface */
    private $insightProvider;

    /** @var TeacherEvaluationService */
    private $evaluationService;

    public function __construct(
        StudentInsightProviderInterface $insightProvider,
        TeacherEvaluationService $evaluationService
    ) {
        $this->insightProvider = $insightProvider;
        $this->evaluationService = $evaluationService;
    }

    /**
     * @param  array<string, mixed>  $context
     * @return array<string, mixed>
     */
    public function build(array $context = []): array
    {
        $smartInsight = $this->insightProvider->build($context);

        $teacherId = (int) ($context['teacher_id'] ?? 0);
        $classId = (int) ($context['class_id'] ?? 0);
        $studentId = (int) ($context['student_id'] ?? 0);
        /** @var int[] $schoolIds */
        $schoolIds = is_array($context['school_ids'] ?? null)
            ? $context['school_ids']
            : [];

        if ($teacherId <= 0 || $classId <= 0 || $studentId <= 0) {
            return [
                'available'        => false,
                'notes'            => [],
                'latest_feedback'  => null,
                'recommendations'  => [],
                'smart_insight'    => $smartInsight,
            ];
        }

        try {
            $payload = $this->evaluationService->buildProfilePayload(
                $teacherId,
                $schoolIds,
                $classId,
                $studentId,
                (bool) ($context['access_verified'] ?? false)
            );
        } catch (\InvalidArgumentException $e) {
            return [
                'available'        => false,
                'notes'            => [],
                'latest_feedback'  => null,
                'recommendations'  => [],
                'smart_insight'    => $smartInsight,
            ];
        }

        return [
            'available'        => (bool) ($payload['available'] ?? false),
            'notes'            => array_values($payload['notes'] ?? []),
            'latest_feedback'  => $payload['latest_feedback'] ?? null,
            'recommendations'  => [],
            'smart_insight'    => $smartInsight,
        ];
    }
}
