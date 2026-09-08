/**
 * Student notification helpers (NOTIF-001 Phase 3).
 * API list fields only — no invented timestamps / event_key / type UI.
 */

export type StudentNotificationItem = {
	id: number | string;
	title?: string | null;
	description?: string | null;
	is_read?: string | number | boolean | null;
	url?: string | null;
	from_id?: number | string | null;
	name?: string | null;
	photo?: string | null;
};

export function isNotificationUnread(item: { is_read?: string | number | boolean | null }): boolean {
	return item?.is_read === '0' || item?.is_read === 0 || item?.is_read === false;
}

export function countUnreadNotifications(items: Array<{ is_read?: string | number | boolean | null }> | null | undefined): number {
	if (!items?.length) return 0;
	return items.filter((item) => isNotificationUnread(item)).length;
}

export function formatUnreadBadgeCount(count: number): string {
	if (count > 99) return '99+';
	return String(Math.max(0, count));
}

export type NotificationNavTarget =
	| { kind: 'internal'; path: string }
	| { kind: 'external'; href: string }
	| { kind: 'none' };

/**
 * Classify Phase-2-normalized notification URLs for Student SPA navigation.
 * Does not invent alternate routes for legacy paths (Phase 5).
 */
export function resolveNotificationNavTarget(rawUrl: string | null | undefined): NotificationNavTarget {
	if (rawUrl == null) return { kind: 'none' };
	const url = String(rawUrl).trim();
	if (!url || url === 'null' || url === 'undefined') return { kind: 'none' };

	try {
		// Protocol-relative must not be treated as an SPA path (open-redirect).
		const absoluteCandidate = url.startsWith('//') ? `https:${url}` : url;

		if (/^https?:\/\//i.test(absoluteCandidate)) {
			const parsed = new URL(absoluteCandidate);
			if (typeof window !== 'undefined' && parsed.origin === window.location.origin) {
				return {
					kind: 'internal',
					path: `${parsed.pathname}${parsed.search}${parsed.hash}`,
				};
			}
			return { kind: 'external', href: absoluteCandidate };
		}

		if (/^[a-z][a-z0-9+.-]*:/i.test(url)) {
			return { kind: 'none' };
		}

		const path = url.startsWith('/') ? url : `/${url}`;
		return { kind: 'internal', path };
	} catch {
		return { kind: 'none' };
	}
}

export function openNotificationNavTarget(
	navigate: (to: string) => void,
	rawUrl: string | null | undefined
): void {
	const target = resolveNotificationNavTarget(rawUrl);
	if (target.kind === 'internal') {
		navigate(target.path);
		return;
	}
	if (target.kind === 'external') {
		window.open(target.href, '_blank', 'noopener,noreferrer');
	}
}
