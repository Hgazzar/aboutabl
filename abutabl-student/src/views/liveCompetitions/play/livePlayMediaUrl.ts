/**
 * Resolve live-competition media paths for <img>/<audio>.
 * Catalog stores `storage/files_maanger/...` (no leading slash). Used as a relative
 * src that breaks on nested routes — normalize to `/storage/...` for the Vite proxy.
 */
export function resolveLivePlayMediaUrl(url: string | null | undefined): string | null {
	const raw = (url || '').trim();
	if (!raw) {
		return null;
	}
	if (/^https?:\/\//i.test(raw) || raw.startsWith('//')) {
		return raw.startsWith('//') ? `https:${raw}` : raw;
	}
	if (raw.startsWith('storage/') || raw.startsWith('/storage/')) {
		return raw.startsWith('/') ? raw : `/${raw}`;
	}
	// Standalone Gold Quest treasure paths → student SPA public assets.
	if (raw.includes('/assets/images/treasure')) {
		return raw.replace('/assets/images/', '/assets/games/images/');
	}
	return raw;
}

const CHEST_FALLBACK_IMAGES = [
	'/assets/games/images/treasure1.png',
	'/assets/games/images/treasure2.png',
	'/assets/games/images/treasure3.png',
] as const;

/** Prefer API image; otherwise distinct chest art by slot so icons always show. */
export function resolveLivePlayChestImage(
	url: string | null | undefined,
	slotIndex: number
): string {
	return (
		resolveLivePlayMediaUrl(url) ??
		CHEST_FALLBACK_IMAGES[((slotIndex % 3) + 3) % 3]
	);
}
