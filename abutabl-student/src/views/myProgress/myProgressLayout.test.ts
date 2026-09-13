import { describe, expect, it } from 'vitest';
import type { MyProgressBook } from 'lib/myProgressApi';
import { bookMetricVisibility } from './myProgressPageState';
import {
	MY_PROGRESS_BOARD_COMPACT_BREAKPOINT_PX,
	MY_PROGRESS_HERO_COMPACT_BREAKPOINT_PX,
	MY_PROGRESS_METRICS_STACK_BREAKPOINT_PX,
	MY_PROGRESS_STACK_BREAKPOINT_PX,
	myProgressInlineTextAlign,
	myProgressLayoutForViewport,
	myProgressPageColumns,
} from './myProgressLayout';

function deferredActivitiesBook(): MyProgressBook {
	return {
		subject_id: 1,
		title: 'Letters',
		description: null,
		photo: null,
		stars: { decorative: true },
		units_completed: 0,
		units_total: 1,
		progress_percent: 0,
		xp_this_week: 0,
		accuracy_percent: null,
		activities_completed: null,
		activities_available: false,
		next_goal: {
			available: false,
			title: null,
			lesson_title: null,
			reward_xp: null,
			reward_xp_kind: null,
			cta_path: null,
		},
	};
}

describe('myProgressLayout (/progress RTL + responsive)', () => {
	it('stacks to a single column at and below the shell breakpoint', () => {
		expect(myProgressPageColumns(1200)).toBe('two-column');
		expect(myProgressPageColumns(MY_PROGRESS_STACK_BREAKPOINT_PX + 1)).toBe('two-column');
		expect(myProgressPageColumns(MY_PROGRESS_STACK_BREAKPOINT_PX)).toBe('stacked');
		expect(myProgressPageColumns(375)).toBe('stacked');
	});

	it('compacts hero and board on mobile; metrics stay one row', () => {
		const mobile = myProgressLayoutForViewport('ltr', 390);
		expect(mobile.columns).toBe('stacked');
		expect(mobile.asideStacksBelowMain).toBe(true);
		expect(mobile.heroCompact).toBe(true);
		expect(mobile.boardCompact).toBe(true);
		expect(mobile.metricsStacked).toBe(false);

		const desktop = myProgressLayoutForViewport('ltr', 1280);
		expect(desktop.columns).toBe('two-column');
		expect(desktop.asideStacksBelowMain).toBe(false);
		expect(desktop.heroCompact).toBe(false);
		expect(desktop.boardCompact).toBe(false);
		expect(desktop.metricsStacked).toBe(false);

		expect(MY_PROGRESS_HERO_COMPACT_BREAKPOINT_PX).toBe(720);
		expect(MY_PROGRESS_BOARD_COMPACT_BREAKPOINT_PX).toBe(640);
		expect(MY_PROGRESS_METRICS_STACK_BREAKPOINT_PX).toBe(0);
	});

	it('keeps RTL-safe logical inline alignment (not physical left/right)', () => {
		expect(myProgressInlineTextAlign()).toBe('start');

		const rtlMobile = myProgressLayoutForViewport('rtl', 390);
		expect(rtlMobile.dir).toBe('rtl');
		expect(rtlMobile.inlineTextAlign).toBe('start');
		expect(rtlMobile.columns).toBe('stacked');
		expect(rtlMobile.asideStacksBelowMain).toBe(true);

		const rtlDesktop = myProgressLayoutForViewport('rtl', 1280);
		expect(rtlDesktop.dir).toBe('rtl');
		expect(rtlDesktop.inlineTextAlign).toBe('start');
		expect(rtlDesktop.columns).toBe('two-column');
	});

	it('keeps Activities hidden when deferred, including on RTL/mobile layout', () => {
		const visibility = bookMetricVisibility(deferredActivitiesBook());
		expect(visibility.activities).toBe(false);

		const rtlMobile = myProgressLayoutForViewport('rtl', 375);
		expect(rtlMobile.columns).toBe('stacked');
		expect(bookMetricVisibility(deferredActivitiesBook()).activities).toBe(false);
	});
});
