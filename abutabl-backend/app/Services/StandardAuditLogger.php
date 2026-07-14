<?php

namespace App\Services;

use App\Models\ContentStandard;
use App\Models\StandardAuditLog;

class StandardAuditLogger
{
    public function logLinked(
        ContentStandard $link,
        string $reason,
        ?float $confidenceScore,
        string $linkType = 'automatic'
    ): void {
        $this->write($link, 'linked', $reason, $confidenceScore, $linkType);
    }

    public function logUnlinked(ContentStandard $link, string $reason, string $linkType = 'automatic'): void
    {
        $this->write($link, 'unlinked', $reason, null, $linkType);
    }

    private function write(
        ContentStandard $link,
        string $action,
        string $reason,
        ?float $confidenceScore,
        string $linkType
    ): void {
        StandardAuditLog::query()->create([
            'content_standard_id' => $link->id,
            'standard_id'         => (int) $link->standard_id,
            'action'              => $action,
            'reason'              => $reason,
            'confidence_score'    => $confidenceScore,
            'link_type'           => $linkType,
            'created_at'          => now(),
        ]);
    }

    public static function resolveLinkType(string $linkSource): string
    {
        return in_array($linkSource, ['manual', 'import'], true) ? 'manual' : 'automatic';
    }
}
