import { resolveStudentApiBaseUrl } from 'lib/studentApiBaseUrl';
import type { MaterialVisualKind } from './assignmentMaterialIcons';

/** Backend origin that serves `/storage/...` (and absolute APP_URL assets). */
function resolveStorageOrigin(): string {
	const explicit = (
		import.meta.env.VITE_STORAGE_ORIGIN ||
		import.meta.env.VITE_PROXY_TARGET ||
		''
	).trim();
	if (explicit) {
		return explicit.replace(/\/$/, '');
	}

	const apiBase = resolveStudentApiBaseUrl().replace(/\/$/, '');
	if (/^https?:\/\//i.test(apiBase)) {
		try {
			return new URL(apiBase).origin;
		} catch {
			// fall through
		}
	}

	// Local Vite uses relative `/api/student` proxy → Laravel on :8000
	return 'http://127.0.0.1:8000';
}

function isLocalDevHost(hostname: string): boolean {
	return (
		hostname === '127.0.0.1' ||
		hostname === 'localhost' ||
		hostname === '0.0.0.0' ||
		hostname === '[::1]'
	);
}

/**
 * Prefer same-origin `/storage/...` so Vite can proxy locally and <img>/<audio> work
 * without CORS. Keep absolute URLs for real remote CDNs.
 */
function maybeRewriteStorageToSameOrigin(absoluteUrl: string): string {
	try {
		const parsed = new URL(absoluteUrl);
		if (!parsed.pathname.startsWith('/storage/')) {
			return absoluteUrl;
		}

		const storageOrigin = resolveStorageOrigin();
		let storageHost = '';
		try {
			storageHost = new URL(storageOrigin).hostname;
		} catch {
			storageHost = '';
		}

		const sameBackendHost =
			storageHost !== '' && parsed.hostname === storageHost;
		const localDev =
			import.meta.env.DEV &&
			isLocalDevHost(parsed.hostname) &&
			(parsed.port === '8000' || parsed.port === '');

		if (sameBackendHost || localDev) {
			return `${parsed.pathname}${parsed.search}`;
		}
	} catch {
		// fall through
	}
	return absoluteUrl;
}

/**
 * Resolve API-relative storage paths (e.g. `/storage/...`) against the backend origin.
 * Absolute http(s) URLs (external links) pass through unchanged (except local /storage rewrite).
 */
export function resolveAssignmentAssetUrl(url: string | null | undefined): string | null {
	const raw = (url || '').trim();
	if (!raw) return null;

	// Block non-http(s) schemes before any rewriting.
	if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw) && !/^https?:\/\//i.test(raw)) {
		return null;
	}

	if (/^https?:\/\//i.test(raw)) {
		return maybeRewriteStorageToSameOrigin(raw);
	}

	if (raw.startsWith('//')) {
		return maybeRewriteStorageToSameOrigin(`https:${raw}`);
	}

	// Already a site-relative storage path (Vite proxies `/storage` in local dev).
	if (raw.startsWith('/storage/')) {
		return raw;
	}

	const path = raw.startsWith('/') ? raw : `/${raw}`;
	if (path.startsWith('/storage/')) {
		return path;
	}

	return `${resolveStorageOrigin()}${path}`;
}

/** Only allow http(s) navigation for material links / file opens. */
export function isSafeHttpUrl(url: string | null | undefined): boolean {
	const resolved = resolveAssignmentAssetUrl(url);
	if (!resolved) return false;
	if (resolved.startsWith('/')) {
		return resolved.startsWith('/storage/');
	}
	try {
		const parsed = new URL(resolved);
		return parsed.protocol === 'http:' || parsed.protocol === 'https:';
	} catch {
		return false;
	}
}

export type AssignmentAssetOpenMode = 'preview-image' | 'open-tab' | 'download' | 'none';

/**
 * How the student UI should open a materials / my-work asset.
 * Images stay in-app; office docs download; PDF + external links use a new tab; voice is inline only.
 */
export function assignmentAssetOpenMode(visual: MaterialVisualKind): AssignmentAssetOpenMode {
	if (visual === 'image') return 'preview-image';
	if (visual === 'voice') return 'none';
	if (visual === 'document') return 'download';
	if (visual === 'pdf' || visual === 'link') return 'open-tab';
	return 'open-tab';
}

export function openAssignmentAssetUrl(url: string | null | undefined): void {
	const resolved = resolveAssignmentAssetUrl(url);
	if (!resolved || !isSafeHttpUrl(resolved)) return;
	window.open(resolved, '_blank', 'noopener,noreferrer');
}

function triggerBrowserDownload(objectOrHttpUrl: string, filename: string): void {
	const anchor = document.createElement('a');
	anchor.href = objectOrHttpUrl;
	anchor.download = filename;
	anchor.rel = 'noopener noreferrer';
	// Intentionally NO target=_blank — that was opening empty/broken browser tabs.
	document.body.appendChild(anchor);
	anchor.click();
	anchor.remove();
}

/**
 * Trigger a file download without opening a new browser tab.
 * Fetches as blob first so cross-origin `download` attributes are not required.
 */
export async function downloadAssignmentAssetUrl(
	url: string | null | undefined,
	filename?: string | null
): Promise<void> {
	const resolved = resolveAssignmentAssetUrl(url);
	if (!resolved || !isSafeHttpUrl(resolved)) return;

	const safeName = (filename || '').trim() || 'download';

	try {
		const response = await fetch(resolved, { credentials: 'include' });
		if (!response.ok) {
			throw new Error(`download_failed_${response.status}`);
		}
		const blob = await response.blob();
		const objectUrl = URL.createObjectURL(blob);
		triggerBrowserDownload(objectUrl, safeName);
		window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);
	} catch {
		triggerBrowserDownload(resolved, safeName);
	}
}

export function downloadBlobAsFile(blob: Blob, filename?: string | null): void {
	const safeName = (filename || '').trim() || 'download';
	const objectUrl = URL.createObjectURL(blob);
	triggerBrowserDownload(objectUrl, safeName);
	window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);
}

export type AssignmentAssetOpenInput = {
	visual: MaterialVisualKind;
	url: string | null | undefined;
	filename?: string | null;
};

export type AssignmentAssetOpenResult =
	| { mode: 'preview-image'; url: string }
	| { mode: 'open-tab' }
	| { mode: 'download' }
	| { mode: 'none' };

/**
 * Execute the correct open action for a visual kind (public storage / external links).
 * For `preview-image`, the caller must show an in-app preview using the returned url.
 */
export async function openAssignmentAsset(
	input: AssignmentAssetOpenInput
): Promise<AssignmentAssetOpenResult> {
	const mode = assignmentAssetOpenMode(input.visual);
	const resolved = resolveAssignmentAssetUrl(input.url);

	if (mode === 'none' || !resolved || !isSafeHttpUrl(resolved)) {
		return { mode: 'none' };
	}

	if (mode === 'preview-image') {
		return { mode: 'preview-image', url: resolved };
	}

	if (mode === 'download') {
		await downloadAssignmentAssetUrl(resolved, input.filename);
		return { mode: 'download' };
	}

	openAssignmentAssetUrl(resolved);
	return { mode: 'open-tab' };
}
