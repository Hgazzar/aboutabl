import { describe, expect, it } from 'vitest';
import { resolveLivePlayChestImage, resolveLivePlayMediaUrl } from './livePlayMediaUrl';

describe('resolveLivePlayMediaUrl', () => {
	it('prefixes catalog storage paths so Vite can proxy them', () => {
		expect(resolveLivePlayMediaUrl('storage/files_maanger/monkey.png')).toBe(
			'/storage/files_maanger/monkey.png'
		);
		expect(resolveLivePlayMediaUrl('/storage/files_maanger/monkey.png')).toBe(
			'/storage/files_maanger/monkey.png'
		);
	});

	it('rewrites standalone treasure paths to student game assets', () => {
		expect(resolveLivePlayMediaUrl('/assets/images/treasure2.png')).toBe(
			'/assets/games/images/treasure2.png'
		);
	});

	it('leaves absolute and non-storage paths unchanged', () => {
		expect(resolveLivePlayMediaUrl('https://cdn.example/a.png')).toBe(
			'https://cdn.example/a.png'
		);
		expect(resolveLivePlayMediaUrl('/q.png')).toBe('/q.png');
		expect(resolveLivePlayMediaUrl('/assets/games/images/x.png')).toBe(
			'/assets/games/images/x.png'
		);
	});

	it('returns null for empty values', () => {
		expect(resolveLivePlayMediaUrl(null)).toBeNull();
		expect(resolveLivePlayMediaUrl('')).toBeNull();
		expect(resolveLivePlayMediaUrl('   ')).toBeNull();
	});

	it('falls back to distinct chest art when the API omits images', () => {
		expect(resolveLivePlayChestImage(null, 0)).toBe('/assets/games/images/treasure1.png');
		expect(resolveLivePlayChestImage(null, 1)).toBe('/assets/games/images/treasure2.png');
		expect(resolveLivePlayChestImage(null, 2)).toBe('/assets/games/images/treasure3.png');
	});
});
