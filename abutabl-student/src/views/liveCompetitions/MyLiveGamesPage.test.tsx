import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IntlProvider } from 'react-intl';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import MyLiveGamesPage from './MyLiveGamesPage';
import {
	LIVE_INVITATIONS_PAGE_SIZE,
	LIVE_INVITATIONS_POLL_MS,
	LiveCompetitionApiError,
} from 'lib/liveCompetitionsStudentApi';
import en from 'translations/EN/translation.json';

const getInvitations = vi.fn();
const joinSession = vi.fn();

vi.mock('lib/liveCompetitionsStudentApi', async () => {
	const actual = await vi.importActual<typeof import('lib/liveCompetitionsStudentApi')>(
		'lib/liveCompetitionsStudentApi'
	);
	return {
		...actual,
		getLiveCompetitionInvitations: (...args: unknown[]) => getInvitations(...args),
		joinLiveCompetitionSession: (...args: unknown[]) => joinSession(...args),
	};
});

vi.mock('components/loading-partially', () => ({
	default: () => <div data-testid="loading" />,
}));

function invitationItem(overrides: Record<string, unknown> = {}) {
	return {
		session: {
			id: 55,
			status: 'lobby',
			theme: 'classic',
			game_name: 'Campfire Classic',
			goal_label: 'Comprehension',
			question_total: 6,
		},
		invite: {
			status: 'pending',
			invited_at: '2026-11-03T10:00:00Z',
			accepted_at: null,
			expires_at: null,
		},
		joined: false,
		can_join: true,
		block_reason: null,
		...overrides,
	};
}

function pageResult(
	items: ReturnType<typeof invitationItem>[],
	overrides: Partial<{ page: number; per_page: number; total: number; has_more: boolean }> = {}
) {
	const page = overrides.page ?? 1;
	const perPage = overrides.per_page ?? LIVE_INVITATIONS_PAGE_SIZE;
	const total = overrides.total ?? items.length;
	const hasMore = overrides.has_more ?? total > page * perPage;
	return {
		items,
		pagination: {
			page,
			per_page: perPage,
			total,
			has_more: hasMore,
		},
	};
}

function renderPage(initialPath = '/live-games') {
	return render(
		<IntlProvider locale="en" messages={en as Record<string, string>}>
			<MemoryRouter initialEntries={[initialPath]}>
				<Routes>
					<Route path="/live-games" element={<MyLiveGamesPage />} />
					<Route
						path="/live-games/sessions/:sessionId"
						element={<div data-testid="session-join-page">session</div>}
					/>
				</Routes>
			</MemoryRouter>
		</IntlProvider>
	);
}

describe('MyLiveGamesPage', () => {
	beforeEach(() => {
		getInvitations.mockReset();
		joinSession.mockReset();
	});

	afterEach(() => {
		cleanup();
		vi.useRealTimers();
	});

	it('shows loading then renders invitation list', async () => {
		let resolveList: (value: unknown) => void = () => undefined;
		getInvitations.mockReturnValue(
			new Promise((resolve) => {
				resolveList = resolve;
			})
		);
		renderPage();
		expect(screen.getByTestId('my-live-games-loading')).toBeTruthy();

		resolveList(
			pageResult([
				invitationItem(),
				invitationItem({
					session: {
						id: 70,
						status: 'playing',
						theme: 'hacking',
						game_name: 'Hack Night',
						question_total: 4,
					},
					invite: {
						status: 'accepted',
						invited_at: '2026-11-02T10:00:00Z',
						accepted_at: '2026-11-02T10:05:00Z',
						expires_at: null,
					},
					joined: true,
					can_join: false,
					block_reason: null,
				}),
			])
		);

		await waitFor(() => {
			expect(screen.getByTestId('my-live-games-list')).toBeTruthy();
		});
		expect(getInvitations).toHaveBeenCalledWith({
			page: 1,
			per_page: LIVE_INVITATIONS_PAGE_SIZE,
		});
		expect(screen.getByText('Campfire Classic')).toBeTruthy();
		expect(screen.getByText('Hack Night')).toBeTruthy();
		expect(screen.getByTestId('my-live-games-questions-55').textContent).toContain('6');
		expect(screen.getByTestId('my-live-games-eligibility-55').textContent).toMatch(/Ready to join/i);
		expect(screen.getByTestId('my-live-games-eligibility-70').textContent).toMatch(/In progress/i);
		expect(screen.getByTestId('my-live-games-open-70').textContent).toMatch(/Continue/i);
		expect(joinSession).not.toHaveBeenCalled();
	});

	it('shows empty state when invitations array is empty', async () => {
		getInvitations.mockResolvedValue(pageResult([]));
		renderPage();
		await waitFor(() => {
			expect(screen.getByTestId('my-live-games-empty')).toBeTruthy();
		});
		expect(screen.getByText(/No invitations yet/i)).toBeTruthy();
		expect(joinSession).not.toHaveBeenCalled();
	});

	it('shows error and retries fetch', async () => {
		getInvitations
			.mockRejectedValueOnce(new LiveCompetitionApiError('boom', 500, '500'))
			.mockResolvedValueOnce(pageResult([]));
		renderPage();
		await waitFor(() => {
			expect(screen.getByTestId('my-live-games-error')).toBeTruthy();
		});
		await userEvent.click(screen.getByTestId('my-live-games-retry'));
		await waitFor(() => {
			expect(screen.getByTestId('my-live-games-empty')).toBeTruthy();
		});
		expect(getInvitations).toHaveBeenCalledTimes(2);
	});

	it('joins joinable invitations immediately, then navigates; others only navigate', async () => {
		getInvitations.mockResolvedValue(
			pageResult([
				invitationItem({ session: { ...invitationItem().session, id: 1, game_name: 'Joinable' } }),
				invitationItem({
					session: {
						...invitationItem().session,
						id: 2,
						game_name: 'Lobby waiting',
						status: 'lobby',
					},
					joined: true,
					can_join: false,
					invite: {
						status: 'accepted',
						invited_at: 't',
						accepted_at: 't',
						expires_at: null,
					},
				}),
				invitationItem({
					session: {
						...invitationItem().session,
						id: 4,
						game_name: 'Playing now',
						status: 'playing',
					},
					joined: true,
					can_join: false,
					invite: {
						status: 'accepted',
						invited_at: 't',
						accepted_at: 't',
						expires_at: null,
					},
				}),
				invitationItem({
					session: {
						...invitationItem().session,
						id: 5,
						game_name: 'Ended results',
						status: 'ended',
					},
					joined: true,
					can_join: false,
					invite: {
						status: 'accepted',
						invited_at: 't',
						accepted_at: 't',
						expires_at: null,
					},
				}),
				invitationItem({
					session: { ...invitationItem().session, id: 3, game_name: 'Blocked', status: 'ended' },
					joined: false,
					can_join: false,
					block_reason: 'invitation_expired',
					invite: {
						status: 'expired',
						invited_at: 't',
						accepted_at: null,
						expires_at: 't',
					},
				}),
			])
		);
		joinSession.mockResolvedValue({ created: true, join: {} });
		renderPage();
		await waitFor(() => {
			expect(screen.getByTestId('my-live-games-list')).toBeTruthy();
		});

		expect(screen.getByTestId('my-live-games-item-1').getAttribute('data-eligibility')).toBe(
			'joinable'
		);
		expect(screen.getByTestId('my-live-games-open-1').textContent).toMatch(/Join now/i);
		expect(screen.getByTestId('my-live-games-open-2').textContent).toMatch(/Enter lobby/i);
		expect(screen.getByTestId('my-live-games-eligibility-2').textContent).toMatch(
			/Waiting for teacher/i
		);
		expect(screen.getByTestId('my-live-games-open-4').textContent).toMatch(/Continue/i);
		expect(screen.getByTestId('my-live-games-open-5').textContent).toMatch(/View results/i);
		expect(screen.getByTestId('my-live-games-open-3').textContent).toMatch(/View/i);
		expect(screen.getByTestId('my-live-games-block-reason-3').textContent).toMatch(
			/expired/i
		);

		expect(screen.getByTestId('my-live-games-open-2').getAttribute('href')).toBe(
			'/live-games/sessions/2'
		);
		expect(screen.getByTestId('my-live-games-open-3').getAttribute('href')).toBe(
			'/live-games/sessions/3'
		);

		await userEvent.click(screen.getByTestId('my-live-games-open-1'));
		await waitFor(() => {
			expect(joinSession).toHaveBeenCalledWith(1);
		});
		await waitFor(() => {
			expect(screen.getByTestId('session-join-page')).toBeTruthy();
		});
	});

	it('loads the next page when View more is pressed', async () => {
		const user = userEvent.setup();
		getInvitations
			.mockResolvedValueOnce(
				pageResult([invitationItem({ session: { ...invitationItem().session, id: 1 } })], {
					page: 1,
					total: 2,
					has_more: true,
				})
			)
			.mockResolvedValueOnce(
				pageResult(
					[
						invitationItem({
							session: { ...invitationItem().session, id: 2, game_name: 'Second page' },
						}),
					],
					{ page: 2, total: 2, has_more: false }
				)
			);

		renderPage();
		await waitFor(() => expect(screen.getByTestId('my-live-games-load-more')).toBeTruthy());
		expect(screen.getByTestId('my-live-games-item-1')).toBeTruthy();
		expect(screen.queryByTestId('my-live-games-item-2')).toBeNull();

		await user.click(screen.getByTestId('my-live-games-load-more'));
		await waitFor(() => expect(screen.getByTestId('my-live-games-item-2')).toBeTruthy());
		expect(getInvitations).toHaveBeenLastCalledWith({
			page: 2,
			per_page: LIVE_INVITATIONS_PAGE_SIZE,
		});
		expect(screen.queryByTestId('my-live-games-load-more')).toBeNull();
	});

	it('silently polls and surfaces a new teacher invitation without a full-page refresh', async () => {
		vi.useFakeTimers({ shouldAdvanceTime: true });
		getInvitations
			.mockResolvedValueOnce(pageResult([]))
			.mockResolvedValueOnce(pageResult([invitationItem()]));
		renderPage();
		await waitFor(() => {
			expect(screen.getByTestId('my-live-games-empty')).toBeTruthy();
		});
		expect(getInvitations).toHaveBeenCalledTimes(1);

		await act(async () => {
			await vi.advanceTimersByTimeAsync(LIVE_INVITATIONS_POLL_MS);
		});

		await waitFor(() => {
			expect(getInvitations).toHaveBeenCalledTimes(2);
			expect(screen.getByTestId('my-live-games-list')).toBeTruthy();
		});
		expect(screen.getByText('Campfire Classic')).toBeTruthy();
		expect(screen.queryByTestId('my-live-games-loading')).toBeNull();
	});
});
