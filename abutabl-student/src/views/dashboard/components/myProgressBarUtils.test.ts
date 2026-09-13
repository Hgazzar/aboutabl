import { describe, expect, it } from 'vitest';
import {
	applyEqualTrackMarkerSpacing,
	applyTrackLevelStates,
	formatSignedWeeklyXp,
	isTrackLevelReached,
	trackMarkerSpacingShifts,
	weeklyXpTrend,
} from './myProgressBarUtils';

describe('weeklyXpTrend', () => {
	it('treats current week >= previous week as up', () => {
		expect(weeklyXpTrend(220, 0)).toBe('up');
		expect(weeklyXpTrend(150, 150)).toBe('up');
	});

	it('treats current week below previous week as down', () => {
		expect(weeklyXpTrend(80, 150)).toBe('down');
	});

	it('formats signed weekly XP from API values', () => {
		expect(formatSignedWeeklyXp(220, 0)).toBe('+220XP');
		expect(formatSignedWeeklyXp(80, 150)).toBe('-80XP');
	});
});

const SAMPLE_TRACK_SVG = [
	'<rect x="36" y="4" width="28.125" height="31.5" fill="url(#pattern0_2548_1906)"/>',
	'<path d="M24.414 65" fill="#EA780C"/>',
	'<rect x="198" y="4" width="28.125" height="31.5" fill="url(#pattern1_2548_1906)"/>',
	'<path d="M179.414 65" fill="#D76414"/>',
	'<rect x="339" y="4" width="28.125" height="31.5" fill="url(#pattern2_2548_1906)" style="mix-blend-mode:luminosity"/>',
	'<path d="M320.414 65" fill="#638460"/>',
	'<rect x="529" y="4" width="22.5094" height="31.5" fill="url(#pattern3_2548_1906)" style="mix-blend-mode:luminosity"/>',
	'<path d="M507.414 65" fill="#BDA776"/>',
].join('');

function markerState(svg: string, level: 9 | 10 | 11 | 12) {
	const rectByLevel = {
		9: 'x="36"',
		10: 'x="198"',
		11: 'x="339"',
		12: 'x="529"',
	} as const;
	const pathByLevel = {
		9: 'M24.414',
		10: 'M179.414',
		11: 'M320.414',
		12: 'M507.414',
	} as const;
	const rectIndex = svg.indexOf(rectByLevel[level]);
	const rectSlice = svg.slice(rectIndex, svg.indexOf('/>', rectIndex) + 2);
	const pathIndex = svg.indexOf(`d="${pathByLevel[level]}`);
	const fillIndex = svg.indexOf('fill="#', pathIndex);
	const fill = svg.slice(fillIndex, svg.indexOf('"', fillIndex + 7) + 1);

	return {
		inactive: rectSlice.includes('filter:grayscale(1)'),
		fill,
	};
}

describe('applyTrackLevelStates', () => {
	it('keeps levels 9-12 incomplete when current level is below 9', () => {
		const svg = applyTrackLevelStates(SAMPLE_TRACK_SVG, 2);
		expect(isTrackLevelReached(2, 9)).toBe(false);
		expect(markerState(svg, 9)).toEqual({ inactive: true, fill: 'fill="#638460"' });
		expect(markerState(svg, 10)).toEqual({ inactive: true, fill: 'fill="#638460"' });
		expect(markerState(svg, 11)).toEqual({ inactive: true, fill: 'fill="#638460"' });
		expect(markerState(svg, 12)).toEqual({ inactive: true, fill: 'fill="#BDA776"' });
		expect(svg.includes('mix-blend-mode:luminosity')).toBe(false);
	});

	it('activates only level 9 at current level 9', () => {
		const svg = applyTrackLevelStates(SAMPLE_TRACK_SVG, 9);
		expect(markerState(svg, 9)).toEqual({ inactive: false, fill: 'fill="#EA780C"' });
		expect(markerState(svg, 10).inactive).toBe(true);
		expect(markerState(svg, 11).inactive).toBe(true);
		expect(markerState(svg, 12).inactive).toBe(true);
	});

	it('activates levels 9 and 10 at current level 10', () => {
		const svg = applyTrackLevelStates(SAMPLE_TRACK_SVG, 10);
		expect(markerState(svg, 9).inactive).toBe(false);
		expect(markerState(svg, 10)).toEqual({ inactive: false, fill: 'fill="#D76414"' });
		expect(markerState(svg, 11).inactive).toBe(true);
		expect(markerState(svg, 12).inactive).toBe(true);
	});

	it('activates levels 9-11 at current level 11', () => {
		const svg = applyTrackLevelStates(SAMPLE_TRACK_SVG, 11);
		expect(markerState(svg, 9).inactive).toBe(false);
		expect(markerState(svg, 10).inactive).toBe(false);
		expect(markerState(svg, 11)).toEqual({ inactive: false, fill: 'fill="#EA780C"' });
		expect(markerState(svg, 12).inactive).toBe(true);
	});

	it('activates levels 9-12 at current level 12', () => {
		const svg = applyTrackLevelStates(SAMPLE_TRACK_SVG, 12);
		expect(markerState(svg, 9).inactive).toBe(false);
		expect(markerState(svg, 10).inactive).toBe(false);
		expect(markerState(svg, 11).inactive).toBe(false);
		expect(markerState(svg, 12)).toEqual({ inactive: false, fill: 'fill="#EA780C"' });
	});
});

describe('applyEqualTrackMarkerSpacing', () => {
	it('keeps first and last markers anchored and shifts the middle two equally', () => {
		const shifts = trackMarkerSpacingShifts();
		expect(shifts[0]).toBe(0);
		expect(shifts[3]).toBe(0);
		expect(shifts[1]).toBeGreaterThan(0);
		expect(shifts[2]).toBeGreaterThan(shifts[1]);
	});

	it('applies the same translate to the level 11 star and its label', () => {
		const svg = applyEqualTrackMarkerSpacing(applyTrackLevelStates(SAMPLE_TRACK_SVG, 2));
		const shift = trackMarkerSpacingShifts()[2];
		expect(svg).toContain(`x="339" y="4" width="28.125" height="31.5" fill="url(#pattern2_2548_1906)" style="filter:grayscale(1)" transform="translate(${shift} 0)"`);
		expect(svg).toContain(`<path transform="translate(${shift} 0)" d="M320.414`);
	});
});
