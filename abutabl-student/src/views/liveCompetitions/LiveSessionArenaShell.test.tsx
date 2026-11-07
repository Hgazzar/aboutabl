import { cleanup, render, screen } from '@testing-library/react';
vi.mock('views/learn/styles', () => ({
	CardWrapper: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	CardsWrapper: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { afterEach, describe, expect, it, vi } from 'vitest';
import { IntlProvider } from 'react-intl';
import type { LiveCompetitionCurrentView } from 'lib/liveCompetitionsStudentApi';
import en from 'translations/EN/translation.json';
import LiveSessionArenaShell from './LiveSessionArenaShell';

vi.mock('./LiveSessionQuestionPanel', () => ({
	default: () => <div data-testid="live-comp-panel-question">question-panel</div>,
}));

vi.mock('./LiveSessionReinforcePanel', () => ({
	default: () => <div data-testid="live-comp-panel-reinforce">reinforce-panel</div>,
}));

vi.mock('./LiveSessionRewardPanel', () => ({
	default: () => <div data-testid="live-comp-panel-reward">reward-panel</div>,
}));

vi.mock('./LiveSessionPasswordPanel', () => ({
	default: () => <div data-testid="live-comp-panel-need_password">password-panel</div>,
}));

vi.mock('./LiveSessionPersonalDonePanel', () => ({
	default: () => <div data-testid="live-comp-panel-personal_done">personal-done-panel</div>,
}));

vi.mock('./LiveSessionResultsPanel', () => ({
	default: () => <div data-testid="live-comp-panel-ended_results">ended-results-panel</div>,
}));

vi.mock('./LiveSessionPowerControl', () => ({
	hasUsablePowerContract: (current: { power?: string | null } | null) =>
		Boolean(current?.power),
	default: () => <div data-testid="live-comp-power-control">power-control</div>,
}));

afterEach(() => {
	cleanup();
});

function renderShell(current: LiveCompetitionCurrentView | null) {
	return render(
		<IntlProvider locale="en" messages={en as Record<string, string>}>
			<LiveSessionArenaShell
				current={current}
				sessionId={55}
				onCurrent={vi.fn()}
				refreshCurrent={vi.fn(async () => null)}
			/>
		</IntlProvider>
	);
}

function base(
	overrides: Partial<LiveCompetitionCurrentView> &
		Pick<LiveCompetitionCurrentView, 'status' | 'mode'>
): LiveCompetitionCurrentView {
	return {
		session_id: 55,
		theme: 'classic',
		score: 1,
		coins: 20,
		streak: 0,
		...overrides,
	};
}

describe('LiveSessionArenaShell', () => {
	it('renders the correct panel for every parsed mode', () => {
		const cases: Array<[LiveCompetitionCurrentView | null, string]> = [
			[null, 'loading'],
			[base({ status: 'playing', mode: 'need_password', theme: 'hacking' }), 'need_password'],
			[base({ status: 'playing', mode: 'question' }), 'question'],
			[base({ status: 'playing', mode: 'reinforce' }), 'reinforce'],
			[base({ status: 'playing', mode: 'reward', reward_type: 'chest' }), 'reward'],
			[base({ status: 'playing', mode: 'done', done: true }), 'personal_done'],
			[base({ status: 'ended', mode: 'done', done: true, rank: 2 }), 'ended_results'],
		];

		for (const [current, panel] of cases) {
			cleanup();
			renderShell(current);
			expect(screen.getByTestId('live-comp-arena').getAttribute('data-arena-panel')).toBe(
				panel
			);
			expect(screen.getByTestId(`live-comp-panel-${panel}`)).toBeTruthy();
		}
	});

	it('theme chrome changes presentation only', () => {
		renderShell(base({ status: 'playing', mode: 'question', theme: 'gold_quest' }));
		expect(screen.getByTestId('live-comp-arena').getAttribute('data-arena-theme')).toBe(
			'gold_quest'
		);
		expect(screen.getByTestId('live-comp-panel-question')).toBeTruthy();
		expect(screen.queryByTestId('live-comp-panel-ended_results')).toBeNull();
	});

	it('personal_done is not ended results', () => {
		renderShell(base({ status: 'playing', mode: 'done', done: true }));
		expect(screen.getByTestId('live-comp-panel-personal_done')).toBeTruthy();
		expect(screen.queryByTestId('live-comp-panel-ended_results')).toBeNull();
		expect(screen.getByTestId('live-comp-arena').getAttribute('data-arena-panel')).toBe(
			'personal_done'
		);
	});

	it('ended_results only for ended session', () => {
		renderShell(base({ status: 'ended', mode: 'done', done: true, rank: 1 }));
		expect(screen.getByTestId('live-comp-panel-ended_results')).toBeTruthy();
		expect(screen.queryByTestId('live-comp-panel-personal_done')).toBeNull();
	});

	it('shows power control on question when power is assigned, not on need_password', () => {
		renderShell(
			base({
				status: 'playing',
				mode: 'question',
				power: 'freeze',
				power_label: 'Freeze',
				power_used: false,
			})
		);
		expect(screen.getByTestId('live-comp-power-control')).toBeTruthy();

		cleanup();
		renderShell(
			base({
				status: 'playing',
				mode: 'need_password',
				theme: 'hacking',
				power: 'freeze',
				password_options: ['Aa11'],
			})
		);
		expect(screen.getByTestId('live-comp-panel-need_password')).toBeTruthy();
		expect(screen.queryByTestId('live-comp-power-control')).toBeNull();
	});
});
