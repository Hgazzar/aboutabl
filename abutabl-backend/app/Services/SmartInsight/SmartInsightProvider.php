<?php

namespace App\Services\SmartInsight;

use App\Contracts\StudentInsightProviderInterface;

/**
 * Sole production Smart Insight provider (F-032 rule engine + F-039 quality calibration).
 */
class SmartInsightProvider implements StudentInsightProviderInterface
{
    /** @var InsightMetricsReader */
    private $reader;

    /** @var SmartInsightEngine */
    private $engine;

    /** @var InsightQualityCalibrator */
    private $calibrator;

    public function __construct(
        InsightMetricsReader $reader,
        SmartInsightEngine $engine,
        InsightQualityCalibrator $calibrator
    ) {
        $this->reader = $reader;
        $this->engine = $engine;
        $this->calibrator = $calibrator;
    }

    /**
     * @param  array<string, mixed>  $context
     * @return array<string, mixed>
     */
    public function build(array $context): array
    {
        $studentId = (int) ($context['student_id'] ?? 0);
        if ($studentId <= 0) {
            return $this->emptyPayload();
        }

        $metricsContext = $this->reader->build($context);
        $insights = $this->engine->generate($metricsContext);

        if ($insights === []) {
            return array_merge($this->emptyPayload(), [
                'generated_at' => $metricsContext['generated_at'] ?? now()->toIso8601String(),
            ]);
        }

        $calibrated = $this->calibrator->calibrate($insights);
        $generatedAt = null;
        foreach ($calibrated['insights'] as $insight) {
            if (! empty($insight['generated_at'])) {
                $generatedAt = (string) $insight['generated_at'];
                break;
            }
        }

        return [
            'available' => true,
            'text' => $calibrated['text'],
            'generated_at' => $generatedAt ?? ($metricsContext['generated_at'] ?? now()->toIso8601String()),
            'insights' => $calibrated['insights'],
            'executive_summary' => $calibrated['executive_summary'],
            'executive_score' => $calibrated['executive_score'],
            'executive_level' => $calibrated['executive_level'],
            'executive_confidence' => $calibrated['executive_confidence'],
            'categories' => $calibrated['categories'],
            'recommendations' => $calibrated['recommendations'],
            'presentation_sections' => $calibrated['presentation_sections'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function emptyPayload(): array
    {
        return [
            'available' => false,
            'text' => null,
            'generated_at' => null,
            'insights' => [],
            'executive_summary' => null,
            'executive_score' => null,
            'executive_level' => null,
            'executive_confidence' => null,
            'categories' => [],
            'recommendations' => [],
            'presentation_sections' => [],
        ];
    }
}
