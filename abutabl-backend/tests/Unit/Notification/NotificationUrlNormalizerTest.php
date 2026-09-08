<?php

namespace Tests\Unit\Notification;

use App\Services\Notification\NotificationUrlNormalizer;
use Tests\TestCase;

class NotificationUrlNormalizerTest extends TestCase
{
    private function normalizer(): NotificationUrlNormalizer
    {
        return new NotificationUrlNormalizer;
    }

    public function test_relative_paths_get_leading_slash(): void
    {
        $n = $this->normalizer();

        $this->assertSame('/todo', $n->forApiResponse('/todo'));
        $this->assertSame('/todo', $n->forApiResponse('todo'));
        $this->assertSame('/todo/assign/123', $n->forApiResponse('/todo/assign/123'));
        $this->assertSame('/learn/5/details/22', $n->forApiResponse('learn/5/details/22'));
        $this->assertSame('/subjects/quiz/9', $n->forApiResponse('subjects/quiz/9'));
        $this->assertSame('/user/student/view/1', $n->forApiResponse('user/student/view/1'));
    }

    public function test_strips_known_production_host_to_relative_path(): void
    {
        $n = $this->normalizer();

        $this->assertSame(
            '/subjects/quiz/23',
            $n->forApiResponse('https://aboutablsite.poultrystore.net/subjects/quiz/23')
        );
        $this->assertSame(
            '/todo',
            $n->forApiResponse('https://aboutabl.com/todo')
        );
        $this->assertSame(
            '/learn/5?x=1#y',
            $n->forApiResponse('https://www.aboutabl.com/learn/5?x=1#y')
        );
    }

    public function test_preserves_external_absolute_urls(): void
    {
        $n = $this->normalizer();

        $external = 'https://example.com/docs/guide';
        $this->assertSame($external, $n->forApiResponse($external));
    }

    public function test_null_and_empty_become_null(): void
    {
        $n = $this->normalizer();

        $this->assertNull($n->forApiResponse(null));
        $this->assertNull($n->forApiResponse(''));
        $this->assertNull($n->forApiResponse('   '));
        $this->assertNull($n->forApiResponse('null'));
    }

    public function test_never_emits_poultrystore_host_for_relative_input(): void
    {
        $n = $this->normalizer();
        $out = $n->forApiResponse('subjects/quiz/1');

        $this->assertStringNotContainsString('aboutablsite.poultrystore.net', (string) $out);
        $this->assertSame('/subjects/quiz/1', $out);
    }

    public function test_protocol_relative_known_host_becomes_relative_path(): void
    {
        $n = $this->normalizer();

        $this->assertSame(
            '/todo/assign/12',
            $n->forApiResponse('//aboutabl.com/todo/assign/12')
        );
    }

    public function test_protocol_relative_external_host_preserved_as_https(): void
    {
        $n = $this->normalizer();

        $this->assertSame(
            'https://evil.example/phish',
            $n->forApiResponse('//evil.example/phish')
        );
    }

    public function test_dangerous_schemes_become_null(): void
    {
        $n = $this->normalizer();

        $this->assertNull($n->forApiResponse('javascript:alert(1)'));
        $this->assertNull($n->forApiResponse('data:text/html,hi'));
    }
}
