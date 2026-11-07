<?php

namespace App\Support\LiveCompetitions;

use Illuminate\Support\Carbon;
use RuntimeException;

/**
 * Signed, expiring, single-use preview tokens.
 *
 * One-time consumption is serialized with flock on a local marker file so two
 * confirms on the same app server cannot both succeed. This is not a database
 * table. Multi-server deploys need a shared lock (Redis) to keep the same
 * guarantee across machines.
 */
class LiveCompetitionPreviewTokenGuard
{
    public function ttlSeconds(): int
    {
        $ttl = (int) config('live_competitions.preview_token_ttl_seconds', 600);

        return $ttl > 0 ? $ttl : 600;
    }

    /**
     * @param  array<string,mixed>  $game
     * @param  list<array<string,mixed>>  $questions
     */
    public function issue(int $userId, array $game, array $questions): string
    {
        if ($userId <= 0) {
            throw new RuntimeException('Preview tokens require an authenticated admin.');
        }

        $jti = bin2hex(random_bytes(16));
        $exp = Carbon::now()->getTimestamp() + $this->ttlSeconds();
        $hash = $this->contentHash($game, $questions);
        $claims = [
            'jti' => $jti,
            'uid' => $userId,
            'exp' => $exp,
            'hash' => $hash,
        ];

        $this->writeMarker($jti, [
            'status' => 'issued',
            'uid' => $userId,
            'hash' => $hash,
            'exp' => $exp,
        ], true);

        return $this->sign($claims);
    }

    /**
     * Verify signature, expiry, admin binding, and content hash, then consume.
     *
     * @param  array<string,mixed>  $game
     * @param  list<array<string,mixed>>  $questions
     */
    public function consume(string $token, int $userId, array $game, array $questions): void
    {
        $claims = $this->parse($token);

        if ((int) $claims['uid'] !== $userId || $userId <= 0) {
            throw new RuntimeException('Preview token does not belong to this admin.');
        }
        if (Carbon::now()->getTimestamp() >= (int) $claims['exp']) {
            throw new RuntimeException('Preview token has expired.');
        }

        $hash = $this->contentHash($game, $questions);
        if (! hash_equals((string) $claims['hash'], $hash)) {
            throw new RuntimeException('Workbook does not match the validated preview.');
        }

        $this->consumeMarker((string) $claims['jti'], $userId, $hash, (int) $claims['exp']);
    }

    /**
     * @param  array<string,mixed>  $game
     * @param  list<array<string,mixed>>  $questions
     */
    public function contentHash(array $game, array $questions): string
    {
        $canonical = json_encode(
            ['game' => $game, 'questions' => $questions],
            JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
        );

        return hash_hmac('sha256', (string) $canonical, $this->secret());
    }

    /**
     * @param  array{jti:string,uid:int,exp:int,hash:string}  $claims
     */
    public function sign(array $claims): string
    {
        $payload = $this->b64(json_encode($claims, JSON_UNESCAPED_SLASHES));

        return $payload.'.'.hash_hmac('sha256', $payload, $this->secret());
    }

    /**
     * @return array{jti:string,uid:int,exp:int,hash:string}
     */
    public function parse(string $token): array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 2 || $parts[0] === '' || $parts[1] === '') {
            throw new RuntimeException('Preview token is invalid.');
        }

        $expected = hash_hmac('sha256', $parts[0], $this->secret());
        if (! hash_equals($expected, $parts[1])) {
            throw new RuntimeException('Preview token is invalid.');
        }

        $claims = json_decode($this->unb64($parts[0]), true);
        if (! is_array($claims) || empty($claims['jti']) || empty($claims['hash'])) {
            throw new RuntimeException('Preview token is invalid.');
        }
        if (! isset($claims['uid'], $claims['exp'])) {
            throw new RuntimeException('Preview token is invalid.');
        }

        return [
            'jti' => (string) $claims['jti'],
            'uid' => (int) $claims['uid'],
            'exp' => (int) $claims['exp'],
            'hash' => (string) $claims['hash'],
        ];
    }

    /**
     * @param  array<string,mixed>  $data
     */
    protected function writeMarker(string $jti, array $data, bool $createOnly): void
    {
        $path = $this->markerPath($jti);
        $fp = fopen($path, $createOnly ? 'x' : 'c+');
        if ($fp === false) {
            throw new RuntimeException('Preview token could not be issued.');
        }
        try {
            if (! flock($fp, LOCK_EX)) {
                throw new RuntimeException('Preview token could not be issued.');
            }
            ftruncate($fp, 0);
            rewind($fp);
            fwrite($fp, json_encode($data));
            fflush($fp);
        } finally {
            flock($fp, LOCK_UN);
            fclose($fp);
        }
    }

    protected function consumeMarker(string $jti, int $userId, string $hash, int $exp): void
    {
        $path = $this->markerPath($jti);
        $fp = fopen($path, 'r+');
        if ($fp === false) {
            throw new RuntimeException('Preview token is invalid or expired.');
        }
        try {
            if (! flock($fp, LOCK_EX)) {
                throw new RuntimeException('Preview token is already being confirmed.');
            }
            $raw = stream_get_contents($fp);
            $state = is_string($raw) && $raw !== '' ? json_decode($raw, true) : null;
            if (! is_array($state) || ($state['status'] ?? '') === '') {
                throw new RuntimeException('Preview token is invalid or expired.');
            }
            if (($state['status'] ?? '') === 'used') {
                throw new RuntimeException('Preview token has already been used.');
            }
            if (($state['status'] ?? '') !== 'issued') {
                throw new RuntimeException('Preview token is invalid or expired.');
            }
            if ((int) ($state['uid'] ?? 0) !== $userId
                || ! hash_equals((string) ($state['hash'] ?? ''), $hash)) {
                throw new RuntimeException('Preview token is invalid.');
            }
            if (Carbon::now()->getTimestamp() >= (int) ($state['exp'] ?? $exp)) {
                throw new RuntimeException('Preview token has expired.');
            }

            $used = [
                'status' => 'used',
                'uid' => $userId,
                'hash' => $hash,
                'exp' => $exp,
            ];
            ftruncate($fp, 0);
            rewind($fp);
            fwrite($fp, json_encode($used));
            fflush($fp);
        } finally {
            flock($fp, LOCK_UN);
            fclose($fp);
        }
    }

    protected function markerPath(string $jti): string
    {
        if (! preg_match('/^[a-f0-9]{32}$/', $jti)) {
            throw new RuntimeException('Preview token is invalid.');
        }

        $dir = storage_path('framework/cache/live-competitions-preview');
        if (! is_dir($dir) && ! mkdir($dir, 0755, true) && ! is_dir($dir)) {
            throw new RuntimeException('Preview token store is unavailable.');
        }

        return $dir.'/'.$jti.'.json';
    }

    protected function secret(): string
    {
        return (string) config('app.key');
    }

    protected function b64(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }

    protected function unb64(string $value): string
    {
        $remainder = strlen($value) % 4;
        if ($remainder) {
            $value .= str_repeat('=', 4 - $remainder);
        }

        $decoded = base64_decode(strtr($value, '-_', '+/'), true);

        return is_string($decoded) ? $decoded : '';
    }
}
