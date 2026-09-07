<?php

namespace App\Support\Assignment;

/**
 * Approved Learning Activity mappings (Phase 1).
 *
 * eBook  → lessons_contents (scorm/scrom) → automatic_completeness
 * Game   → games                          → automatic_accuracy
 * Worksheet → work_sheets                 → manual
 * Quiz   → quizes                         → automatic_accuracy
 */
final class LearningActivityMap
{
    public const TYPE_EBOOK = 'ebook';

    public const TYPE_GAME = 'game';

    public const TYPE_WORKSHEET = 'worksheet';

    public const TYPE_QUIZ = 'quiz';

    public const ASSIGN_TYPE = 'learning_activities';

    public const MAX_PER_ASSIGN = 10;

    public const GRADING_AUTOMATIC_COMPLETENESS = 'automatic_completeness';

    public const GRADING_AUTOMATIC_ACCURACY = 'automatic_accuracy';

    public const GRADING_MANUAL = 'manual';

    /** @var array<string, string> */
    public const SOURCE_TABLE = [
        self::TYPE_EBOOK => 'lessons_contents',
        self::TYPE_GAME => 'games',
        self::TYPE_WORKSHEET => 'work_sheets',
        self::TYPE_QUIZ => 'quizes',
    ];

    /** @var array<string, string> */
    public const GRADING_MODE = [
        self::TYPE_EBOOK => self::GRADING_AUTOMATIC_COMPLETENESS,
        self::TYPE_GAME => self::GRADING_AUTOMATIC_ACCURACY,
        self::TYPE_WORKSHEET => self::GRADING_MANUAL,
        self::TYPE_QUIZ => self::GRADING_AUTOMATIC_ACCURACY,
    ];

    /** eBook picker filter — approved Option 1. */
    public const EBOOK_CONTENT_TYPES = ['scorm', 'scrom'];

    /**
     * @return array<int, string>
     */
    public static function types(): array
    {
        return [
            self::TYPE_EBOOK,
            self::TYPE_GAME,
            self::TYPE_WORKSHEET,
            self::TYPE_QUIZ,
        ];
    }

    public static function isValidType(string $type): bool
    {
        return isset(self::SOURCE_TABLE[$type]);
    }

    public static function sourceTable(string $activityType): string
    {
        if (! self::isValidType($activityType)) {
            throw new \InvalidArgumentException('invalid_activity_type');
        }

        return self::SOURCE_TABLE[$activityType];
    }

    public static function gradingMode(string $activityType): string
    {
        if (! self::isValidType($activityType)) {
            throw new \InvalidArgumentException('invalid_activity_type');
        }

        return self::GRADING_MODE[$activityType];
    }

    /**
     * Section keys for Book → Section → Activities browser.
     *
     * @return array<int, array{key: string, activity_type: string, label: string}>
     */
    public static function sections(): array
    {
        return [
            ['key' => 'ebooks', 'activity_type' => self::TYPE_EBOOK, 'label' => 'eBooks'],
            ['key' => 'games', 'activity_type' => self::TYPE_GAME, 'label' => 'Games'],
            ['key' => 'worksheets', 'activity_type' => self::TYPE_WORKSHEET, 'label' => 'Worksheets'],
            ['key' => 'quizzes', 'activity_type' => self::TYPE_QUIZ, 'label' => 'Quizzes'],
        ];
    }
}
