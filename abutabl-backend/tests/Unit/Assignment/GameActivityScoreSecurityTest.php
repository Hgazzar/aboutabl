<?php

namespace Tests\Unit\Assignment;

use App\Services\Assignment\AssignActivitySubmissionService;
use Tests\TestCase;

/**
 * Documents Game Multi-Activity security: client score/percent must not be authoritative.
 */
class GameActivityScoreSecurityTest extends TestCase
{
    public function test_game_submit_branch_does_not_assign_client_score_fields(): void
    {
        $source = file_get_contents(
            app_path('Services/Assignment/AssignActivitySubmissionService.php')
        );

        $this->assertNotFalse($source);
        $this->assertTrue(method_exists(AssignActivitySubmissionService::class, 'submit'));

        // Security contract: game branch must null authoritative score columns.
        $this->assertStringContainsString("TYPE_GAME", $source);
        $this->assertStringContainsString("\$submission->score = null;", $source);
        $this->assertStringContainsString("\$submission->max_score = null;", $source);
        $this->assertStringContainsString("\$submission->percent = null;", $source);
        $this->assertStringContainsString("'score_trusted' => false", $source);

        // Must not blindly cast client payload into score/percent (removed insecure path).
        $this->assertStringNotContainsString(
            "\$score = isset(\$payload['score']) ? (float) \$payload['score'] : null;",
            $source
        );
    }
}
