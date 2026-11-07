import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import {
	LiveCompetitionApiError,
	claimLiveCompetitionReward,
	classifyLiveCompetitionApiError,
	fetchLiveCompetitionCurrent,
	fetchLiveCompetitionPreview,
	getLiveCompetitionInvitations,
	isEndedResults,
	isPersonalDone,
	joinLiveCompetitionSession,
	omitSensitiveFields,
	parseAnswerFeedback,
	parseClaimResult,
	parseCurrentView,
	parseInvitationListItem,
	parseInvitationsList,
	parseInvitePreview,
	parseJoinPayload,
	parsePasswordResult,
	parsePowerResult,
	parseReinforceResult,
	pickLiveCompetitionPassword,
	startLiveCompetitionQuestionClock,
	submitLiveCompetitionAnswer,
	submitLiveCompetitionReinforce,
	submitLiveCompetitionTimeout,
	useLiveCompetitionPower,
} from './liveCompetitionsStudentApi';

vi.mock('js-cookie', () => ({
	default: {
		get: vi.fn(() => 'test-token'),
	},
}));

vi.mock('axios', async () => {
	const actual = await vi.importActual<typeof import('axios')>('axios');
	return {
		...actual,
		default: {
			...actual.default,
			request: vi.fn(),
			isAxiosError: actual.default.isAxiosError,
		},
	};
});

const axiosRequest = axios.request as unknown as ReturnType<typeof vi.fn>;

function assertNoSensitive(value: unknown): void {
	const json = JSON.stringify(value);
	expect(json).not.toMatch(/correct_answer/);
	expect(json).not.toMatch(/"real"/);
	expect(json).not.toMatch(/owner_id/);
	expect(json).not.toMatch(/reward_data/);
}

describe('liveCompetitionsStudentApi parsers', () => {
	it('parses preview envelope without inventing fields', () => {
		const parsed = parseInvitePreview({
			status: true,
			preview: {
				session: {
					id: 55,
					status: 'lobby',
					theme: 'classic',
					game_name: 'Campfire',
					goal_label: 'Comprehension',
					question_total: 6,
				},
				invite: { status: 'pending', accepted_at: null, expires_at: null },
				joined: false,
				can_join: true,
				block_reason: null,
			},
		});
		expect(parsed?.can_join).toBe(true);
		expect(parsed?.session.game_name).toBe('Campfire');
		expect(parsed?.invite).not.toHaveProperty('invited_at');
	});

	it('parses a valid invitation list item with invited_at', () => {
		const parsed = parseInvitationListItem({
			session: {
				id: 55,
				status: 'lobby',
				theme: 'classic',
				game_name: 'Campfire',
				goal_label: 'Comprehension',
				question_total: 6,
				class_id: 1,
				correct_answer: 'Wood',
			},
			invite: {
				id: 99,
				status: 'pending',
				invited_at: '2026-11-03T10:00:00Z',
				accepted_at: null,
				expires_at: null,
			},
			joined: false,
			can_join: true,
			block_reason: null,
			reward_data: { secret: true },
		});
		expect(parsed).toEqual({
			session: {
				id: 55,
				status: 'lobby',
				theme: 'classic',
				game_name: 'Campfire',
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
		});
		assertNoSensitive(parsed);
		expect(parsed).not.toHaveProperty('invite.id');
	});

	it('parses multiple invitations and an empty list', () => {
		const multi = parseInvitationsList({
			status: true,
			invitations: [
				{
					session: {
						id: 1,
						status: 'lobby',
						theme: 'classic',
						game_name: 'A',
						question_total: 2,
					},
					invite: {
						status: 'pending',
						invited_at: '2026-11-03T12:00:00Z',
						accepted_at: null,
						expires_at: null,
					},
					joined: false,
					can_join: true,
					block_reason: null,
				},
				{
					session: {
						id: 2,
						status: 'playing',
						theme: 'hacking',
						game_name: 'B',
						question_total: 4,
					},
					invite: {
						status: 'accepted',
						invited_at: '2026-11-02T12:00:00Z',
						accepted_at: '2026-11-02T12:05:00Z',
						expires_at: null,
					},
					joined: true,
					can_join: false,
					block_reason: 'invitation_already_accepted',
				},
			],
		});
		expect(multi).toHaveLength(2);
		expect(multi?.[0].session.id).toBe(1);
		expect(multi?.[1].can_join).toBe(false);
		expect(multi?.[1].block_reason).toBe('invitation_already_accepted');

		expect(parseInvitationsList({ status: true, invitations: [] })).toEqual([]);
	});

	it('preserves optional fields absent and nullable block_reason', () => {
		const parsed = parseInvitationListItem({
			session: {
				id: 7,
				status: 'ended',
				theme: 'gold_quest',
				game_name: null,
				question_total: 3,
			},
			invite: {
				status: 'accepted',
				invited_at: '2026-11-01T00:00:00Z',
				accepted_at: null,
				expires_at: null,
			},
			joined: true,
			can_join: false,
			block_reason: null,
		});
		expect(parsed?.session).not.toHaveProperty('goal_label');
		expect(parsed?.session.game_name).toBeNull();
		expect(parsed?.block_reason).toBeNull();
		expect(parsed?.invite.accepted_at).toBeNull();
		expect(parsed?.invite.expires_at).toBeNull();
	});

	it('rejects malformed invitation list envelopes and drops bad rows', () => {
		expect(parseInvitationsList({ status: true })).toBeNull();
		expect(parseInvitationsList({ status: true, invitations: 'nope' })).toBeNull();
		expect(parseInvitationListItem({ session: { id: 0 }, invite: { status: 'pending' } })).toBeNull();
		expect(
			parseInvitationsList({
				status: true,
				invitations: [
					{
						session: {
							id: 5,
							status: 'lobby',
							theme: 'classic',
							game_name: 'Ok',
							question_total: 1,
						},
						invite: {
							status: 'pending',
							invited_at: null,
							accepted_at: null,
							expires_at: null,
						},
						joined: false,
						can_join: true,
						block_reason: null,
					},
					{ session: { id: 'x' }, invite: {} },
				],
			})
		).toEqual([
			{
				session: {
					id: 5,
					status: 'lobby',
					theme: 'classic',
					game_name: 'Ok',
					question_total: 1,
				},
				invite: {
					status: 'pending',
					invited_at: null,
					accepted_at: null,
					expires_at: null,
				},
				joined: false,
				can_join: true,
				block_reason: null,
			},
		]);
	});

	it('parses join envelope', () => {
		expect(
			parseJoinPayload({
				status: true,
				join: {
					session: { id: 9, status: 'lobby' },
					invite: { status: 'accepted', accepted_at: 'now' },
					player: { id: 3, student_id: 21 },
				},
			})?.player.student_id
		).toBe(21);
	});

	it('parses lobby current without inventing HUD fields', () => {
		const parsed = parseCurrentView({
			status: true,
			current: { session_id: 55, status: 'lobby', mode: 'lobby' },
		});
		expect(parsed).toEqual({
			session_id: 55,
			status: 'lobby',
			mode: 'lobby',
		});
		expect(parsed).not.toHaveProperty('score');
	});

	it('parses need_password mode', () => {
		const parsed = parseCurrentView({
			status: true,
			current: {
				session_id: 9,
				status: 'playing',
				mode: 'need_password',
				theme: 'hacking',
				password_options: ['Aa11', 'Bb22'],
				correct_answer: 'leak',
			},
		});
		expect(parsed?.mode).toBe('need_password');
		expect(parsed?.password_options).toEqual(['Aa11', 'Bb22']);
		assertNoSensitive(parsed);
	});

	it('parses question mode including media and clock fields', () => {
		const parsed = parseCurrentView({
			status: true,
			current: {
				session_id: 9,
				status: 'playing',
				mode: 'question',
				theme: 'classic',
				live_version: 3,
				score: 2,
				coins: 10,
				live_game_session_question_id: 44,
				question: 'What fuel?',
				image: '/img.png',
				voice_url: '/v.mp3',
				answer_type: 'text',
				choices: ['Sun', 'Wood'],
				is_retry: false,
				question_seconds: 20,
				clock_started: true,
				seconds_left: 12.5,
				correct_answer: 'Wood',
			},
		});
		expect(parsed?.live_game_session_question_id).toBe(44);
		expect(parsed?.choices).toEqual(['Sun', 'Wood']);
		expect(parsed?.seconds_left).toBe(12.5);
		expect(parsed?.clock_started).toBe(true);
		assertNoSensitive(parsed);
	});

	it('parses reinforce mode', () => {
		const parsed = parseCurrentView({
			status: true,
			current: {
				session_id: 9,
				status: 'playing',
				mode: 'reinforce',
				live_game_session_question_id: 7,
				question: 'Q',
				choices: ['A', 'B'],
				explanation: 'Because',
				wrong_answer: 'A',
				timed_out: false,
				correct_answer: 'B',
			},
		});
		expect(parsed?.mode).toBe('reinforce');
		expect(parsed?.wrong_answer).toBe('A');
		expect(parsed?.explanation).toBe('Because');
		assertNoSensitive(parsed);
	});

	it('parses chest and steal reward options without private fields', () => {
		const chest = parseCurrentView({
			status: true,
			current: {
				session_id: 1,
				status: 'playing',
				mode: 'reward',
				reward_type: 'chest',
				reward_options: [{ risk: 'safe', label: 'Safe 5', hint: 'Always 5' }],
				reward_data: { secret: true },
			},
		});
		expect(chest?.reward_type).toBe('chest');
		expect(chest?.reward_options).toEqual([
			{ risk: 'safe', label: 'Safe 5', hint: 'Always 5' },
		]);
		assertNoSensitive(chest);

		const fixedTrio = parseCurrentView({
			status: true,
			current: {
				session_id: 1,
				status: 'playing',
				mode: 'reward',
				reward_type: 'chest',
				reward_options: [
					{ index: 0, image: '/t1.png', coins: 20 },
					{ index: 1, image: '/t2.png', coins: 5 },
					{ index: 2, image: '/t3.png', coins: 10 },
				],
			},
		});
		// Amounts must never reach the client before claim.
		expect(fixedTrio?.reward_options).toEqual([
			{ index: 0, image: '/t1.png' },
			{ index: 1, image: '/t2.png' },
			{ index: 2, image: '/t3.png' },
		]);
		expect(JSON.stringify(fixedTrio)).not.toMatch(/"coins"/);

		const steal = parseCurrentView({
			status: true,
			current: {
				session_id: 1,
				status: 'playing',
				mode: 'reward',
				reward_type: 'steal',
				reward_options: [
					{ password: 'Real1', hint: 'Re', real: true, owner_id: 99 },
					{ password: 'Fake0', hint: 'Fa', real: false, owner_id: null },
				],
			},
		});
		expect(steal?.reward_options).toEqual([
			{ password: 'Real1', hint: 'Re' },
			{ password: 'Fake0', hint: 'Fa' },
		]);
		assertNoSensitive(steal);
	});

	it('parses protocol reward options', () => {
		const parsed = parseCurrentView({
			status: true,
			current: {
				session_id: 1,
				status: 'playing',
				mode: 'reward',
				reward_type: 'protocol',
				reward_options: [{ protocol: 'gold', label: 'GOLD', image: '/g.png' }],
			},
		});
		expect(parsed?.reward_options?.[0]).toMatchObject({ protocol: 'gold', label: 'GOLD' });
	});

	it('distinguishes personal_done from ended_results', () => {
		const personal = parseCurrentView({
			status: true,
			current: {
				session_id: 1,
				status: 'playing',
				mode: 'done',
				done: true,
				score: 3,
				rank: 1,
			},
		});
		expect(isPersonalDone(personal)).toBe(true);
		expect(isEndedResults(personal)).toBe(false);
		expect(personal).not.toHaveProperty('rank');

		const ended = parseCurrentView({
			status: true,
			current: {
				session_id: 1,
				status: 'ended',
				mode: 'done',
				done: true,
				rank: 2,
				score: 4,
				coins: 40,
				best_streak: 3,
				progress: 80,
				accuracy: 50,
				question_total: 8,
				class_accuracy: 62.5,
				fire_lit: true,
				fastest_ms: 900,
				goal: 'accuracy',
				goal_label: 'Accuracy',
			},
		});
		expect(isEndedResults(ended)).toBe(true);
		expect(isPersonalDone(ended)).toBe(false);
		expect(ended?.rank).toBe(2);
		expect(ended?.goal_label).toBe('Accuracy');
	});

	it('tolerates malformed mode payloads by keeping base fields only', () => {
		const parsed = parseCurrentView({
			status: true,
			current: {
				session_id: 3,
				status: 'playing',
				mode: 'question',
				choices: 'not-an-array',
				live_game_session_question_id: 'x',
			},
		});
		expect(parsed).toEqual({
			session_id: 3,
			status: 'playing',
			mode: 'question',
		});
	});

	it('returns null for missing current envelope', () => {
		expect(parseCurrentView({ status: true })).toBeNull();
		expect(parseCurrentView({ status: true, current: { session_id: 0, mode: 'lobby' } })).toBeNull();
	});
});

describe('omitSensitiveFields', () => {
	it('recursively discards sensitive keys', () => {
		const scrubbed = omitSensitiveFields({
			correct_answer: 'Wood',
			nested: {
				real: true,
				owner_id: 9,
				reward_data: { options: [] },
				ok: 1,
				list: [{ correct_answer: 'x', password: 'p' }],
			},
		}) as Record<string, unknown>;
		expect(scrubbed).toEqual({
			nested: {
				ok: 1,
				list: [{ password: 'p' }],
			},
		});
		assertNoSensitive(scrubbed);
	});
});

describe('mutation parsers', () => {
	it('keeps correct_answer off correct-answer feedback (no pre/post leak on success)', () => {
		const parsed = parseAnswerFeedback({
			status: true,
			answer: {
				session_id: 9,
				live_game_session_question_id: 4,
				answer: 'Wood',
				correct: true,
				timed_out: false,
				explanation: 'Trees',
				correct_answer: 'Wood',
				question: 'Fuel?',
				score: 1,
				coins: 30,
				coins_awarded: 10,
				streak: 1,
				pending_reinforce: false,
				reward_pending: false,
			},
		});
		expect(parsed?.correct).toBe(true);
		expect(parsed?.score).toBe(1);
		expect(parsed?.coins_awarded).toBe(10);
		expect(parsed?.explanation).toBe('Trees');
		expect(parsed).not.toHaveProperty('correct_answer');
		assertNoSensitive(parsed);
	});

	it('exposes stored correct_answer and explanation only after incorrect submit', () => {
		const parsed = parseAnswerFeedback({
			status: true,
			answer: {
				session_id: 9,
				live_game_session_question_id: 4,
				answer: 'Sun',
				correct: false,
				timed_out: false,
				explanation: 'Trees burn.',
				correct_answer: 'Wood',
				coins_awarded: 0,
				score: 0,
				coins: 20,
			},
		});
		expect(parsed).toMatchObject({
			correct: false,
			correct_answer: 'Wood',
			explanation: 'Trees burn.',
			coins_awarded: 0,
		});
		const json = JSON.stringify(parsed);
		expect(json).not.toMatch(/"real"/);
		expect(json).not.toMatch(/owner_id/);
		expect(json).not.toMatch(/reward_data/);
	});

	it('handles missing explanation without inventing text', () => {
		const parsed = parseAnswerFeedback({
			status: true,
			answer: {
				session_id: 9,
				live_game_session_question_id: 4,
				answer: 'Sun',
				correct: false,
				timed_out: true,
				explanation: null,
				correct_answer: 'Wood',
			},
		});
		expect(parsed?.timed_out).toBe(true);
		expect(parsed?.correct_answer).toBe('Wood');
		expect(parsed?.explanation).toBeNull();
	});

	it('parses reinforce, claim, power, and password results', () => {
		expect(
			parseReinforceResult({
				status: true,
				reinforce: {
					live_game_session_question_id: 4,
					answer: 'Wood',
					correct: true,
					coins_awarded: 3,
					coins: 23,
					pending_reinforce: false,
				},
			})
		).toMatchObject({ coins_awarded: 3, correct: true });

		expect(
			parseClaimResult({
				status: true,
				claim: {
					type: 'chest',
					message: 'YOU WIN 5 Coins',
					coins_awarded: 5,
					coins: 25,
					reward_pending: false,
					reward_data: { x: 1 },
				},
			})
		).toEqual({
			type: 'chest',
			message: 'YOU WIN 5 Coins',
			coins_awarded: 5,
			coins: 25,
			reward_pending: false,
		});

		expect(
			parsePowerResult({
				status: true,
				power: {
					power: 'shield',
					power_label: 'Shield',
					power_used: true,
					shield: true,
					message: 'ok',
				},
			})
		).toMatchObject({ power: 'shield', power_used: true });

		expect(
			parsePasswordResult({
				status: true,
				password: {
					has_password: true,
					password_options: ['a', 'b'],
					already_selected: false,
				},
			})
		).toEqual({
			has_password: true,
			password_options: ['a', 'b'],
			already_selected: false,
		});
	});

	it('rejects malformed mutation envelopes', () => {
		expect(parseAnswerFeedback({ status: true, answer: { answer: 'x' } })).toBeNull();
		expect(parseReinforceResult({ status: true })).toBeNull();
		expect(parseClaimResult({ status: true, claim: null })).toBeNull();
		expect(parsePowerResult({ status: true })).toBeNull();
		expect(parsePasswordResult({ status: true, password: {} })).toBeNull();
	});
});

describe('classifyLiveCompetitionApiError', () => {
	it('prefers HTTP status over message text', () => {
		expect(
			classifyLiveCompetitionApiError(
				new LiveCompetitionApiError('Invitation not found.', 404, '404')
			).kind
		).toBe('not_found');
		expect(
			classifyLiveCompetitionApiError(
				new LiveCompetitionApiError('Invitation is not pending.', 422, '422')
			).kind
		).toBe('not_eligible');
		expect(
			classifyLiveCompetitionApiError(
				new LiveCompetitionApiError('Session is not in lobby.', 409, '409')
			).kind
		).toBe('not_in_lobby');
		expect(
			classifyLiveCompetitionApiError(
				new LiveCompetitionApiError('Live competitions are disabled.', 404, '404')
			).kind
		).toBe('disabled');
		expect(
			classifyLiveCompetitionApiError(new LiveCompetitionApiError('Unauthenticated', 401, 'E3001'))
				.kind
		).toBe('unauthenticated');
	});
});

describe('liveCompetitionsStudentApi requests', () => {
	beforeEach(() => {
		axiosRequest.mockReset();
	});

	it('GETs preview and POSTs join with empty body', async () => {
		axiosRequest
			.mockResolvedValueOnce({
				status: 200,
				data: {
					status: true,
					preview: {
						session: {
							id: 55,
							status: 'lobby',
							theme: 'classic',
							game_name: 'Campfire',
							question_total: 6,
						},
						invite: { status: 'pending', accepted_at: null, expires_at: null },
						joined: false,
						can_join: true,
						block_reason: null,
					},
				},
			})
			.mockResolvedValueOnce({
				status: 201,
				data: {
					status: true,
					join: {
						session: { id: 55, status: 'lobby' },
						invite: { status: 'accepted', accepted_at: 't' },
						player: { id: 1, student_id: 21 },
					},
				},
			});

		await fetchLiveCompetitionPreview(55);
		await joinLiveCompetitionSession(55);

		expect(axiosRequest.mock.calls[0][0]).toMatchObject({
			method: 'get',
			url: expect.stringContaining('live-competitions/sessions/55/preview'),
		});
		expect(axiosRequest.mock.calls[1][0]).toMatchObject({
			method: 'post',
			url: expect.stringContaining('live-competitions/sessions/55/join'),
			data: {},
		});
	});

	it('preserves HTTP status on preview/join failures', async () => {
		axiosRequest.mockResolvedValueOnce({
			status: 404,
			data: { status: false, errNum: '404', msg: 'Invitation not found.' },
		});
		await expect(fetchLiveCompetitionPreview(9)).rejects.toMatchObject({
			status: 404,
			message: 'Invitation not found.',
		});

		axiosRequest.mockResolvedValueOnce({
			status: 409,
			data: { status: false, errNum: '409', msg: 'Session is not in lobby.' },
		});
		await expect(joinLiveCompetitionSession(9)).rejects.toMatchObject({
			status: 409,
			message: 'Session is not in lobby.',
		});

		axiosRequest.mockResolvedValueOnce({
			status: 422,
			data: { status: false, errNum: '422', msg: 'Invitation has expired.' },
		});
		await expect(joinLiveCompetitionSession(9)).rejects.toMatchObject({
			status: 422,
		});
	});

	it('gets invitation list with exact path and strips unapproved fields', async () => {
		axiosRequest.mockResolvedValueOnce({
			status: 200,
			data: {
				status: true,
				invitations: [
					{
						session: {
							id: 55,
							status: 'lobby',
							theme: 'classic',
							game_name: 'Campfire',
							goal_label: 'Comprehension',
							question_total: 6,
							class_id: 1,
						},
						invite: {
							id: 12,
							status: 'pending',
							invited_at: '2026-11-03T10:00:00Z',
							accepted_at: null,
							expires_at: null,
						},
						joined: false,
						can_join: true,
						block_reason: null,
						reward_data: { x: 1 },
					},
				],
			},
		});

		const list = await getLiveCompetitionInvitations();
		expect(axiosRequest.mock.calls[0][0]).toMatchObject({
			method: 'get',
			url: expect.stringMatching(/live-competitions\/invitations\?page=1&per_page=8$/),
		});
		expect(list.items).toHaveLength(1);
		expect(list.items[0].invite.invited_at).toBe('2026-11-03T10:00:00Z');
		expect(list.items[0].can_join).toBe(true);
		expect(list.pagination.has_more).toBe(false);
		assertNoSensitive(list);
		expect(JSON.stringify(list)).not.toMatch(/"class_id"/);
		expect(JSON.stringify(list)).not.toMatch(/"id":12/);
	});

	it('returns empty invitations array and preserves list HTTP errors', async () => {
		axiosRequest.mockResolvedValueOnce({
			status: 200,
			data: {
				status: true,
				invitations: [],
				pagination: { page: 1, per_page: 8, total: 0, has_more: false },
			},
		});
		await expect(getLiveCompetitionInvitations()).resolves.toEqual({
			items: [],
			pagination: { page: 1, per_page: 8, total: 0, has_more: false },
		});

		axiosRequest.mockResolvedValueOnce({
			status: 401,
			data: { status: false, errNum: 'E3001', msg: 'Unauthenticated' },
		});
		try {
			await getLiveCompetitionInvitations();
			expect.fail('expected rejection');
		} catch (err) {
			expect(err).toBeInstanceOf(LiveCompetitionApiError);
			expect(err).toMatchObject({ status: 401, errNum: 'E3001' });
		}

		axiosRequest.mockResolvedValueOnce({
			status: 200,
			data: { status: true },
		});
		await expect(getLiveCompetitionInvitations()).rejects.toMatchObject({
			message: 'Invitations could not be loaded.',
		});
	});

	it('fetches current session view with mode fields', async () => {
		axiosRequest.mockResolvedValueOnce({
			status: 200,
			data: {
				status: true,
				current: {
					session_id: 55,
					status: 'playing',
					mode: 'question',
					live_game_session_question_id: 8,
					question: 'Q',
					choices: ['A', 'B'],
					correct_answer: 'A',
				},
			},
		});
		const current = await fetchLiveCompetitionCurrent(55);
		expect(current.mode).toBe('question');
		expect(current.choices).toEqual(['A', 'B']);
		assertNoSensitive(current);
	});

	it('posts gameplay mutations with expected bodies and strips secrets', async () => {
		axiosRequest
			.mockResolvedValueOnce({
				status: 200,
				data: {
					status: true,
					current: {
						session_id: 55,
						status: 'playing',
						mode: 'question',
						clock_started: true,
						live_game_session_question_id: 8,
					},
				},
			})
			.mockResolvedValueOnce({
				status: 200,
				data: {
					status: true,
					answer: {
						session_id: 55,
						live_game_session_question_id: 8,
						answer: 'Wood',
						correct: true,
						timed_out: false,
						correct_answer: 'Wood',
						score: 1,
					},
				},
			})
			.mockResolvedValueOnce({
				status: 200,
				data: {
					status: true,
					answer: {
						session_id: 55,
						live_game_session_question_id: 8,
						answer: 'Sun',
						correct: false,
						timed_out: true,
						correct_answer: 'Wood',
					},
				},
			})
			.mockResolvedValueOnce({
				status: 200,
				data: {
					status: true,
					reinforce: {
						live_game_session_question_id: 8,
						answer: 'Wood',
						correct: true,
						coins_awarded: 3,
					},
				},
			})
			.mockResolvedValueOnce({
				status: 200,
				data: {
					status: true,
					claim: { type: 'steal', coins_awarded: 8, coins: 28, reward_pending: false },
				},
			})
			.mockResolvedValueOnce({
				status: 200,
				data: {
					status: true,
					power: { power: 'fifty_fifty', power_used: true, message: 'ok' },
				},
			})
			.mockResolvedValueOnce({
				status: 200,
				data: {
					status: true,
					password: { has_password: true, password_options: ['a'], already_selected: false },
				},
			});

		const clock = await startLiveCompetitionQuestionClock(55);
		expect(clock.clock_started).toBe(true);
		expect(axiosRequest.mock.calls[0][0]).toMatchObject({
			method: 'post',
			url: expect.stringContaining('start-question-clock'),
			data: {},
		});

		const answer = await submitLiveCompetitionAnswer(55, 8, 'Wood');
		expect(answer.correct).toBe(true);
		assertNoSensitive(answer);
		expect(axiosRequest.mock.calls[1][0].data).toEqual({
			live_game_session_question_id: 8,
			answer: 'Wood',
		});

		const timeout = await submitLiveCompetitionTimeout(55, 8);
		expect(timeout.timed_out).toBe(true);
		expect(timeout.correct_answer).toBe('Wood');
		expect(JSON.stringify(timeout)).not.toMatch(/"real"|owner_id|reward_data/);

		await submitLiveCompetitionReinforce(55, 'Wood');
		expect(axiosRequest.mock.calls[3][0].data).toEqual({ answer: 'Wood' });

		await claimLiveCompetitionReward(55, { password: 'Real1' });
		expect(axiosRequest.mock.calls[4][0].data).toEqual({ password: 'Real1' });

		await useLiveCompetitionPower(55);
		expect(axiosRequest.mock.calls[5][0].data).toEqual({});

		await pickLiveCompetitionPassword(55, 'Aa11');
		expect(axiosRequest.mock.calls[6][0].data).toEqual({ password: 'Aa11' });
	});

	it('propagates HTTP status on gameplay mutation failures', async () => {
		axiosRequest.mockResolvedValueOnce({
			status: 409,
			data: { status: false, errNum: '409', msg: 'Answer is not accepted.' },
		});
		await expect(submitLiveCompetitionAnswer(9, 1, 'Wood')).rejects.toMatchObject({
			status: 409,
			message: 'Answer is not accepted.',
		});

		axiosRequest.mockResolvedValueOnce({
			status: 409,
			data: { status: false, errNum: '409', msg: 'Question timer has not expired.' },
		});
		await expect(submitLiveCompetitionTimeout(9, 1)).rejects.toMatchObject({
			status: 409,
		});

		axiosRequest.mockResolvedValueOnce({
			status: 422,
			data: { status: false, errNum: '422', msg: 'Invalid choice.' },
		});
		await expect(submitLiveCompetitionReinforce(9, 'Nope')).rejects.toMatchObject({
			status: 422,
		});
	});
});
