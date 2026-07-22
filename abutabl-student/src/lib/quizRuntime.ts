import { getRequest, postRequest, putRequest } from 'lib/requests';

export type QuizRuntimePlayQuestion = {
	snapshot_question_key: string;
	question_id: number | null;
	position: number | null;
	type: string | null;
	stem: unknown;
	options: Record<string, unknown>;
	max_score: number;
};

export type QuizRuntimeAttempt = {
	id: number;
	quiz_id: number;
	status: string;
	attempt_no: number;
	row_version: number;
	remaining_seconds: number | null;
	time_limit_seconds: number | null;
	assign_student_id: number | null;
	started_at: string | null;
	ends_at: string | null;
};

export type QuizRuntimeStartResponse = {
	status?: boolean;
	attempt: QuizRuntimeAttempt;
	play: {
		title: string;
		questions: QuizRuntimePlayQuestion[];
	};
	draft_answers?: Array<{
		snapshot_question_key: string;
		question_id: number;
		response_payload: Record<string, unknown> | null;
	}>;
	msg?: string;
};

export type QuizRuntimeSubmitResponse = {
	status?: boolean;
	attempt_id: number;
	score: number;
	max_score: number;
	percentage: number;
	pending_manual: boolean;
	attempt_status: string;
	finalized_at: string | null;
	pass: boolean | null;
	msg?: string;
};

export const startQuizAttempt = async (payload: {
	quiz_id: number;
	assign_student_id?: number | null;
}): Promise<QuizRuntimeStartResponse> => {
	return postRequest('quiz-runtime/attempts', {
		quiz_id: payload.quiz_id,
		...(payload.assign_student_id != null
			? { assign_student_id: payload.assign_student_id }
			: {}),
	}) as Promise<QuizRuntimeStartResponse>;
};

export const resumeQuizAttempt = async (payload: {
	quiz_id: number;
	assign_student_id?: number | null;
}): Promise<QuizRuntimeStartResponse> => {
	return getRequest('quiz-runtime/attempts/active', {
		quiz_id: payload.quiz_id,
		...(payload.assign_student_id != null
			? { assign_student_id: payload.assign_student_id }
			: {}),
	}) as Promise<QuizRuntimeStartResponse>;
};

export const saveQuizProgress = async (
	attemptId: number,
	body: {
		row_version: number;
		answers: Array<{
			snapshot_question_key: string;
			question_id?: number | null;
			response_payload: Record<string, unknown> | null;
		}>;
	}
) => {
	return putRequest(`quiz-runtime/attempts/${attemptId}/answers`, body);
};

export const submitQuizAttempt = async (
	attemptId: number,
	body: {
		row_version: number;
		answers: Array<{
			snapshot_question_key: string;
			question_id?: number | null;
			response_payload: Record<string, unknown> | null;
		}>;
	}
): Promise<QuizRuntimeSubmitResponse> => {
	return postRequest(
		`quiz-runtime/attempts/${attemptId}/submit`,
		body
	) as Promise<QuizRuntimeSubmitResponse>;
};

/** Parse frozen snapshot stem into display lines (authoring JSON or plain text). */
export const parseQuizStem = (
	stem: unknown
): Array<{ type: string; text?: string; ext?: string }> => {
	if (stem == null) {
		return [];
	}
	if (typeof stem === 'string') {
		try {
			const parsed = JSON.parse(stem);
			if (Array.isArray(parsed)) {
				return parsed;
			}
			if (parsed && typeof parsed === 'object' && Array.isArray(parsed.lines)) {
				return parsed.lines;
			}
		} catch {
			return [{ type: 'text', text: stem }];
		}
		return [{ type: 'text', text: stem }];
	}
	if (Array.isArray(stem)) {
		return stem as Array<{ type: string; text?: string; ext?: string }>;
	}
	if (typeof stem === 'object' && Array.isArray((stem as { lines?: unknown }).lines)) {
		return (stem as { lines: Array<{ type: string; text?: string; ext?: string }> }).lines;
	}
	return [{ type: 'text', text: String(stem) }];
};

export const listMcqOptions = (
	options: Record<string, unknown> | null | undefined
): Array<{ index: number; key: string; text: unknown; image?: unknown; audio?: unknown }> => {
	if (!options) {
		return [];
	}
	const items: Array<{
		index: number;
		key: string;
		text: unknown;
		image?: unknown;
		audio?: unknown;
	}> = [];
	for (let i = 1; i <= 8; i += 1) {
		const key = `answer${i}`;
		const text = options[key];
		if (text == null || text === '') {
			continue;
		}
		items.push({
			index: i,
			key,
			text,
			image: options[`answer${i}_image`],
			audio: options[`answer${i}_audio`],
		});
	}
	return items;
};
