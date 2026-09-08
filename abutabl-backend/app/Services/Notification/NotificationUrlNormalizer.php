<?php

namespace App\Services\Notification;

/**
 * NOTIF-001 Phase 2 — notification deep-link URL normalization (read boundary).
 *
 * Does not rewrite historical DB rows. Does not invent SPA routes.
 *
 * Policy:
 * - Relative paths → ensure leading "/" (safe for admin window.open + student navigate)
 * - Absolute URLs on known AbuTabl app hosts → strip to path (+ query/hash)
 * - Other absolute (external) URLs → preserved as-is
 * - Never inject a production frontend host into API responses
 */
class NotificationUrlNormalizer
{
    /**
     * Hosts historically used as absolute prefixes for in-app notification links.
     * Matched case-insensitively; only these are rewritten to relative paths.
     *
     * @var list<string>
     */
    public const KNOWN_APP_HOSTS = [
        'aboutablsite.poultrystore.net',
        'aboutabl.com',
        'www.aboutabl.com',
        'www.aboutablsite.poultrystore.net',
    ];

    /**
     * Normalize a stored notification URL for API list responses.
     */
    public function forApiResponse(?string $url): ?string
    {
        if ($url === null) {
            return null;
        }

        $trimmed = trim($url);
        if ($trimmed === '' || strcasecmp($trimmed, 'null') === 0 || strcasecmp($trimmed, 'undefined') === 0) {
            return null;
        }

        // Protocol-relative URLs (//host/...) must not be treated as SPA paths —
        // that would open-redirect via frontend navigate(). Rewrite to https:// then
        // apply the same known-host / external absolute policy.
        if (str_starts_with($trimmed, '//')) {
            return $this->normalizeAbsolute('https:'.$trimmed);
        }

        if (preg_match('#^https?://#i', $trimmed) === 1) {
            return $this->normalizeAbsolute($trimmed);
        }

        // Non-http(s) schemes (javascript:, data:, etc.) are not valid deep links.
        if (preg_match('#^[a-z][a-z0-9+.-]*:#i', $trimmed) === 1) {
            return null;
        }

        return $this->ensureLeadingSlash($trimmed);
    }

    private function normalizeAbsolute(string $url): string
    {
        $parts = parse_url($url);
        if ($parts === false || ! isset($parts['host'])) {
            return $url;
        }

        $host = strtolower((string) $parts['host']);
        if (! in_array($host, self::KNOWN_APP_HOSTS, true)) {
            // External / unknown absolute — preserve intentionally.
            return $url;
        }

        $path = (string) ($parts['path'] ?? '/');
        if ($path === '') {
            $path = '/';
        }

        $relative = $this->ensureLeadingSlash($path);
        if (! empty($parts['query'])) {
            $relative .= '?'.$parts['query'];
        }
        if (! empty($parts['fragment'])) {
            $relative .= '#'.$parts['fragment'];
        }

        return $relative;
    }

    private function ensureLeadingSlash(string $path): string
    {
        if ($path === '' || $path[0] === '/') {
            return $path === '' ? '/' : $path;
        }

        return '/'.$path;
    }
}
