import axios from 'axios';
import Cookies from 'js-cookie';
import { resolveStudentApiBaseUrl } from 'lib/studentApiBaseUrl';

/** Poll interval while waiting in lobby for teacher Begin. */
export const LIVE_SESSION_LOBBY_POLL_MS = 1000;

/** Poll interval on My Live Games while waiting for new teacher invites. */
export const LIVE_INVITATIONS_POLL_MS = 3000;

/** Default page size for GET /live-competitions/invitations. */
export const LIVE_INVITATIONS_PAGE_SIZE = 8;

const apiSecret = import.meta.env.VITE_API_SECRET ?? 'OASzRok654E0AJ20KH';

/** Keys that must never appear in parsed frontend state. */
const SENSITIVE_KEYS = new Set(['correct_answer', 'real', 'owner_id', 'reward_data']);

export type LiveCompetitionInvitePreview = {
	session: {
		id: number;
		status: string;
		theme: string;
		game_name: string | null;
		goal_label?: string;
		question_total: number;
	};
	invite: {
		status: string;
		/** Present on list + current preview payloads when the backend sends it. */
		invited_at?: string | null;
		accepted_at: string | null;
		expires_at: string | null;
	};
	joined: boolean;
	can_join: boolean;
	block_reason: string | null;
};

/** One row from GET /live-competitions/invitations (MLG-B1). */
export type LiveCompetitionInvitationListItem = {
	session: {
		id: number;
		status: string;
		theme: string;
		game_name: string | null;
		goal_label?: string;
		question_total: number;
	};
	invite: {
		status: string;
		invited_at: string | null;
		accepted_at: string | null;
		expires_at: string | null;
	};
	joined: boolean;
	can_join: boolean;
	block_reason: string | null;
};

export type LiveCompetitionJoinPayload = {
	session: {
		id: number;
		status: string;
	};
	invite: {
		status: string;
		accepted_at: string | null;
	};
	player: {
		id: number;
		student_id: number;
	};
};

export type LiveCompetitionStealRewardOption = {
	password: string;
	hint?: string | null;
};

export type LiveCompetitionIndexedRewardOption = {
	index: number;
	/** Visual-only chest art; never includes coin amounts. */
	image?: string;
};

export type LiveCompetitionLabeledRewardOption = {
	protocol?: string;
	risk?: string;
	image?: string;
	label?: string;
	hint?: string;
};

export type LiveCompetitionRewardOption =
	| LiveCompetitionStealRewardOption
	| LiveCompetitionIndexedRewardOption
	| LiveCompetitionLabeledRewardOption;

/**
 * Mode-aware GET current view. Optional fields are set only when present and valid.
 * Never includes correct_answer, real, owner_id, or raw reward_data.
 */
export type LiveCompetitionCurrentView = {
	session_id: number;
	status: string;
	mode: string;
	theme?: string;
	live_version?: number;
	score?: number;
	coins?: number;
	streak?: number;
	power?: string | null;
	power_used?: boolean;
	power_label?: string | null;
	frozen?: boolean;
	frozen_seconds?: number;
	has_password?: boolean;
	reward_pending?: boolean;
	pending_reinforce?: boolean;
	/** need_password */
	password_options?: string[];
	/** question / reinforce */
	live_game_session_question_id?: number;
	question?: string;
	image?: string | null;
	voice_url?: string | null;
	answer_type?: string;
	choices?: string[];
	is_retry?: boolean;
	question_seconds?: number;
	clock_started?: boolean;
	seconds_left?: number;
	/** reinforce */
	explanation?: string | null;
	wrong_answer?: string | null;
	timed_out?: boolean;
	/** reward */
	reward_type?: string | null;
	reward_options?: LiveCompetitionRewardOption[];
	/** done / ended */
	done?: boolean;
	/** True when teacher cancelled the lobby before Begin. */
	cancelled?: boolean;
	rank?: number | null;
	best_streak?: number;
	progress?: number;
	accuracy?: number;
	question_total?: number;
	class_accuracy?: number | null;
	fire_lit?: boolean;
	fastest_ms?: number | null;
	goal?: string | null;
	goal_label?: string | null;
};

/**
 * POST answers / timeout feedback.
 * correct_answer is allowed only here (post-submit), never on /current.
 */
export type LiveCompetitionAnswerFeedback = {
	session_id: number;
	live_game_session_question_id: number;
	answer: string;
	correct: boolean;
	timed_out: boolean;
	explanation?: string | null;
	/** Present after incorrect/timeout only when the API sends it. */
	correct_answer?: string | null;
	answer_type?: string | null;
	question?: string;
	score?: number;
	coins?: number;
	coins_awarded?: number;
	streak?: number;
	pending_reinforce?: boolean;
	reward_pending?: boolean;
};

export type LiveCompetitionReinforceResult = {
	live_game_session_question_id: number;
	answer: string;
	correct: boolean;
	coins_awarded?: number;
	coins?: number;
	pending_reinforce?: boolean;
};

export type LiveCompetitionClaimResult = {
	type: string | null;
	message?: string | null;
	coins_awarded?: number;
	coins?: number;
	reward_pending?: boolean;
	shield?: boolean;
	progress_penalty?: number;
	last_protocol?: string | null;
};

export type LiveCompetitionPowerResult = {
	power?: string | null;
	power_label?: string | null;
	power_used?: boolean;
	shield?: boolean;
	message?: string | null;
};

export type LiveCompetitionPasswordResult = {
	has_password: boolean;
	password_options?: string[];
	already_selected?: boolean;
};

export type LiveCompetitionApiErrorKind =
	| 'not_found'
	| 'not_eligible'
	| 'not_in_lobby'
	| 'disabled'
	| 'unauthenticated'
	| 'network'
	| 'unknown';

/**
 * Feature-scoped API error that preserves HTTP status / errNum.
 * Avoids the shared Axios interceptor which drops status into a bare Error(message).
 */
export class LiveCompetitionApiError extends Error {
	status: number | null;
	errNum: string | null;

	constructor(message: string, status: number | null = null, errNum: string | null = null) {
		super(message);
		this.name = 'LiveCompetitionApiError';
		this.status = status;
		this.errNum = errNum;
	}
}

export function classifyLiveCompetitionApiError(error: unknown): {
	kind: LiveCompetitionApiErrorKind;
	message: string;
} {
	const message =
		error instanceof Error && error.message
			? error.message
			: typeof error === 'string'
				? error
				: 'Request failed';

	const status = error instanceof LiveCompetitionApiError ? error.status : null;
	const errNum = error instanceof LiveCompetitionApiError ? error.errNum : null;

	if (status === 401 || errNum === 'E3001' || /unauthenticated|token has expired/i.test(message)) {
		return { kind: 'unauthenticated', message };
	}
	if (
		/live competitions are disabled/i.test(message) ||
		(status === 404 && /disabled/i.test(message))
	) {
		return { kind: 'disabled', message };
	}
	if (status === 409 || /session is not in lobby/i.test(message)) {
		return { kind: 'not_in_lobby', message };
	}
	if (status === 422) {
		return { kind: 'not_eligible', message };
	}
	if (status === 404 || /invitation not found|session not found/i.test(message)) {
		return { kind: 'not_found', message };
	}
	if (
		/invitation has expired|invitation is not pending|not an active member of this class/i.test(
			message
		)
	) {
		return { kind: 'not_eligible', message };
	}
	if (!status && /network|unavailable|failed/i.test(message)) {
		return { kind: 'network', message };
	}
	if (status != null && status >= 500) {
		return { kind: 'network', message };
	}
	return { kind: 'unknown', message };
}

function asRecord(value: unknown): Record<string, unknown> | null {
	return value && typeof value === 'object' && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: null;
}

/** Recursively drop sensitive keys from untrusted API JSON. */
export function omitSensitiveFields(value: unknown): unknown {
	if (Array.isArray(value)) {
		return value.map(omitSensitiveFields);
	}
	const record = asRecord(value);
	if (!record) {
		return value;
	}
	const out: Record<string, unknown> = {};
	for (const [key, child] of Object.entries(record)) {
		if (SENSITIVE_KEYS.has(key)) {
			continue;
		}
		out[key] = omitSensitiveFields(child);
	}
	return out;
}

function optionalFiniteNumber(value: unknown): number | undefined {
	if (value == null || value === '') {
		return undefined;
	}
	const n = Number(value);
	return Number.isFinite(n) ? n : undefined;
}

function optionalString(value: unknown): string | undefined {
	if (value == null) {
		return undefined;
	}
	return String(value);
}

function optionalNullableString(value: unknown): string | null | undefined {
	if (value === undefined) {
		return undefined;
	}
	if (value === null) {
		return null;
	}
	return String(value);
}

function optionalBoolean(value: unknown): boolean | undefined {
	if (value === undefined) {
		return undefined;
	}
	return Boolean(value);
}

function parseStringList(value: unknown): string[] | undefined {
	if (!Array.isArray(value)) {
		return undefined;
	}
	return value.map((item) => String(item));
}

function parseRewardOptions(
	rewardType: string | null | undefined,
	raw: unknown
): LiveCompetitionRewardOption[] | undefined {
	if (!Array.isArray(raw)) {
		return undefined;
	}
	const options: LiveCompetitionRewardOption[] = [];
	raw.forEach((item, index) => {
		const opt = asRecord(item);
		if (!opt) {
			return;
		}
		if (rewardType === 'steal') {
			if (opt.password == null) {
				return;
			}
			const row: LiveCompetitionStealRewardOption = {
				password: String(opt.password),
			};
			if (opt.hint !== undefined) {
				row.hint = opt.hint == null ? null : String(opt.hint);
			}
			options.push(row);
			return;
		}
		if (rewardType === 'gift' || rewardType === 'chest') {
			const idx = optionalFiniteNumber(opt.index);
			const row: LiveCompetitionIndexedRewardOption = {
				index: idx !== undefined ? idx : index,
			};
			if (opt.image !== undefined && opt.image !== null && String(opt.image) !== '') {
				row.image = String(opt.image);
			}
			// Legacy risk chests may still send risk/label/hint without index amounts.
			if (rewardType === 'chest' && (opt.risk != null || opt.label != null || opt.hint != null)) {
				const labeled: LiveCompetitionLabeledRewardOption = {};
				for (const key of ['protocol', 'risk', 'image', 'label', 'hint'] as const) {
					if (opt[key] !== undefined && opt[key] !== null) {
						labeled[key] = String(opt[key]);
					}
				}
				if (Object.keys(labeled).length > 0) {
					options.push(labeled);
				}
				return;
			}
			options.push(row);
			return;
		}
		const labeled: LiveCompetitionLabeledRewardOption = {};
		for (const key of ['protocol', 'risk', 'image', 'label', 'hint'] as const) {
			if (opt[key] !== undefined && opt[key] !== null) {
				labeled[key] = String(opt[key]);
			}
		}
		if (Object.keys(labeled).length > 0) {
			options.push(labeled);
		}
	});
	return options;
}

function parseInviteSessionAndJoinability(
	body: Record<string, unknown>
): {
	session: LiveCompetitionInvitePreview['session'];
	inviteBase: {
		status: string;
		accepted_at: string | null;
		expires_at: string | null;
		invited_at?: string | null;
	};
	joined: boolean;
	can_join: boolean;
	block_reason: string | null;
} | null {
	const session = asRecord(body.session);
	const invite = asRecord(body.invite);
	if (!session || !invite) {
		return null;
	}

	const id = Number(session.id);
	if (!Number.isFinite(id) || id <= 0) {
		return null;
	}

	const inviteBase: {
		status: string;
		accepted_at: string | null;
		expires_at: string | null;
		invited_at?: string | null;
	} = {
		status: String(invite.status ?? ''),
		accepted_at: invite.accepted_at == null ? null : String(invite.accepted_at),
		expires_at: invite.expires_at == null ? null : String(invite.expires_at),
	};
	if (invite.invited_at !== undefined) {
		inviteBase.invited_at = invite.invited_at == null ? null : String(invite.invited_at);
	}

	return {
		session: {
			id,
			status: String(session.status ?? ''),
			theme: String(session.theme ?? ''),
			game_name:
				session.game_name == null || session.game_name === ''
					? null
					: String(session.game_name),
			...(session.goal_label != null && String(session.goal_label) !== ''
				? { goal_label: String(session.goal_label) }
				: {}),
			question_total: Number(session.question_total) || 0,
		},
		inviteBase,
		joined: Boolean(body.joined),
		can_join: Boolean(body.can_join),
		block_reason: body.block_reason == null ? null : String(body.block_reason),
	};
}

export function parseInvitePreview(raw: unknown): LiveCompetitionInvitePreview | null {
	const scrubbed = omitSensitiveFields(raw);
	const root = asRecord(scrubbed);
	const fromEnvelope = asRecord(root?.preview);
	const body = fromEnvelope ?? (root && 'session' in root ? root : null);
	if (!body) {
		return null;
	}

	const parsed = parseInviteSessionAndJoinability(body);
	if (!parsed) {
		return null;
	}

	return {
		session: parsed.session,
		invite: parsed.inviteBase,
		joined: parsed.joined,
		can_join: parsed.can_join,
		block_reason: parsed.block_reason,
	};
}

export function parseInvitationListItem(raw: unknown): LiveCompetitionInvitationListItem | null {
	const scrubbed = omitSensitiveFields(raw);
	const body = asRecord(scrubbed);
	if (!body) {
		return null;
	}

	const parsed = parseInviteSessionAndJoinability(body);
	if (!parsed) {
		return null;
	}

	return {
		session: parsed.session,
		invite: {
			status: parsed.inviteBase.status,
			invited_at:
				parsed.inviteBase.invited_at !== undefined
					? parsed.inviteBase.invited_at
					: null,
			accepted_at: parsed.inviteBase.accepted_at,
			expires_at: parsed.inviteBase.expires_at,
		},
		joined: parsed.joined,
		can_join: parsed.can_join,
		block_reason: parsed.block_reason,
	};
}

/**
 * Parse GET invitations envelope. Returns null if the envelope is missing/invalid.
 * Empty array is valid. Invalid rows are dropped (not invented).
 */
export function parseInvitationsList(raw: unknown): LiveCompetitionInvitationListItem[] | null {
	const scrubbed = omitSensitiveFields(raw);
	const root = asRecord(scrubbed);
	if (!root || !Array.isArray(root.invitations)) {
		return null;
	}

	const items: LiveCompetitionInvitationListItem[] = [];
	for (const entry of root.invitations) {
		const item = parseInvitationListItem(entry);
		if (item) {
			items.push(item);
		}
	}
	return items;
}

export type LiveCompetitionInvitationsPage = {
	items: LiveCompetitionInvitationListItem[];
	pagination: {
		page: number;
		per_page: number;
		total: number;
		has_more: boolean;
	};
};

/**
 * Parse invitations + optional pagination meta.
 * Missing pagination defaults to a single page of the returned rows (backward compatible).
 */
export function parseInvitationsPage(raw: unknown): LiveCompetitionInvitationsPage | null {
	const items = parseInvitationsList(raw);
	if (!items) {
		return null;
	}
	const scrubbed = omitSensitiveFields(raw);
	const root = asRecord(scrubbed);
	const paginationRaw = asRecord(root?.pagination);
	const page = optionalFiniteNumber(paginationRaw?.page) ?? 1;
	const perPage =
		optionalFiniteNumber(paginationRaw?.per_page) ??
		Math.max(items.length, LIVE_INVITATIONS_PAGE_SIZE);
	const total = optionalFiniteNumber(paginationRaw?.total) ?? items.length;
	const hasMore =
		optionalBoolean(paginationRaw?.has_more) ?? total > page * perPage;

	return {
		items,
		pagination: {
			page,
			per_page: perPage,
			total,
			has_more: Boolean(hasMore),
		},
	};
}

export function parseJoinPayload(raw: unknown): LiveCompetitionJoinPayload | null {
	const root = asRecord(raw);
	const join = asRecord(root?.join);
	if (!join) {
		return null;
	}
	const session = asRecord(join.session);
	const invite = asRecord(join.invite);
	const player = asRecord(join.player);
	if (!session || !invite || !player) {
		return null;
	}
	const sessionId = Number(session.id);
	const playerId = Number(player.id);
	const studentId = Number(player.student_id);
	if (!Number.isFinite(sessionId) || !Number.isFinite(playerId) || !Number.isFinite(studentId)) {
		return null;
	}
	return {
		session: {
			id: sessionId,
			status: String(session.status ?? ''),
		},
		invite: {
			status: String(invite.status ?? ''),
			accepted_at: invite.accepted_at == null ? null : String(invite.accepted_at),
		},
		player: {
			id: playerId,
			student_id: studentId,
		},
	};
}

export function isPersonalDone(current: LiveCompetitionCurrentView | null): boolean {
	return Boolean(
		current &&
			current.status === 'playing' &&
			(current.mode === 'done' || current.done === true)
	);
}

export function isEndedResults(current: LiveCompetitionCurrentView | null): boolean {
	return Boolean(current && current.status === 'ended');
}

export function parseCurrentView(raw: unknown): LiveCompetitionCurrentView | null {
	const scrubbed = omitSensitiveFields(raw);
	const root = asRecord(scrubbed);
	const current = asRecord(root?.current);
	if (!current) {
		return null;
	}
	const sessionId = Number(current.session_id);
	if (!Number.isFinite(sessionId) || sessionId <= 0) {
		return null;
	}

	const view: LiveCompetitionCurrentView = {
		session_id: sessionId,
		status: String(current.status ?? ''),
		mode: String(current.mode ?? ''),
	};

	const theme = optionalString(current.theme);
	if (theme !== undefined) {
		view.theme = theme;
	}
	const liveVersion = optionalFiniteNumber(current.live_version);
	if (liveVersion !== undefined) {
		view.live_version = liveVersion;
	}

	const score = optionalFiniteNumber(current.score);
	if (score !== undefined) {
		view.score = score;
	}
	const coins = optionalFiniteNumber(current.coins);
	if (coins !== undefined) {
		view.coins = coins;
	}
	const streak = optionalFiniteNumber(current.streak);
	if (streak !== undefined) {
		view.streak = streak;
	}
	if (current.power !== undefined) {
		view.power = current.power == null ? null : String(current.power);
	}
	const powerUsed = optionalBoolean(current.power_used);
	if (powerUsed !== undefined) {
		view.power_used = powerUsed;
	}
	if (current.power_label !== undefined) {
		view.power_label = current.power_label == null ? null : String(current.power_label);
	}
	const frozen = optionalBoolean(current.frozen);
	if (frozen !== undefined) {
		view.frozen = frozen;
	}
	const frozenSeconds = optionalFiniteNumber(current.frozen_seconds);
	if (frozenSeconds !== undefined) {
		view.frozen_seconds = frozenSeconds;
	}
	const hasPassword = optionalBoolean(current.has_password);
	if (hasPassword !== undefined) {
		view.has_password = hasPassword;
	}
	const rewardPending = optionalBoolean(current.reward_pending);
	if (rewardPending !== undefined) {
		view.reward_pending = rewardPending;
	}
	const pendingReinforce = optionalBoolean(current.pending_reinforce);
	if (pendingReinforce !== undefined) {
		view.pending_reinforce = pendingReinforce;
	}

	const mode = view.mode;

	if (mode === 'need_password') {
		const options = parseStringList(current.password_options);
		if (options) {
			view.password_options = options;
		}
	}

	if (mode === 'question' || mode === 'reinforce') {
		const qid = optionalFiniteNumber(current.live_game_session_question_id);
		if (qid !== undefined) {
			view.live_game_session_question_id = qid;
		}
		const question = optionalString(current.question);
		if (question !== undefined) {
			view.question = question;
		}
		if (current.image !== undefined) {
			view.image = current.image == null ? null : String(current.image);
		}
		if (current.voice_url !== undefined) {
			view.voice_url = current.voice_url == null ? null : String(current.voice_url);
		}
		const answerType = optionalString(current.answer_type);
		if (answerType !== undefined) {
			view.answer_type = answerType;
		}
		const choices = parseStringList(current.choices);
		if (choices) {
			view.choices = choices;
		}
	}

	if (mode === 'question') {
		const isRetry = optionalBoolean(current.is_retry);
		if (isRetry !== undefined) {
			view.is_retry = isRetry;
		}
		const questionSeconds = optionalFiniteNumber(current.question_seconds);
		if (questionSeconds !== undefined) {
			view.question_seconds = questionSeconds;
		}
		const clockStarted = optionalBoolean(current.clock_started);
		if (clockStarted !== undefined) {
			view.clock_started = clockStarted;
		}
		const secondsLeft = optionalFiniteNumber(current.seconds_left);
		if (secondsLeft !== undefined) {
			view.seconds_left = secondsLeft;
		}
	}

	if (mode === 'reinforce') {
		if (current.explanation !== undefined) {
			view.explanation = current.explanation == null ? null : String(current.explanation);
		}
		if (current.wrong_answer !== undefined) {
			view.wrong_answer = current.wrong_answer == null ? null : String(current.wrong_answer);
		}
		const timedOut = optionalBoolean(current.timed_out);
		if (timedOut !== undefined) {
			view.timed_out = timedOut;
		}
	}

	if (mode === 'reward') {
		if (current.reward_type !== undefined) {
			view.reward_type = current.reward_type == null ? null : String(current.reward_type);
		}
		const options = parseRewardOptions(view.reward_type, current.reward_options);
		if (options) {
			view.reward_options = options;
		}
	}

	if (mode === 'done' || view.status === 'ended') {
		const done = optionalBoolean(current.done);
		if (done !== undefined) {
			view.done = done;
		}
	}

	if (view.status === 'ended') {
		const cancelled = optionalBoolean(current.cancelled);
		if (cancelled !== undefined) {
			view.cancelled = cancelled;
		}
		if (current.rank !== undefined) {
			view.rank = current.rank == null ? null : optionalFiniteNumber(current.rank) ?? null;
		}
		const bestStreak = optionalFiniteNumber(current.best_streak);
		if (bestStreak !== undefined) {
			view.best_streak = bestStreak;
		}
		const progress = optionalFiniteNumber(current.progress);
		if (progress !== undefined) {
			view.progress = progress;
		}
		const accuracy = optionalFiniteNumber(current.accuracy);
		if (accuracy !== undefined) {
			view.accuracy = accuracy;
		}
		const questionTotal = optionalFiniteNumber(current.question_total);
		if (questionTotal !== undefined) {
			view.question_total = questionTotal;
		}
		if (current.class_accuracy !== undefined) {
			view.class_accuracy =
				current.class_accuracy == null
					? null
					: optionalFiniteNumber(current.class_accuracy) ?? null;
		}
		const fireLit = optionalBoolean(current.fire_lit);
		if (fireLit !== undefined) {
			view.fire_lit = fireLit;
		}
		if (current.fastest_ms !== undefined) {
			view.fastest_ms =
				current.fastest_ms == null ? null : optionalFiniteNumber(current.fastest_ms) ?? null;
		}
		if (current.goal !== undefined) {
			view.goal = optionalNullableString(current.goal) ?? null;
		}
		if (current.goal_label !== undefined) {
			view.goal_label = optionalNullableString(current.goal_label) ?? null;
		}
	}

	return view;
}

export function parseAnswerFeedback(raw: unknown): LiveCompetitionAnswerFeedback | null {
	const rootRaw = asRecord(raw);
	const bodyRaw =
		asRecord(rootRaw?.answer) ?? (rootRaw && 'correct' in (rootRaw ?? {}) ? rootRaw : null);
	// Whitelist post-submit reveal fields before the global sensitive-key scrub.
	const revealedCorrect =
		bodyRaw && bodyRaw.correct_answer !== undefined
			? bodyRaw.correct_answer == null
				? null
				: String(bodyRaw.correct_answer)
			: undefined;
	const revealedType =
		bodyRaw && bodyRaw.answer_type !== undefined
			? bodyRaw.answer_type == null
				? null
				: String(bodyRaw.answer_type)
			: undefined;

	const scrubbed = omitSensitiveFields(raw);
	const root = asRecord(scrubbed);
	const body = asRecord(root?.answer) ?? (root && 'correct' in (root ?? {}) ? root : null);
	if (!body) {
		return null;
	}
	const sessionId = optionalFiniteNumber(body.session_id);
	const qid = optionalFiniteNumber(body.live_game_session_question_id);
	if (sessionId === undefined || qid === undefined || body.answer == null) {
		return null;
	}
	if (typeof body.correct !== 'boolean' && body.correct !== 0 && body.correct !== 1) {
		return null;
	}
	const feedback: LiveCompetitionAnswerFeedback = {
		session_id: sessionId,
		live_game_session_question_id: qid,
		answer: String(body.answer),
		correct: Boolean(body.correct),
		timed_out: Boolean(body.timed_out),
	};
	if (body.explanation !== undefined) {
		feedback.explanation = body.explanation == null ? null : String(body.explanation);
	}
	if (revealedCorrect !== undefined && (!feedback.correct || feedback.timed_out)) {
		feedback.correct_answer = revealedCorrect;
	}
	if (revealedType !== undefined) {
		feedback.answer_type = revealedType;
	}
	const question = optionalString(body.question);
	if (question !== undefined) {
		feedback.question = question;
	}
	const score = optionalFiniteNumber(body.score);
	if (score !== undefined) {
		feedback.score = score;
	}
	const coins = optionalFiniteNumber(body.coins);
	if (coins !== undefined) {
		feedback.coins = coins;
	}
	const coinsAwarded = optionalFiniteNumber(body.coins_awarded);
	if (coinsAwarded !== undefined) {
		feedback.coins_awarded = coinsAwarded;
	}
	const streak = optionalFiniteNumber(body.streak);
	if (streak !== undefined) {
		feedback.streak = streak;
	}
	const pendingReinforce = optionalBoolean(body.pending_reinforce);
	if (pendingReinforce !== undefined) {
		feedback.pending_reinforce = pendingReinforce;
	}
	const rewardPending = optionalBoolean(body.reward_pending);
	if (rewardPending !== undefined) {
		feedback.reward_pending = rewardPending;
	}
	return feedback;
}

export function parseReinforceResult(raw: unknown): LiveCompetitionReinforceResult | null {
	const scrubbed = omitSensitiveFields(raw);
	const root = asRecord(scrubbed);
	const body = asRecord(root?.reinforce) ?? null;
	if (!body) {
		return null;
	}
	const qid = optionalFiniteNumber(body.live_game_session_question_id);
	if (qid === undefined || body.answer == null) {
		return null;
	}
	const result: LiveCompetitionReinforceResult = {
		live_game_session_question_id: qid,
		answer: String(body.answer),
		correct: Boolean(body.correct),
	};
	const coinsAwarded = optionalFiniteNumber(body.coins_awarded);
	if (coinsAwarded !== undefined) {
		result.coins_awarded = coinsAwarded;
	}
	const coins = optionalFiniteNumber(body.coins);
	if (coins !== undefined) {
		result.coins = coins;
	}
	const pendingReinforce = optionalBoolean(body.pending_reinforce);
	if (pendingReinforce !== undefined) {
		result.pending_reinforce = pendingReinforce;
	}
	return result;
}

export function parseClaimResult(raw: unknown): LiveCompetitionClaimResult | null {
	const scrubbed = omitSensitiveFields(raw);
	const root = asRecord(scrubbed);
	const body = asRecord(root?.claim);
	if (!body) {
		return null;
	}
	const result: LiveCompetitionClaimResult = {
		type: body.type == null ? null : String(body.type),
	};
	if (body.message !== undefined) {
		result.message = body.message == null ? null : String(body.message);
	}
	const coinsAwarded = optionalFiniteNumber(body.coins_awarded);
	if (coinsAwarded !== undefined) {
		result.coins_awarded = coinsAwarded;
	}
	const coins = optionalFiniteNumber(body.coins);
	if (coins !== undefined) {
		result.coins = coins;
	}
	const rewardPending = optionalBoolean(body.reward_pending);
	if (rewardPending !== undefined) {
		result.reward_pending = rewardPending;
	}
	const shield = optionalBoolean(body.shield);
	if (shield !== undefined) {
		result.shield = shield;
	}
	const progressPenalty = optionalFiniteNumber(body.progress_penalty);
	if (progressPenalty !== undefined) {
		result.progress_penalty = progressPenalty;
	}
	if (body.last_protocol !== undefined) {
		result.last_protocol = body.last_protocol == null ? null : String(body.last_protocol);
	}
	return result;
}

export function parsePowerResult(raw: unknown): LiveCompetitionPowerResult | null {
	const scrubbed = omitSensitiveFields(raw);
	const root = asRecord(scrubbed);
	const body = asRecord(root?.power);
	if (!body) {
		return null;
	}
	const result: LiveCompetitionPowerResult = {};
	if (body.power !== undefined) {
		result.power = body.power == null ? null : String(body.power);
	}
	if (body.power_label !== undefined) {
		result.power_label = body.power_label == null ? null : String(body.power_label);
	}
	const powerUsed = optionalBoolean(body.power_used);
	if (powerUsed !== undefined) {
		result.power_used = powerUsed;
	}
	const shield = optionalBoolean(body.shield);
	if (shield !== undefined) {
		result.shield = shield;
	}
	if (body.message !== undefined) {
		result.message = body.message == null ? null : String(body.message);
	}
	return result;
}

export function parsePasswordResult(raw: unknown): LiveCompetitionPasswordResult | null {
	const scrubbed = omitSensitiveFields(raw);
	const root = asRecord(scrubbed);
	const body = asRecord(root?.password);
	if (!body || body.has_password === undefined) {
		return null;
	}
	const result: LiveCompetitionPasswordResult = {
		has_password: Boolean(body.has_password),
	};
	const options = parseStringList(body.password_options);
	if (options) {
		result.password_options = options;
	}
	const already = optionalBoolean(body.already_selected);
	if (already !== undefined) {
		result.already_selected = already;
	}
	return result;
}

/**
 * Narrow live-competition HTTP client. Does not use the shared student interceptor
 * so HTTP status / errNum remain available for classification.
 */
async function liveCompetitionRequest(
	method: 'get' | 'post',
	path: string,
	body?: Record<string, unknown>
): Promise<Record<string, unknown>> {
	const base = resolveStudentApiBaseUrl().replace(/\/+$/, '');
	const url = `${base}/${path.replace(/^\//, '')}`;
	const token = Cookies.get('token_');

	try {
		const response = await axios.request({
			method,
			url,
			data: method === 'post' ? body ?? {} : undefined,
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				...(token ? { Authorizations: `Bearer ${token}` } : {}),
				...(apiSecret ? { apiSecret } : {}),
			},
			validateStatus: () => true,
		});

		const data = (response.data && typeof response.data === 'object'
			? response.data
			: {}) as Record<string, unknown>;
		const status = response.status;
		const msg = typeof data.msg === 'string' ? data.msg : '';
		const errNum = data.errNum == null ? null : String(data.errNum);

		if (status === 401 || (data.status === false && errNum === 'E3001')) {
			throw new LiveCompetitionApiError(msg || 'Unauthenticated', status, errNum);
		}
		if (status >= 400 || data.status === false) {
			throw new LiveCompetitionApiError(
				msg || `Request failed (${status})`,
				status,
				errNum
			);
		}

		return data;
	} catch (error) {
		if (error instanceof LiveCompetitionApiError) {
			throw error;
		}
		if (axios.isAxiosError(error)) {
			const status = error.response?.status ?? null;
			const data = asRecord(error.response?.data);
			const msg =
				(typeof data?.msg === 'string' && data.msg) ||
				error.message ||
				'Network error';
			const errNum = data?.errNum == null ? null : String(data.errNum);
			throw new LiveCompetitionApiError(msg, status, errNum);
		}
		throw new LiveCompetitionApiError(
			error instanceof Error ? error.message : 'Network error',
			null,
			null
		);
	}
}

function sessionPath(sessionId: number, suffix: string): string {
	return `live-competitions/sessions/${sessionId}/${suffix}`;
}

export async function getLiveCompetitionInvitations(opts?: {
	page?: number;
	per_page?: number;
}): Promise<LiveCompetitionInvitationsPage> {
	const page = Math.max(1, opts?.page ?? 1);
	const perPage = Math.max(
		1,
		Math.min(50, opts?.per_page ?? LIVE_INVITATIONS_PAGE_SIZE)
	);
	const res = await liveCompetitionRequest(
		'get',
		`live-competitions/invitations?page=${page}&per_page=${perPage}`
	);
	const parsed = parseInvitationsPage(res);
	if (!parsed) {
		throw new LiveCompetitionApiError('Invitations could not be loaded.', null, null);
	}
	return parsed;
}

export async function fetchLiveCompetitionPreview(
	sessionId: number
): Promise<LiveCompetitionInvitePreview> {
	const res = await liveCompetitionRequest('get', sessionPath(sessionId, 'preview'));
	const parsed = parseInvitePreview(res);
	if (!parsed) {
		throw new LiveCompetitionApiError('Invitation preview could not be loaded.', null, null);
	}
	return parsed;
}

export async function joinLiveCompetitionSession(
	sessionId: number
): Promise<LiveCompetitionJoinPayload> {
	const res = await liveCompetitionRequest('post', sessionPath(sessionId, 'join'), {});
	const parsed = parseJoinPayload(res);
	if (!parsed) {
		throw new LiveCompetitionApiError('Could not join this session.', null, null);
	}
	return parsed;
}

export async function fetchLiveCompetitionCurrent(
	sessionId: number
): Promise<LiveCompetitionCurrentView> {
	const res = await liveCompetitionRequest('get', sessionPath(sessionId, 'current'));
	const parsed = parseCurrentView(res);
	if (!parsed) {
		throw new LiveCompetitionApiError('Session status could not be loaded.', null, null);
	}
	return parsed;
}

export async function startLiveCompetitionQuestionClock(
	sessionId: number
): Promise<LiveCompetitionCurrentView> {
	const res = await liveCompetitionRequest(
		'post',
		sessionPath(sessionId, 'start-question-clock'),
		{}
	);
	const parsed = parseCurrentView(res);
	if (!parsed) {
		throw new LiveCompetitionApiError('Question clock could not be started.', null, null);
	}
	return parsed;
}

export async function submitLiveCompetitionAnswer(
	sessionId: number,
	liveGameSessionQuestionId: number,
	answer: string
): Promise<LiveCompetitionAnswerFeedback> {
	const res = await liveCompetitionRequest('post', sessionPath(sessionId, 'answers'), {
		live_game_session_question_id: liveGameSessionQuestionId,
		answer,
	});
	const parsed = parseAnswerFeedback(res);
	if (!parsed) {
		throw new LiveCompetitionApiError('Answer response could not be read.', null, null);
	}
	return parsed;
}

export async function submitLiveCompetitionTimeout(
	sessionId: number,
	liveGameSessionQuestionId: number
): Promise<LiveCompetitionAnswerFeedback> {
	const res = await liveCompetitionRequest('post', sessionPath(sessionId, 'timeout'), {
		live_game_session_question_id: liveGameSessionQuestionId,
	});
	const parsed = parseAnswerFeedback(res);
	if (!parsed) {
		throw new LiveCompetitionApiError('Timeout response could not be read.', null, null);
	}
	return parsed;
}

export async function submitLiveCompetitionReinforce(
	sessionId: number,
	answer: string
): Promise<LiveCompetitionReinforceResult> {
	const res = await liveCompetitionRequest('post', sessionPath(sessionId, 'reinforce'), {
		answer,
	});
	const parsed = parseReinforceResult(res);
	if (!parsed) {
		throw new LiveCompetitionApiError('Reinforce response could not be read.', null, null);
	}
	return parsed;
}

export async function claimLiveCompetitionReward(
	sessionId: number,
	input: { choice?: number; password?: string }
): Promise<LiveCompetitionClaimResult> {
	const body: Record<string, unknown> = {};
	if (input.choice !== undefined) {
		body.choice = input.choice;
	}
	if (input.password !== undefined) {
		body.password = input.password;
	}
	const res = await liveCompetitionRequest(
		'post',
		sessionPath(sessionId, 'claim-reward'),
		body
	);
	const parsed = parseClaimResult(res);
	if (!parsed) {
		throw new LiveCompetitionApiError('Claim response could not be read.', null, null);
	}
	return parsed;
}

export async function useLiveCompetitionPower(
	sessionId: number
): Promise<LiveCompetitionPowerResult> {
	const res = await liveCompetitionRequest('post', sessionPath(sessionId, 'use-power'), {});
	const parsed = parsePowerResult(res);
	if (!parsed) {
		throw new LiveCompetitionApiError('Power response could not be read.', null, null);
	}
	return parsed;
}

export async function pickLiveCompetitionPassword(
	sessionId: number,
	password: string
): Promise<LiveCompetitionPasswordResult> {
	const res = await liveCompetitionRequest('post', sessionPath(sessionId, 'pick-password'), {
		password,
	});
	const parsed = parsePasswordResult(res);
	if (!parsed) {
		throw new LiveCompetitionApiError('Password response could not be read.', null, null);
	}
	return parsed;
}
