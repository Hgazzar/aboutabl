/** Figma `barFrameGap` (2548:1906) — track geometry inside 575×66 viewBox. */
export const BAR_VIEWBOX_WIDTH = 575;
export const BAR_VIEWBOX_HEIGHT = 66;
export const BAR_TRACK_X = 25;
export const BAR_TRACK_Y = 13;
export const BAR_TRACK_WIDTH = 518;
export const BAR_TRACK_HEIGHT = 12;

export const BAR_TRACK_LEFT_PERCENT = (BAR_TRACK_X / BAR_VIEWBOX_WIDTH) * 100;
export const BAR_TRACK_TOP_PERCENT = (BAR_TRACK_Y / BAR_VIEWBOX_HEIGHT) * 100;
export const BAR_TRACK_HEIGHT_PERCENT = (BAR_TRACK_HEIGHT / BAR_VIEWBOX_HEIGHT) * 100;
export const BAR_TRACK_WIDTH_PERCENT = (BAR_TRACK_WIDTH / BAR_VIEWBOX_WIDTH) * 100;

/** Remove Figma's baked progress fill so live CSS width is the only fill layer. */
export function stripBakedBarFillFromSvg(svgRaw: string): string {
	return svgRaw.replace(
		/(<rect x="25" y="13" width=")(\d+)(" height="12" rx="6" fill="url\(#paint2_linear_2548_1906\)"\/>)/,
		'$10$3'
	);
}

export function clampFillPercent(value: number): number {
	return Math.min(100, Math.max(0, value));
}

export function formatXpCount(value: number): string {
	return `${Math.max(0, Math.round(value))}XP`;
}

export type WeeklyXpTrend = 'up' | 'down';

export function weeklyXpTrend(current: number, previous = 0): WeeklyXpTrend {
	return current >= previous ? 'up' : 'down';
}

export function formatSignedWeeklyXp(current: number, previous = 0): string {
	const sign = weeklyXpTrend(current, previous) === 'up' ? '+' : '-';
	return `${sign}${formatXpCount(current)}`;
}

export const TRACK_MARKER_LEVELS = [9, 10, 11, 12] as const;

type TrackMarker = {
	level: (typeof TRACK_MARKER_LEVELS)[number];
	rect: string;
	pathStart: string;
	activeFill: string;
	inactiveFill: string;
};

const TRACK_MARKERS: TrackMarker[] = [
	{
		level: 9,
		rect: '<rect x="36" y="4" width="28.125" height="31.5" fill="url(#pattern0_2548_1906)"/>',
		pathStart: 'M24.414',
		activeFill: '#EA780C',
		inactiveFill: '#638460',
	},
	{
		level: 10,
		rect: '<rect x="198" y="4" width="28.125" height="31.5" fill="url(#pattern1_2548_1906)"/>',
		pathStart: 'M179.414',
		activeFill: '#D76414',
		inactiveFill: '#638460',
	},
	{
		level: 11,
		rect: '<rect x="339" y="4" width="28.125" height="31.5" fill="url(#pattern2_2548_1906)"/>',
		pathStart: 'M320.414',
		activeFill: '#EA780C',
		inactiveFill: '#638460',
	},
	{
		level: 12,
		rect: '<rect x="529" y="4" width="22.5094" height="31.5" fill="url(#pattern3_2548_1906)"/>',
		pathStart: 'M507.414',
		activeFill: '#EA780C',
		inactiveFill: '#BDA776',
	},
];

const BAKED_BLEND_STYLE = ' style="mix-blend-mode:luminosity"';
const INACTIVE_FILTER_STYLE = ' style="filter:grayscale(1)"';

export function isTrackLevelReached(currentLevel: number, markerLevel: number): boolean {
	return currentLevel >= markerLevel;
}

function withInactiveFilter(rect: string): string {
	if (rect.includes('filter:grayscale(1)')) {
		return rect;
	}
	return rect.replace('/>', `${INACTIVE_FILTER_STYLE}/>`);
}

function withBakedBlend(rect: string): string {
	return rect.replace('/>', `${BAKED_BLEND_STYLE}/>`);
}

function replaceMarkerRect(svg: string, baseRect: string, nextRect: string): string {
	const variants = [withInactiveFilter(baseRect), withBakedBlend(baseRect), baseRect];
	const match = variants.find((rect) => svg.includes(rect));
	return match ? svg.replace(match, nextRect) : svg;
}

function replaceLabelFill(svg: string, pathStart: string, fill: string): string {
	const pathToken = `<path d="${pathStart}`;
	const pathIndex = svg.indexOf(pathToken);
	if (pathIndex < 0) {
		return svg;
	}

	const fillIndex = svg.indexOf('fill="#', pathIndex);
	if (fillIndex < 0) {
		return svg;
	}

	const fillEnd = svg.indexOf('"', fillIndex + 7);
	if (fillEnd < 0) {
		return svg;
	}

	return `${svg.slice(0, fillIndex)}fill="${fill}"${svg.slice(fillEnd + 1)}`;
}

/** Apply Figma active vs incomplete marker colors from the student's real level. */
export function applyTrackLevelStates(svgRaw: string, currentLevel: number): string {
	return TRACK_MARKERS.reduce((svg, marker) => {
		const reached = isTrackLevelReached(currentLevel, marker.level);
		const nextRect = reached ? marker.rect : withInactiveFilter(marker.rect);
		const nextFill = reached ? marker.activeFill : marker.inactiveFill;
		return replaceLabelFill(replaceMarkerRect(svg, marker.rect, nextRect), marker.pathStart, nextFill);
	}, svgRaw);
}

type MarkerBox = { x: number; width: number; xAttr: string; pathStart: string };

const MARKER_BOXES: MarkerBox[] = [
	{ x: 36, width: 28.125, xAttr: 'x="36"', pathStart: 'M24.414' },
	{ x: 198, width: 28.125, xAttr: 'x="198"', pathStart: 'M179.414' },
	{ x: 339, width: 28.125, xAttr: 'x="339"', pathStart: 'M320.414' },
	{ x: 529, width: 22.5094, xAttr: 'x="529"', pathStart: 'M507.414' },
];

function equalMarkerShifts(boxes: MarkerBox[]): number[] {
	const first = boxes[0];
	const last = boxes[boxes.length - 1];
	const totalWidth = boxes.reduce((sum, box) => sum + box.width, 0);
	const span = last.x + last.width - first.x;
	const gap = (span - totalWidth) / (boxes.length - 1);
	let nextX = first.x;

	return boxes.map((box) => {
		const dx = nextX - box.x;
		nextX += box.width + gap;
		return Math.round(dx * 1000) / 1000;
	});
}

function injectRectTranslate(svg: string, xAttr: string, dx: number): string {
	if (dx === 0) {
		return svg;
	}

	const start = svg.indexOf(`<rect ${xAttr}`);
	if (start < 0) {
		return svg;
	}

	const end = svg.indexOf('/>', start);
	if (end < 0 || svg.slice(start, end).includes('transform=')) {
		return svg;
	}

	return `${svg.slice(0, end)} transform="translate(${dx} 0)"${svg.slice(end)}`;
}

function injectPathTranslate(svg: string, pathStart: string, dx: number): string {
	if (dx === 0) {
		return svg;
	}

	const token = `<path d="${pathStart}`;
	const start = svg.indexOf(token);
	if (start < 0 || svg.slice(start, start + 80).includes('transform=')) {
		return svg;
	}

	return `${svg.slice(0, start)}<path transform="translate(${dx} 0)" d="${pathStart}${svg.slice(start + token.length)}`;
}

/** Space the 3 stars and lock evenly between the first and last markers. */
export function applyEqualTrackMarkerSpacing(svgRaw: string): string {
	const shifts = equalMarkerShifts(MARKER_BOXES);
	return MARKER_BOXES.reduce((svg, box, index) => {
		const dx = shifts[index];
		return injectPathTranslate(injectRectTranslate(svg, box.xAttr, dx), box.pathStart, dx);
	}, svgRaw);
}

export function trackMarkerSpacingShifts(): number[] {
	return equalMarkerShifts(MARKER_BOXES);
}
