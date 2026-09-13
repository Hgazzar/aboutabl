import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	FIGMA_DEFAULT_AVATAR,
	resolveCurrentStudentAvatarSrc,
	resolveStudentAvatarSrc,
	STUDENT_AVATAR_PRESETS,
} from './studentAvatar';

function mockLocalStorage() {
	const store = new Map<string, string>();
	vi.stubGlobal('localStorage', {
		getItem: (key: string) => store.get(key) ?? null,
		setItem: (key: string, value: string) => {
			store.set(key, value);
		},
		removeItem: (key: string) => {
			store.delete(key);
		},
		clear: () => store.clear(),
		key: () => null,
		length: 0,
	});
}

describe('resolveStudentAvatarSrc', () => {
	it('uses API photo when a valid uploaded photo URL exists', () => {
		expect(
			resolveStudentAvatarSrc({
				photoUrl: 'https://cdn.example/me.png',
				avatarPreset: 'a2',
			})
		).toBe('https://cdn.example/me.png');
	});

	it('uses preset when API photo is missing', () => {
		const presetUrl = STUDENT_AVATAR_PRESETS.find((preset) => preset.id === 'a2')?.url;
		expect(presetUrl).toBeTruthy();
		expect(resolveStudentAvatarSrc({ photoUrl: null, avatarPreset: 'a2' })).toBe(presetUrl);
	});

	it('falls back to the default avatar when photo and preset are missing', () => {
		expect(resolveStudentAvatarSrc({ photoUrl: null, avatarPreset: null })).toBe(
			FIGMA_DEFAULT_AVATAR
		);
	});
});

describe('resolveCurrentStudentAvatarSrc', () => {
	beforeEach(() => {
		mockLocalStorage();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('uses stored photo while API photo is still loading (undefined)', () => {
		localStorage.setItem(
			'user_info',
			JSON.stringify({ photo: 'https://cdn.example/stored.png', avatar_preset: 'a2' })
		);
		expect(resolveCurrentStudentAvatarSrc(undefined)).toBe('https://cdn.example/stored.png');
	});

	it('uses stored preset while loading when there is no stored photo', () => {
		const presetUrl = STUDENT_AVATAR_PRESETS.find((preset) => preset.id === 'a3')?.url;
		localStorage.setItem('user_info', JSON.stringify({ avatar_preset: 'a3' }));
		expect(resolveCurrentStudentAvatarSrc(undefined)).toBe(presetUrl);
	});

	it('ignores stale stored photo when API confirms null', () => {
		const presetUrl = STUDENT_AVATAR_PRESETS.find((preset) => preset.id === 'a2')?.url;
		localStorage.setItem(
			'user_info',
			JSON.stringify({ photo: 'https://cdn.example/old.png', avatar_preset: 'a2' })
		);
		expect(resolveCurrentStudentAvatarSrc(null)).toBe(presetUrl);
	});

	it('prefers a fresh API photo over the stored preset', () => {
		localStorage.setItem('user_info', JSON.stringify({ avatar_preset: 'a2' }));
		expect(resolveCurrentStudentAvatarSrc('https://cdn.example/api.png')).toBe(
			'https://cdn.example/api.png'
		);
	});
});
