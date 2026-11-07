import { cleanup, render, screen } from '@testing-library/react';
vi.mock('views/learn/styles', () => ({
	CardWrapper: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	CardsWrapper: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import type { LiveCompetitionCurrentView } from 'lib/liveCompetitionsStudentApi';
import en from 'translations/EN/translation.json';
import ar from 'translations/AR/translation.json';
import LiveSessionResultsPanel from './LiveSessionResultsPanel';
import LiveSessionPersonalDonePanel from './LiveSessionPersonalDonePanel';

const claimReward = vi.fn();
const submitAnswer = vi.fn();
const submitTimeout = vi.fn();
const submitReinforce = vi.fn();
const usePower = vi.fn();
const pickPassword = vi.fn();
const startClock = vi.fn();

vi.mock('lib/liveCompetitionsStudentApi', async () => {
	const actual = await vi.importActual<typeof import('lib/liveCompetitionsStudentApi')>(
		'lib/liveCompetitionsStudentApi'
	);
	return {
		...actual,
		claimLiveCompetitionReward: (...args: unknown[]) => claimReward(...args),
		submitLiveCompetitionAnswer: (...args: unknown[]) => submitAnswer(...args),
		submitLiveCompetitionTimeout: (...args: unknown[]) => submitTimeout(...args),
		submitLiveCompetitionReinforce: (...args: unknown[]) => submitReinforce(...args),
		useLiveCompetitionPower: (...args: unknown[]) => usePower(...args),
		pickLiveCompetitionPassword: (...args: unknown[]) => pickPassword(...args),
		startLiveCompetitionQuestionClock: (...args: unknown[]) => startClock(...args),
	};
});

afterEach(() => {
	cleanup();
	claimReward.mockReset();
	submitAnswer.mockReset();
	submitTimeout.mockReset();
	submitReinforce.mockReset();
	usePower.mockReset();
	pickPassword.mockReset();
	startClock.mockReset();
});

function endedView(
	overrides: Partial<LiveCompetitionCurrentView> = {}
): LiveCompetitionCurrentView {
	return {
		session_id: 55,
		status: 'ended',
		mode: 'done',
		done: true,
		theme: 'classic',
		score: 4,
		coins: 40,
		rank: 2,
		best_streak: 3,
		streak: 1,
		progress: 80,
		accuracy: 50,
		question_total: 8,
		class_accuracy: 62.5,
		fire_lit: true,
		fastest_ms: 900,
		goal: 'accuracy',
		goal_label: 'Accuracy',
		...overrides,
	};
}

function renderResults(
	current: LiveCompetitionCurrentView,
	locale: 'en' | 'ar' = 'en'
) {
	const messages = (locale === 'ar' ? ar : en) as Record<string, string>;
	return render(
		<MemoryRouter>
			<IntlProvider locale={locale} messages={messages}>
				<LiveSessionResultsPanel current={current} />
			</IntlProvider>
		</MemoryRouter>
	);
}

function renderPersonalDone(current: LiveCompetitionCurrentView) {
	return render(
		<MemoryRouter>
			<IntlProvider locale="en" messages={en as Record<string, string>}>
				<LiveSessionPersonalDonePanel current={current} />
			</IntlProvider>
		</MemoryRouter>
	);
}

describe('LiveSessionResultsPanel', () => {
	it('shows cancelled lobby copy without inventing a scoreboard', () => {
		renderResults(endedView({ cancelled: true, score: 0, coins: 0, fire_lit: false }));
		expect(screen.getByTestId('live-comp-panel-ended_results').getAttribute('data-cancelled')).toBe(
			'true'
		);
		expect(screen.getByText(/Lobby cancelled/i)).toBeTruthy();
		expect(screen.queryByTestId('live-comp-results-fields')).toBeNull();
		expect(screen.getByTestId('live-comp-results-exit')).toBeTruthy();
	});

	it('renders ended personal results from supplied fields only', () => {
		renderResults(endedView());
		expect(screen.getByTestId('live-comp-panel-ended_results')).toBeTruthy();
		expect(screen.getByTestId('live-comp-results-score').textContent).toMatch(/4/);
		expect(screen.getByTestId('live-comp-results-coins').textContent).toMatch(/40/);
		expect(screen.getByTestId('live-comp-results-rank').textContent).toMatch(/2/);
		expect(screen.getByTestId('live-comp-results-best-streak').textContent).toMatch(/3/);
		expect(screen.getByTestId('live-comp-results-progress').textContent).toMatch(/80/);
		expect(screen.getByTestId('live-comp-results-accuracy').textContent).toMatch(/50/);
		expect(screen.getByTestId('live-comp-results-question-total').textContent).toMatch(/8/);
		expect(screen.getByTestId('live-comp-results-class-accuracy').textContent).toMatch(/62/);
		expect(screen.getByTestId('live-comp-results-fastest').textContent).toMatch(/900/);
		expect(screen.getByTestId('live-comp-results-goal').textContent).toContain('Accuracy');
		expect(screen.getByTestId('live-comp-results-fire-lit')).toBeTruthy();
	});

	it('omits optional/missing result fields without inventing values', () => {
		renderResults(
			endedView({
				rank: null,
				best_streak: undefined,
				progress: undefined,
				accuracy: undefined,
				question_total: undefined,
				class_accuracy: null,
				fire_lit: false,
				fastest_ms: null,
				goal: null,
				goal_label: null,
				streak: undefined,
			})
		);
		expect(screen.getByTestId('live-comp-results-score')).toBeTruthy();
		expect(screen.getByTestId('live-comp-results-coins')).toBeTruthy();
		expect(screen.queryByTestId('live-comp-results-rank')).toBeNull();
		expect(screen.queryByTestId('live-comp-results-best-streak')).toBeNull();
		expect(screen.queryByTestId('live-comp-results-progress')).toBeNull();
		expect(screen.queryByTestId('live-comp-results-accuracy')).toBeNull();
		expect(screen.queryByTestId('live-comp-results-question-total')).toBeNull();
		expect(screen.queryByTestId('live-comp-results-class-accuracy')).toBeNull();
		expect(screen.queryByTestId('live-comp-results-fire-lit')).toBeNull();
		expect(screen.queryByTestId('live-comp-results-fastest')).toBeNull();
		expect(screen.queryByTestId('live-comp-results-goal')).toBeNull();
	});

	it('does not render peer scores, answers, or private fields', () => {
		renderResults(endedView());
		expect(document.body.textContent).not.toMatch(
			/correct_answer|owner_id|reward_data|players|peer|classmate/i
		);
		expect(screen.queryByTestId('live-comp-results-players')).toBeNull();
	});

	it('does not issue gameplay mutations', () => {
		renderResults(endedView());
		expect(claimReward).not.toHaveBeenCalled();
		expect(submitAnswer).not.toHaveBeenCalled();
		expect(submitTimeout).not.toHaveBeenCalled();
		expect(submitReinforce).not.toHaveBeenCalled();
		expect(usePower).not.toHaveBeenCalled();
		expect(pickPassword).not.toHaveBeenCalled();
		expect(startClock).not.toHaveBeenCalled();
	});

	it('provides exit navigation to /live-games', () => {
		renderResults(endedView());
		const exit = screen.getByTestId('live-comp-results-exit');
		expect(exit.getAttribute('href')).toBe('/live-games');
		expect(exit.textContent).toMatch(/Back to dashboard/i);
	});

	it('covers AR results title and exit copy', () => {
		renderResults(endedView(), 'ar');
		expect(screen.getByText('انتهت الجلسة')).toBeTruthy();
		expect(screen.getByTestId('live-comp-results-exit').textContent).toBeTruthy();
	});
});

describe('LiveSessionPersonalDonePanel vs ended results', () => {
	it('keeps playing+done distinct from ended results and omits rank', () => {
		renderPersonalDone({
			session_id: 55,
			status: 'playing',
			mode: 'done',
			done: true,
			theme: 'classic',
			score: 3,
			coins: 25,
		});
		expect(screen.getByTestId('live-comp-panel-personal_done')).toBeTruthy();
		expect(screen.queryByTestId('live-comp-panel-ended_results')).toBeNull();
		expect(screen.getByText(/Waiting for the teacher/i)).toBeTruthy();
		expect(screen.queryByTestId('live-comp-results-rank')).toBeNull();
		expect(screen.getByTestId('live-comp-personal-done-score').textContent).toMatch(/3/);
		expect(screen.getByTestId('live-comp-personal-done-exit').getAttribute('href')).toBe(
			'/live-games'
		);
		expect(claimReward).not.toHaveBeenCalled();
		expect(submitAnswer).not.toHaveBeenCalled();
	});
});
