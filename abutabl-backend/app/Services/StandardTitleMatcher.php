<?php

namespace App\Services;

use App\Models\Standard;

class StandardTitleMatcher
{
    /** @var array<string, array<int, string>>|null */
    private ?array $keywordMap = null;

    /**
     * @return array<int, array{id: int, source: string, reason: string, confidence_score: float}>
     */
    public function match(int $subjectId, string ...$titleParts): array
    {
        $text = strtolower(trim(implode(' ', array_filter($titleParts))));

        if ($text === '') {
            return [];
        }

        $standards = Standard::query()
            ->where('subject_id', $subjectId)
            ->where('status', 1)
            ->get(['id', 'code', 'definition']);

        $matches = [];

        foreach ($standards as $standard) {
            if ($this->titleContainsCode($text, $standard->code)) {
                $matches[$standard->id] = [
                    'id'                => (int) $standard->id,
                    'source'            => 'code_match',
                    'reason'            => sprintf('Standard code "%s" found in content title.', $standard->code),
                    'confidence_score'  => 0.95,
                ];

                continue;
            }

            $keyword = $this->findMatchingKeyword($text, $standard->code);

            if ($keyword !== null) {
                $matches[$standard->id] = [
                    'id'                => (int) $standard->id,
                    'source'            => 'title_match',
                    'reason'            => sprintf('Keyword "%s" matched in content title for %s.', $keyword, $standard->code),
                    'confidence_score'  => 0.75,
                ];
            }
        }

        return array_values($matches);
    }

    private function titleContainsCode(string $text, string $code): bool
    {
        $normalizedCode = strtolower(str_replace(' ', '', $code));
        $normalizedText = str_replace(' ', '', $text);

        if (str_contains($normalizedText, $normalizedCode)) {
            return true;
        }

        $pattern = '/\b'.preg_quote($code, '/').'\b/i';

        return (bool) preg_match($pattern, $text);
    }

    private function findMatchingKeyword(string $text, string $code): ?string
    {
        foreach ($this->keywordsForCode($code) as $keyword) {
            $keyword = strtolower(trim($keyword));

            if ($keyword !== '' && str_contains($text, $keyword)) {
                return $keyword;
            }
        }

        return null;
    }

    /**
     * @return array<int, string>
     */
    private function keywordsForCode(string $code): array
    {
        if ($this->keywordMap === null) {
            $this->keywordMap = $this->buildKeywordMap();
        }

        return $this->keywordMap[$code] ?? [];
    }

    /**
     * @return array<string, array<int, string>>
     */
    private function buildKeywordMap(): array
    {
        $catalog = require database_path('data/ccss_standards.php');
        $map = [];

        foreach ($catalog as $domains) {
            foreach ($domains as $domain) {
                foreach ($domain['standards'] as $standard) {
                    $map[$standard['code']] = $standard['keywords'] ?? [];
                }
            }
        }

        return $map;
    }
}
