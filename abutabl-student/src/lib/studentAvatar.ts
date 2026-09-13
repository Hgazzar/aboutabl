import { figmaNavbarAssetUrl } from 'config/figmaAssets';
import preset0 from 'assets/images/figma/navbar/avatars/preset-0.png';
import preset1 from 'assets/images/figma/navbar/avatars/preset-1.png';
import preset2 from 'assets/images/figma/navbar/avatars/preset-2.png';
import preset3 from 'assets/images/figma/navbar/avatars/preset-3.png';
import preset4 from 'assets/images/figma/navbar/avatars/preset-4.png';
import preset5 from 'assets/images/figma/navbar/avatars/preset-5.png';
import preset6 from 'assets/images/figma/navbar/avatars/preset-6.png';
import preset7 from 'assets/images/figma/navbar/avatars/preset-7.png';
import preset8 from 'assets/images/figma/navbar/avatars/preset-8.png';

/** Figma STUDENT-01 — Ellipse 649 avatar ring (navBar). */
export const FIGMA_AVATAR_RING = figmaNavbarAssetUrl('ellipse-649.svg');

export type StudentAvatarPreset = {
	id: string;
	url: string;
};

/**
 * Figma Frame 76 — 9 selectable student avatars (3×3 grid, row-major).
 */
export const STUDENT_AVATAR_PRESETS: StudentAvatarPreset[] = [
	{ id: 'a1', url: preset0 },
	{ id: 'a2', url: preset1 },
	{ id: 'a3', url: preset2 },
	{ id: 'a4', url: preset3 },
	{ id: 'a5', url: preset4 },
	{ id: 'a6', url: preset5 },
	{ id: 'a7', url: preset6 },
	{ id: 'a8', url: preset7 },
	{ id: 'a9', url: preset8 },
];

const PRESET_URL_BY_ID = Object.fromEntries(STUDENT_AVATAR_PRESETS.map((p) => [p.id, p.url]));

/** Assigned on first activation until the student picks another. */
export const DEFAULT_AVATAR_PRESET_ID = 'a1';

/** Default when no photo and no preset chosen. */
export const FIGMA_DEFAULT_AVATAR = PRESET_URL_BY_ID[DEFAULT_AVATAR_PRESET_ID];

export function readStoredAvatarPresetId(): string | null {
	try {
		const raw = localStorage.getItem('user_info');
		if (!raw) return null;
		const user = JSON.parse(raw) as { avatar_preset?: string };
		return user?.avatar_preset?.trim() || null;
	} catch {
		return null;
	}
}

export function isStudentAvatarPresetId(value: string | null | undefined): value is string {
	if (!value) return false;
	return value in PRESET_URL_BY_ID;
}

export function resolveStudentAvatarPresetUrl(presetId: string | null | undefined): string | null {
	const id = presetId?.trim();
	if (!id) return null;
	return PRESET_URL_BY_ID[id] ?? null;
}

export function persistStudentAvatarPreset(presetId: string): void {
	if (!isStudentAvatarPresetId(presetId)) return;
	try {
		const raw = localStorage.getItem('user_info');
		const userInfo = raw ? JSON.parse(raw) : {};
		userInfo.avatar_preset = presetId;
		localStorage.setItem('user_info', JSON.stringify(userInfo));
		window.dispatchEvent(new CustomEvent('student-avatar-updated'));
	} catch {
		// ignore storage errors
	}
}

type UserInfoRecord = Record<string, unknown>;

function hasUploadedPhoto(user: UserInfoRecord): boolean {
	const photo = typeof user.photo === 'string' ? user.photo.trim() : '';
	return photo.length > 0;
}

/** First activation: attach the default Figma avatar if the student has not chosen one yet. */
export function withDefaultStudentAvatar<T extends UserInfoRecord>(user: T): T {
	if (user.needs_avatar_selection === true) return user;
	if (isStudentAvatarPresetId(String(user.avatar_preset ?? ''))) return user;
	if (hasUploadedPhoto(user)) return user;
	return { ...user, avatar_preset: DEFAULT_AVATAR_PRESET_ID };
}

/** True when login/profile says the student must complete first-login avatar pick. */
export function studentNeedsAvatarSelection(): boolean {
	try {
		const raw = localStorage.getItem('user_info');
		if (!raw) return false;
		const user = JSON.parse(raw) as { needs_avatar_selection?: boolean };
		return user?.needs_avatar_selection === true;
	} catch {
		return false;
	}
}

/** After POST /avatar/select — persist preset and clear the onboarding gate. */
export function markStudentAvatarOnboardingComplete(presetId: string): void {
	if (!isStudentAvatarPresetId(presetId)) return;
	try {
		const raw = localStorage.getItem('user_info');
		const userInfo = (raw ? JSON.parse(raw) : {}) as UserInfoRecord;
		userInfo.avatar_preset = presetId;
		userInfo.needs_avatar_selection = false;
		localStorage.setItem('user_info', JSON.stringify(userInfo));
		window.dispatchEvent(new CustomEvent('student-avatar-updated'));
	} catch {
		// ignore storage errors
	}
}

export function ensureDefaultStudentAvatarStored(): void {
	try {
		const raw = localStorage.getItem('user_info');
		if (!raw) return;
		const user = JSON.parse(raw) as UserInfoRecord;
		const next = withDefaultStudentAvatar(user);
		if (next.avatar_preset === user.avatar_preset) return;
		localStorage.setItem('user_info', JSON.stringify(next));
		window.dispatchEvent(new CustomEvent('student-avatar-updated'));
	} catch {
		// ignore storage errors
	}
}

/**
 * Resolve avatar image — uploaded API photo first, then Figma preset,
 * then default.
 */
export function resolveStudentAvatarSrc(options?: {
	photoUrl?: string | null;
	avatarPreset?: string | null;
}): string {
	const photo = options?.photoUrl?.trim();
	if (photo) return photo;

	const preset = (options?.avatarPreset ?? readStoredAvatarPresetId())?.trim();
	const presetUrl = preset ? PRESET_URL_BY_ID[preset] : null;
	if (presetUrl) return presetUrl;

	return FIGMA_DEFAULT_AVATAR;
}

export function readStoredStudentPhotoUrl(): string | null {
	try {
		const raw = localStorage.getItem('user_info');
		if (!raw) return null;
		const user = JSON.parse(raw) as { photo?: string | null };
		const photo = typeof user.photo === 'string' ? user.photo.trim() : '';
		return photo || null;
	} catch {
		return null;
	}
}

/**
 * Signed-in student avatar for navbar / dashboard hello — same photo→preset→default rule.
 * Pass `undefined` while API data is loading (use stored photo); pass `null` when API
 * confirmed there is no uploaded photo.
 */
export function resolveCurrentStudentAvatarSrc(apiPhotoUrl?: string | null): string {
	const photoUrl =
		apiPhotoUrl === undefined ? readStoredStudentPhotoUrl() : apiPhotoUrl?.trim() || null;

	return resolveStudentAvatarSrc({
		photoUrl,
		avatarPreset: readStoredAvatarPresetId(),
	});
}

/** Keep localStorage photo in sync with navbar/dashboard so shell avatars stay stable. */
export function syncStoredStudentPhotoUrl(photoUrl: string | null | undefined): void {
	try {
		const raw = localStorage.getItem('user_info');
		if (!raw) return;
		const userInfo = JSON.parse(raw) as UserInfoRecord;
		const nextPhoto =
			typeof photoUrl === 'string' && photoUrl.trim() ? photoUrl.trim() : null;
		const prevPhoto =
			typeof userInfo.photo === 'string' && userInfo.photo.trim() ? userInfo.photo.trim() : null;
		if (nextPhoto === prevPhoto) return;
		if (nextPhoto) {
			userInfo.photo = nextPhoto;
		} else {
			delete userInfo.photo;
		}
		localStorage.setItem('user_info', JSON.stringify(userInfo));
	} catch {
		// ignore storage errors
	}
}
