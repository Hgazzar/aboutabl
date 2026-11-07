import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IntlProvider } from 'react-intl';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import LiveSessionJoinPage from './LiveSessionJoinPage';
import {
	LIVE_SESSION_LOBBY_POLL_MS,
	LiveCompetitionApiError,
} from 'lib/liveCompetitionsStudentApi';
import en from 'translations/EN/translation.json';

const fetchPreview = vi.fn();
const joinSession = vi.fn();
const fetchCurrent = vi.fn();

vi.mock('lib/liveCompetitionsStudentApi', async () => {
	const actual = await vi.importActual<typeof import('lib/liveCompetitionsStudentApi')>(
		'lib/liveCompetitionsStudentApi'
	);
	return {
		...actual,
		fetchLiveCompetitionPreview: (...args: unknown[]) => fetchPreview(...args),
		joinLiveCompetitionSession: (...args: unknown[]) => joinSession(...args),
		fetchLiveCompetitionCurrent: (...args: unknown[]) => fetchCurrent(...args),
	};
});

vi.mock('components/loading-partially', () => ({
	default: () => <div data-testid="loading" />,
}));

function previewPayload(overrides: Record<string, unknown> = {}) {
	return {
		session: {
			id: 55,
			status: 'lobby',
			theme: 'classic',
			game_name: 'Campfire Classic',
			goal_label: 'Comprehension',
			question_total: 6,
		},
		invite: { status: 'pending', accepted_at: null, expires_at: null },
		joined: false,
		can_join: true,
		block_reason: null,
		...overrides,
	};
}

function renderPage(sessionId = '55') {
	return render(
		<IntlProvider locale="en" messages={en as Record<string, string>}>
			<MemoryRouter initialEntries={[`/live-games/sessions/${sessionId}`]}>
				<Routes>
					<Route path="/live-games/sessions/:sessionId" element={<LiveSessionJoinPage />} />
				</Routes>
			</MemoryRouter>
		</IntlProvider>
	);
}

describe('LiveSessionJoinPage runtime', () => {
	beforeEach(() => {
		vi.useFakeTimers({ shouldAdvanceTime: true });
		fetchPreview.mockReset();
		joinSession.mockReset();
		fetchCurrent.mockReset();
	});

	afterEach(() => {
		cleanup();
		vi.useRealTimers();
	});

	it('loads preview without automatically joining', async () => {
		fetchPreview.mockResolvedValue(previewPayload());
		renderPage();

		expect(await screen.findByTestId('live-comp-preview-card')).toBeTruthy();
		expect(screen.getByText('Campfire Classic')).toBeTruthy();
		expect(screen.getByTestId('live-comp-join-button')).toBeTruthy();
		expect(joinSession).not.toHaveBeenCalled();
		expect(fetchPreview).toHaveBeenCalledWith(55);
	});

	it('issues exactly one Join POST and disables while pending', async () => {
		const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
		fetchPreview.mockResolvedValue(previewPayload());
		let resolveJoin: ((value: unknown) => void) | null = null;
		joinSession.mockImplementation(
			() =>
				new Promise((resolve) => {
					resolveJoin = resolve;
				})
		);
		fetchCurrent.mockResolvedValue({
			session_id: 55,
			status: 'lobby',
			mode: 'lobby',
		});

		renderPage();
		expect(await screen.findByTestId('live-comp-join-button')).toBeTruthy();

		await user.click(screen.getByTestId('live-comp-join-button'));
		await waitFor(() => {
			expect(joinSession).toHaveBeenCalledTimes(1);
			const btn = screen.getByTestId('live-comp-join-button') as HTMLButtonElement;
			expect(btn.disabled).toBe(true);
		});

		// Second click ignored while the join request is still pending.
		await user.click(screen.getByTestId('live-comp-join-button'));
		expect(joinSession).toHaveBeenCalledTimes(1);

		await act(async () => {
			resolveJoin?.({
				session: { id: 55, status: 'lobby' },
				invite: { status: 'accepted', accepted_at: 't' },
				player: { id: 1, student_id: 21 },
			});
		});

		expect(await screen.findByTestId('live-comp-waiting')).toBeTruthy();
		expect(joinSession).toHaveBeenCalledWith(55);
		expect(joinSession).toHaveBeenCalledTimes(1);
		expect(fetchCurrent).toHaveBeenCalled();
	});

	it('hides Join for accepted + existing player and loads current', async () => {
		fetchPreview.mockResolvedValue(
			previewPayload({
				joined: true,
				can_join: false,
				invite: { status: 'accepted', accepted_at: 't', expires_at: null },
				block_reason: 'invitation_already_accepted',
			})
		);
		fetchCurrent.mockResolvedValue({
			session_id: 55,
			status: 'lobby',
			mode: 'lobby',
		});

		renderPage();
		expect(await screen.findByTestId('live-comp-waiting')).toBeTruthy();
		expect(screen.queryByTestId('live-comp-join-button')).toBeNull();
		expect(joinSession).not.toHaveBeenCalled();
		expect(fetchCurrent).toHaveBeenCalledWith(55);
	});

	it('shows Join for accepted + no player + lobby repair path', async () => {
		fetchPreview.mockResolvedValue(
			previewPayload({
				joined: false,
				can_join: true,
				invite: { status: 'accepted', accepted_at: 't', expires_at: null },
				block_reason: null,
			})
		);
		renderPage();
		expect(await screen.findByTestId('live-comp-join-button')).toBeTruthy();
		expect(joinSession).not.toHaveBeenCalled();
	});

	it('does not overlap current polls, keeps polling while playing, stops after End', async () => {
		fetchPreview.mockResolvedValue(
			previewPayload({
				joined: true,
				can_join: false,
				invite: { status: 'accepted', accepted_at: 't', expires_at: null },
			})
		);

		let pendingResolve: ((value: unknown) => void) | null = null;
		let mode: 'open' | 'block' | 'playing' | 'ended' = 'open';
		fetchCurrent.mockImplementation(() => {
			if (mode === 'block') {
				return new Promise((resolve) => {
					pendingResolve = resolve;
				});
			}
			if (mode === 'ended') {
				return Promise.resolve({
					session_id: 55,
					status: 'ended',
					mode: 'done',
					done: true,
					rank: 1,
				});
			}
			if (mode === 'playing') {
				return Promise.resolve({
					session_id: 55,
					status: 'playing',
					mode: 'question',
				});
			}
			return Promise.resolve({
				session_id: 55,
				status: 'lobby',
				mode: 'lobby',
			});
		});

		renderPage();
		expect(await screen.findByTestId('live-comp-waiting')).toBeTruthy();
		const afterLoad = fetchCurrent.mock.calls.length;

		mode = 'block';
		await act(async () => {
			vi.advanceTimersByTime(LIVE_SESSION_LOBBY_POLL_MS);
		});
		await waitFor(() => {
			expect(fetchCurrent.mock.calls.length).toBe(afterLoad + 1);
		});
		const whileBlocked = fetchCurrent.mock.calls.length;

		await act(async () => {
			vi.advanceTimersByTime(LIVE_SESSION_LOBBY_POLL_MS);
		});
		expect(fetchCurrent.mock.calls.length).toBe(whileBlocked);

		mode = 'playing';
		await act(async () => {
			pendingResolve?.({
				session_id: 55,
				status: 'playing',
				mode: 'question',
			});
		});
		expect(await screen.findByTestId('live-comp-arena')).toBeTruthy();
		expect(screen.getByTestId('live-comp-panel-question')).toBeTruthy();

		const afterStarted = fetchCurrent.mock.calls.length;
		await act(async () => {
			vi.advanceTimersByTime(LIVE_SESSION_LOBBY_POLL_MS * 3);
		});
		// Host End detection: keep polling during play.
		expect(fetchCurrent.mock.calls.length).toBeGreaterThan(afterStarted);

		mode = 'ended';
		await act(async () => {
			vi.advanceTimersByTime(LIVE_SESSION_LOBBY_POLL_MS);
		});
		expect(await screen.findByTestId('live-comp-panel-ended_results')).toBeTruthy();

		const afterEnded = fetchCurrent.mock.calls.length;
		await act(async () => {
			vi.advanceTimersByTime(LIVE_SESSION_LOBBY_POLL_MS * 3);
		});
		expect(fetchCurrent.mock.calls.length).toBe(afterEnded);
	});

	it('ignores in-flight current response after unmount', async () => {
		fetchPreview.mockResolvedValue(
			previewPayload({
				joined: true,
				can_join: false,
				invite: { status: 'accepted', accepted_at: 't', expires_at: null },
			})
		);
		let resolveCurrent: ((value: unknown) => void) | null = null;
		fetchCurrent.mockImplementation(
			() =>
				new Promise((resolve) => {
					resolveCurrent = resolve;
				})
		);

		const { unmount } = renderPage();
		await waitFor(() => expect(fetchCurrent).toHaveBeenCalled());
		unmount();

		await act(async () => {
			resolveCurrent?.({
				session_id: 55,
				status: 'lobby',
				mode: 'lobby',
			});
		});

		expect(screen.queryByTestId('live-comp-waiting')).toBeNull();
	});

	it('enters arena from in-flight lobby poll and keeps polling for host End', async () => {
		fetchPreview.mockResolvedValue(
			previewPayload({
				joined: true,
				can_join: false,
				invite: { status: 'accepted', accepted_at: 't', expires_at: null },
			})
		);

		let resolvePoll: ((value: unknown) => void) | null = null;
		let call = 0;
		fetchCurrent.mockImplementation(() => {
			call += 1;
			if (call === 1) {
				return Promise.resolve({
					session_id: 55,
					status: 'lobby',
					mode: 'lobby',
				});
			}
			if (resolvePoll === null) {
				return new Promise((resolve) => {
					resolvePoll = resolve;
				});
			}
			return Promise.resolve({
				session_id: 55,
				status: 'playing',
				mode: 'question',
			});
		});

		renderPage();
		expect(await screen.findByTestId('live-comp-waiting')).toBeTruthy();

		await act(async () => {
			vi.advanceTimersByTime(LIVE_SESSION_LOBBY_POLL_MS);
		});
		await waitFor(() => expect(resolvePoll).toBeTruthy());

		await act(async () => {
			resolvePoll?.({
				session_id: 55,
				status: 'playing',
				mode: 'question',
			});
		});
		expect(await screen.findByTestId('live-comp-arena')).toBeTruthy();
		expect(screen.getByTestId('live-comp-panel-question')).toBeTruthy();
		expect(screen.queryByTestId('live-comp-waiting')).toBeNull();

		const callsAfterPlaying = fetchCurrent.mock.calls.length;
		await act(async () => {
			vi.advanceTimersByTime(LIVE_SESSION_LOBBY_POLL_MS * 3);
		});
		expect(fetchCurrent.mock.calls.length).toBeGreaterThan(callsAfterPlaying);
	});

	it('maps preview and join HTTP status errors to localized UI states', async () => {
		const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
		fetchPreview.mockRejectedValueOnce(
			new LiveCompetitionApiError('Invitation not found.', 404, '404')
		);

		const { unmount } = renderPage();
		expect(await screen.findByTestId('live-comp-error')).toBeTruthy();
		expect(screen.getByText(en.liveCompInviteNotFound)).toBeTruthy();
		unmount();

		fetchPreview.mockResolvedValue(previewPayload());
		joinSession.mockRejectedValue(
			new LiveCompetitionApiError('Session is not in lobby.', 409, '409')
		);
		renderPage('56');
		expect(await screen.findByTestId('live-comp-join-button')).toBeTruthy();
		await user.click(screen.getByTestId('live-comp-join-button'));
		expect(await screen.findByTestId('live-comp-inline-error')).toBeTruthy();
		expect(screen.getByText(en.liveCompJoinNotInLobby)).toBeTruthy();
		expect(screen.getByTestId('live-comp-join-button')).toBeTruthy();

		cleanup();
		fetchPreview.mockRejectedValueOnce(
			new LiveCompetitionApiError('Invitation has expired.', 422, '422')
		);
		renderPage('57');
		expect(await screen.findByTestId('live-comp-error')).toBeTruthy();
		expect(screen.getByText(en.liveCompInviteNotEligible)).toBeTruthy();
	});
});
