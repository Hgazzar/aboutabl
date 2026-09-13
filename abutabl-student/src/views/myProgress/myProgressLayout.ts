/**
 * Layout contracts for `/progress` — mirrors styles.ts breakpoints / RTL-safe rules.
 * Pure helpers so Vitest can cover responsive + RTL without a new E2E framework.
 */

/** Page grid stacks main + aside (styles.ts `Page` @media). */
export const MY_PROGRESS_STACK_BREAKPOINT_PX = 991;

/** Hero compact padding / type (styles.ts `ProgressHero`). */
export const MY_PROGRESS_HERO_COMPACT_BREAKPOINT_PX = 720;

/** Board card tighter margins (styles.ts `BoardCard`). */
export const MY_PROGRESS_BOARD_COMPACT_BREAKPOINT_PX = 640;

/**
 * Metrics chips stay on one row for 1–3 items (styles.ts `MetricsRow`).
 * Kept for layout contracts; stacking is intentionally disabled.
 */
export const MY_PROGRESS_METRICS_STACK_BREAKPOINT_PX = 0;

export type MyProgressPageColumns = 'two-column' | 'stacked';

export function myProgressPageColumns(viewportWidth: number): MyProgressPageColumns {
	return viewportWidth <= MY_PROGRESS_STACK_BREAKPOINT_PX ? 'stacked' : 'two-column';
}

export function myProgressHeroIsCompact(viewportWidth: number): boolean {
	return viewportWidth <= MY_PROGRESS_HERO_COMPACT_BREAKPOINT_PX;
}

export function myProgressBoardIsCompact(viewportWidth: number): boolean {
	return viewportWidth <= MY_PROGRESS_BOARD_COMPACT_BREAKPOINT_PX;
}

export function myProgressMetricsAreStacked(_viewportWidth: number): boolean {
	return false;
}

/**
 * Hero / copy alignment must use logical `start`, not physical `left`/`right`,
 * so LTR and RTL both remain valid without desktop-only direction assumptions.
 */
export function myProgressInlineTextAlign(): 'start' {
	return 'start';
}

export function myProgressLayoutForViewport(
	dir: 'ltr' | 'rtl',
	viewportWidth: number
): {
	dir: 'ltr' | 'rtl';
	columns: MyProgressPageColumns;
	heroCompact: boolean;
	boardCompact: boolean;
	metricsStacked: boolean;
	inlineTextAlign: 'start';
	asideStacksBelowMain: boolean;
} {
	const columns = myProgressPageColumns(viewportWidth);
	return {
		dir,
		columns,
		heroCompact: myProgressHeroIsCompact(viewportWidth),
		boardCompact: myProgressBoardIsCompact(viewportWidth),
		metricsStacked: myProgressMetricsAreStacked(viewportWidth),
		inlineTextAlign: myProgressInlineTextAlign(),
		asideStacksBelowMain: columns === 'stacked',
	};
}
