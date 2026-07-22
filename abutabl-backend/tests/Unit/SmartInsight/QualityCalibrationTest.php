<?php

namespace Tests\Unit\SmartInsight;

use App\Services\SmartInsight\InsightQualityCalibrator;
use App\Services\SmartInsight\InsightRuleRegistry;
use App\Services\SmartInsight\SmartInsightEngine;
use App\Services\SmartInsight\SmartInsightProvider;
use Tests\TestCase;

/**
 * F-039 — Quality calibration & executive intelligence.
 */
class QualityCalibrationTest extends TestCase
{
    private function sampleInsights(): array
    {
        return [
            [
                'id' => 'critical_risk',
                'category' => 'risk',
                'severity' => 'critical',
                'title' => 'Critical Risk',
                'description' => 'Critical educational risk detected.',
                'recommendation' => 'Open urgent recovery plan.',
                'priority' => 6,
                'confidence' => 0.91,
                'generated_at' => '2026-07-18T00:00:00+00:00',
                'recommendations' => [[
                    'title' => 'Immediate Critical-Risk Action',
                    'description' => 'Open urgent recovery plan.',
                    'priority' => 6,
                    'category' => 'risk',
                    'action_type' => 'urgent_intervention',
                    'target_type' => 'student',
                    'target_id' => 1,
                ]],
            ],
            [
                'id' => 'high_progress',
                'category' => 'progress',
                'severity' => 'success',
                'title' => 'High Progress',
                'description' => 'Progress is high.',
                'recommendation' => 'Maintain pace.',
                'priority' => 50,
                'confidence' => 0.7,
                'generated_at' => '2026-07-18T00:00:00+00:00',
            ],
            [
                'id' => 'fast_learner',
                'category' => 'achievement',
                'severity' => 'info',
                'title' => 'Fast Learner',
                'description' => 'Learning velocity is high.',
                'recommendation' => 'Provide accelerated pathways.',
                'priority' => 13,
                'confidence' => 0.8,
                'generated_at' => '2026-07-18T00:00:00+00:00',
                'recommendations' => [[
                    'title' => 'Support Fast Learning Pace',
                    'description' => 'Provide accelerated pathways.',
                    'priority' => 13,
                    'category' => 'achievement',
                    'action_type' => 'accelerate_pathway',
                    'target_type' => 'student',
                    'target_id' => 1,
                ]],
            ],
            [
                'id' => 'learning_excellence',
                'category' => 'achievement',
                'severity' => 'success',
                'title' => 'Learning Excellence',
                'description' => 'Excellence band reached.',
                'recommendation' => 'Showcase excellence.',
                'priority' => 4,
                'confidence' => 0.88,
                'generated_at' => '2026-07-18T00:00:00+00:00',
                'recommendations' => [[
                    'title' => 'Showcase Learning Excellence',
                    'description' => 'Showcase excellence.',
                    'priority' => 4,
                    'category' => 'achievement',
                    'action_type' => 'showcase_excellence',
                    'target_type' => 'student',
                    'target_id' => 1,
                ]],
            ],
            [
                'id' => 'excellent_performance',
                'category' => 'performance',
                'severity' => 'success',
                'title' => 'Excellent Performance',
                'description' => 'Performance is excellent.',
                'recommendation' => 'Recognize achievement.',
                'priority' => 42,
                'confidence' => 1.2,
                'generated_at' => '2026-07-18T00:00:00+00:00',
            ],
            [
                'id' => 'high_quiz_accuracy',
                'category' => 'assessment',
                'severity' => 'success',
                'title' => 'High Quiz Accuracy',
                'description' => 'Quiz accuracy is high.',
                'recommendation' => 'Keep challenging.',
                'priority' => 43,
                'confidence' => 0.75,
                'generated_at' => '2026-07-18T00:00:00+00:00',
            ],
            [
                'id' => 'strong_standards',
                'category' => 'standards',
                'severity' => 'success',
                'title' => 'Strong Standards',
                'description' => 'Standards are strong.',
                'recommendation' => 'Maintain coverage.',
                'priority' => 44,
                'confidence' => 0.7,
                'generated_at' => '2026-07-18T00:00:00+00:00',
            ],
            [
                'id' => 'excellent_engagement',
                'category' => 'learning_behaviour',
                'severity' => 'success',
                'title' => 'Excellent Engagement',
                'description' => 'Engagement is excellent.',
                'recommendation' => 'Keep rhythm.',
                'priority' => 48,
                'confidence' => 0.66,
                'generated_at' => '2026-07-18T00:00:00+00:00',
            ],
            // Duplicate recommendation content (should collapse).
            [
                'id' => 'dropout_risk',
                'category' => 'risk',
                'severity' => 'critical',
                'title' => 'Dropout Risk',
                'description' => 'Dropout pattern present.',
                'recommendation' => 'Open urgent recovery plan.',
                'priority' => 9,
                'confidence' => 0.8,
                'generated_at' => '2026-07-18T00:00:00+00:00',
                'recommendations' => [[
                    'title' => 'Immediate Critical-Risk Action',
                    'description' => 'Open urgent recovery plan.',
                    'priority' => 6,
                    'category' => 'risk',
                    'action_type' => 'urgent_intervention',
                    'target_type' => 'student',
                    'target_id' => 1,
                ]],
            ],
        ];
    }

    public function test_priority_labels_are_normalized_and_sorted(): void
    {
        $out = (new InsightQualityCalibrator())->calibrate($this->sampleInsights());
        $allowed = ['Critical', 'High', 'Medium', 'Low', 'Info'];
        $ranks = [];
        foreach ($out['insights'] as $insight) {
            $this->assertContains($insight['priority'], $allowed);
            $ranks[] = InsightQualityCalibrator::PRIORITY_ORDER[$insight['priority']];
        }
        $sorted = $ranks;
        sort($sorted);
        $this->assertSame($sorted, $ranks);
        $this->assertSame('Critical', $out['insights'][0]['priority']);
    }

    public function test_confidence_normalized_to_two_decimals(): void
    {
        $out = (new InsightQualityCalibrator())->calibrate($this->sampleInsights());
        foreach ($out['insights'] as $insight) {
            if (! array_key_exists('confidence', $insight)) {
                continue;
            }
            $this->assertIsFloat($insight['confidence']);
            $this->assertGreaterThanOrEqual(0.0, $insight['confidence']);
            $this->assertLessThanOrEqual(1.0, $insight['confidence']);
            $this->assertSame(
                round($insight['confidence'], 2),
                $insight['confidence']
            );
        }
        $excellent = collect($out['insights'])->firstWhere('id', 'excellent_performance');
        $this->assertSame(1.0, $excellent['confidence']);
    }

    public function test_category_order_and_limits(): void
    {
        $many = $this->sampleInsights();
        for ($i = 0; $i < 6; $i++) {
            $many[] = [
                'id' => 'achievement_extra_'.$i,
                'category' => 'achievement',
                'severity' => 'success',
                'title' => 'Extra '.$i,
                'description' => 'Extra achievement '.$i,
                'recommendation' => 'Keep going '.$i,
                'priority' => 40 + $i,
                'confidence' => 0.5,
                'generated_at' => '2026-07-18T00:00:00+00:00',
            ];
        }

        $out = (new InsightQualityCalibrator())->calibrate($many);
        $cats = array_column($out['categories'], 'category');
        $expectedPrefix = [
            'risk',
            'progress',
            'performance',
            'assessment',
            'standards',
            'learning_behaviour',
            'achievement',
        ];
        $this->assertSame(
            array_values(array_intersect($expectedPrefix, $cats)),
            $cats
        );

        $achievement = collect($out['categories'])->firstWhere('category', 'achievement');
        $this->assertNotNull($achievement);
        $this->assertLessThanOrEqual(5, count($achievement['visible']));
        $this->assertGreaterThan(0, $achievement['collapsed_count']);
        $this->assertStringStartsWith('+ ', (string) $achievement['more_label']);
    }

    public function test_recommendations_deduplicated_and_sorted(): void
    {
        $out = (new InsightQualityCalibrator())->calibrate($this->sampleInsights());
        $keys = [];
        foreach ($out['recommendations'] as $rec) {
            $key = strtolower(($rec['action_type'] ?? '').'|'.($rec['title'] ?? '').'|'.($rec['description'] ?? ''));
            $this->assertArrayNotHasKey($key, $keys);
            $keys[$key] = true;
            $this->assertContains($rec['priority'], ['Critical', 'High', 'Medium', 'Low', 'Info']);
        }
        $this->assertSame('Critical', $out['recommendations'][0]['priority']);
    }

    public function test_executive_summary_and_score_from_existing_insights_only(): void
    {
        $out = (new InsightQualityCalibrator())->calibrate($this->sampleInsights());
        $summary = $out['executive_summary'];

        $this->assertNotEmpty($summary['overall_student_status']);
        $this->assertNotEmpty($summary['highest_priority_concern']);
        $this->assertNotEmpty($summary['immediate_recommended_action']);
        $this->assertIsFloat($summary['overall_confidence']);
        $this->assertArrayHasKey('executive_score', $out);
        $this->assertArrayHasKey('executive_level', $out);
        $this->assertArrayHasKey('executive_confidence', $out);
        $this->assertGreaterThanOrEqual(0.0, $out['executive_score']);
        $this->assertLessThanOrEqual(1.0, $out['executive_score']);

        // No invented titles: concern/positive must come from insight titles/descriptions.
        $titles = array_column($this->sampleInsights(), 'title');
        $this->assertTrue(
            collect($titles)->contains(function ($title) use ($summary) {
                return strpos((string) $summary['highest_priority_concern'], (string) $title) !== false
                    || strpos((string) $summary['overall_student_status'], (string) $title) !== false;
            })
        );
    }

    public function test_presentation_merge_for_overlapping_achievement(): void
    {
        $out = (new InsightQualityCalibrator())->calibrate($this->sampleInsights());
        $ids = array_column($out['presentation_sections'], 'id');
        $this->assertContains('executive_achievement', $ids);
        $this->assertContains('executive_risk', $ids);

        // Rules remain independent in insights list.
        $insightIds = array_column($out['insights'], 'id');
        $this->assertContains('high_progress', $insightIds);
        $this->assertContains('fast_learner', $insightIds);
        $this->assertContains('learning_excellence', $insightIds);
    }

    public function test_no_duplicate_insight_cards(): void
    {
        $duped = array_merge($this->sampleInsights(), [
            $this->sampleInsights()[0],
        ]);
        $out = (new InsightQualityCalibrator())->calibrate($duped);
        $ids = array_column($out['insights'], 'id');
        $this->assertSame(count($ids), count(array_unique($ids)));
    }

    public function test_provider_exposes_calibrated_contract(): void
    {
        $reader = \Mockery::mock(\App\Services\SmartInsight\InsightMetricsReader::class);
        $engine = \Mockery::mock(SmartInsightEngine::class);
        $reader->shouldReceive('build')->once()->andReturn([
            'student_id' => 9,
            'generated_at' => '2026-07-18T00:00:00+00:00',
        ]);
        $engine->shouldReceive('generate')->once()->andReturn($this->sampleInsights());

        $provider = new SmartInsightProvider($reader, $engine, new InsightQualityCalibrator());
        $payload = $provider->build(['student_id' => 9]);

        $this->assertTrue($payload['available']);
        $this->assertArrayHasKey('executive_summary', $payload);
        $this->assertArrayHasKey('executive_score', $payload);
        $this->assertArrayHasKey('categories', $payload);
        $this->assertArrayHasKey('recommendations', $payload);
        $this->assertArrayHasKey('presentation_sections', $payload);
        $this->assertNotNull($payload['text']);
        $this->assertSame(45, app(InsightRuleRegistry::class)->count());
    }

    protected function tearDown(): void
    {
        \Mockery::close();
        parent::tearDown();
    }
}
