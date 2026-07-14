<?php

namespace App\Services\StudentProfile;

use App\Contracts\StudentInsightProviderInterface;

class StudentEvaluationProvider
{
    /** @var StudentInsightProviderInterface */
    private $insightProvider;

    public function __construct(StudentInsightProviderInterface $insightProvider)
    {
        $this->insightProvider = $insightProvider;
    }

    /**
     * Teacher notes / feedback are not stored in v1 — contract stays fixed.
     *
     * @param  array<string, mixed>  $context
     * @return array<string, mixed>
     */
    public function build(array $context = []): array
    {
        $smartInsight = $this->insightProvider->build($context);

        return [
            'available'        => false,
            'notes'            => [],
            'latest_feedback'  => null,
            'recommendations'  => [],
            'smart_insight'    => $smartInsight,
        ];
    }
}
