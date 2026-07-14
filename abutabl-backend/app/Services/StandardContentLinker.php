<?php

namespace App\Services;

use App\Models\ContentStandard;

class StandardContentLinker
{
    private const AUTO_SOURCES = ['title_match', 'code_match', 'page_match'];

    public function __construct(
        private StandardTitleMatcher $matcher,
        private StandardAuditLogger $auditLogger
    ) {
    }

    public function syncLesson(int $lessonId, int $subjectId, string ...$titleParts): void
    {
        $this->sync('lessons', $lessonId, $subjectId, ...$titleParts);
    }

    public function syncQuiz(int $quizId, int $subjectId, string ...$titleParts): void
    {
        $this->sync('quizes', $quizId, $subjectId, ...$titleParts);
    }

    public function sync(string $contentType, int $contentId, int $subjectId, string ...$titleParts): void
    {
        if ($subjectId <= 0) {
            return;
        }

        $matches = $this->matcher->match($subjectId, ...$titleParts);
        $matchIds = collect($matches)->pluck('id')->all();

        $existingAutoLinks = ContentStandard::query()
            ->where('content_type', $contentType)
            ->where('content_id', $contentId)
            ->whereIn('link_source', self::AUTO_SOURCES)
            ->get();

        foreach ($existingAutoLinks as $link) {
            if (! in_array((int) $link->standard_id, $matchIds, true)) {
                $this->auditLogger->logUnlinked(
                    $link,
                    'Automatic link removed after title re-analysis.',
                    StandardAuditLogger::resolveLinkType((string) $link->link_source)
                );
            }
        }

        ContentStandard::query()
            ->where('content_type', $contentType)
            ->where('content_id', $contentId)
            ->whereIn('link_source', self::AUTO_SOURCES)
            ->delete();

        foreach ($matches as $match) {
            $link = ContentStandard::query()->updateOrCreate(
                [
                    'content_type' => $contentType,
                    'content_id'   => $contentId,
                    'standard_id'  => $match['id'],
                ],
                [
                    'link_source' => $match['source'],
                    'created_at'  => now(),
                ]
            );

            $this->auditLogger->logLinked(
                $link,
                $match['reason'],
                $match['confidence_score'],
                'automatic'
            );
        }
    }
}
