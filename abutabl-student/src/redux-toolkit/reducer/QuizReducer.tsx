import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
	QuizRuntimeAttempt,
	QuizRuntimePlayQuestion,
	QuizRuntimeSubmitResponse,
	startQuizAttempt,
	submitQuizAttempt,
	saveQuizProgress,
} from 'lib/quizRuntime';

export type StartQuizArgs = {
	quizId: number | string;
	assignStudentId?: number | null;
};

export const startQuizRuntime = createAsyncThunk(
	'quizRuntime/start',
	async ({ quizId, assignStudentId }: StartQuizArgs) => {
		const result = await startQuizAttempt({
			quiz_id: Number(quizId),
			assign_student_id: assignStudentId ?? null,
		});
		if (result?.status === false) {
			throw new Error(result.msg || 'Failed to start quiz attempt');
		}
		return result;
	}
);

export const submitQuizRuntime = createAsyncThunk(
	'quizRuntime/submit',
	async (
		{
			attemptId,
			rowVersion,
			answers,
		}: {
			attemptId: number;
			rowVersion: number;
			answers: Array<{
				snapshot_question_key: string;
				question_id?: number | null;
				response_payload: Record<string, unknown> | null;
			}>;
		},
		{ rejectWithValue }
	) => {
		try {
			const result = await submitQuizAttempt(attemptId, {
				row_version: rowVersion,
				answers,
			});
			if (result?.status === false) {
				return rejectWithValue(result.msg || 'Submit failed');
			}
			return result;
		} catch (err: unknown) {
			const message =
				err && typeof err === 'object' && 'message' in err
					? String((err as { message?: string }).message)
					: 'Submit failed';
			return rejectWithValue(message);
		}
	}
);

export const saveQuizRuntimeProgress = createAsyncThunk(
	'quizRuntime/save',
	async ({
		attemptId,
		rowVersion,
		answers,
	}: {
		attemptId: number;
		rowVersion: number;
		answers: Array<{
			snapshot_question_key: string;
			question_id?: number | null;
			response_payload: Record<string, unknown> | null;
		}>;
	}) => {
		return saveQuizProgress(attemptId, {
			row_version: rowVersion,
			answers,
		});
	}
);

type QuizRuntimeState = {
	loading: boolean;
	submitting: boolean;
	error: string | null;
	attempt: QuizRuntimeAttempt | null;
	title: string;
	questions: QuizRuntimePlayQuestion[];
	/** Local drafts keyed by snapshot_question_key — never graded on client. */
	answersByKey: Record<string, Record<string, unknown>>;
	result: QuizRuntimeSubmitResponse | null;
};

const initialState: QuizRuntimeState = {
	loading: true,
	submitting: false,
	error: null,
	attempt: null,
	title: '',
	questions: [],
	answersByKey: {},
	result: null,
};

const quizRuntimeSlice = createSlice({
	name: 'quizRuntime',
	initialState,
	reducers: {
		setAnswerDraft(
			state,
			action: PayloadAction<{
				snapshot_question_key: string;
				response_payload: Record<string, unknown> | null;
			}>
		) {
			const key = action.payload.snapshot_question_key;
			if (!key) {
				return;
			}
			if (action.payload.response_payload == null) {
				delete state.answersByKey[key];
				return;
			}
			state.answersByKey[key] = action.payload.response_payload;
		},
		clearQuizRuntime() {
			return { ...initialState, loading: false };
		},
	},
	extraReducers(builder) {
		builder
			.addCase(startQuizRuntime.pending, (state) => {
				state.loading = true;
				state.error = null;
				state.result = null;
			})
			.addCase(startQuizRuntime.fulfilled, (state, action) => {
				state.loading = false;
				state.attempt = action.payload.attempt;
				state.title = action.payload.play?.title || '';
				state.questions = Array.isArray(action.payload.play?.questions)
					? action.payload.play.questions
					: [];
				const drafts: Record<string, Record<string, unknown>> = {};
				(action.payload.draft_answers || []).forEach((draft) => {
					if (draft.snapshot_question_key && draft.response_payload) {
						drafts[draft.snapshot_question_key] = draft.response_payload;
					}
				});
				state.answersByKey = drafts;
			})
			.addCase(startQuizRuntime.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || 'Failed to start quiz';
			})
			.addCase(saveQuizRuntimeProgress.fulfilled, (state, action) => {
				const payload = action.payload as { row_version?: number };
				if (state.attempt && payload?.row_version != null) {
					state.attempt.row_version = Number(payload.row_version);
				}
			})
			.addCase(submitQuizRuntime.pending, (state) => {
				state.submitting = true;
				state.error = null;
			})
			.addCase(submitQuizRuntime.fulfilled, (state, action) => {
				state.submitting = false;
				state.result = action.payload;
			})
			.addCase(submitQuizRuntime.rejected, (state, action) => {
				state.submitting = false;
				state.error = String(action.payload || action.error.message || 'Submit failed');
			});
	},
});

export const { setAnswerDraft, clearQuizRuntime } = quizRuntimeSlice.actions;
export default quizRuntimeSlice.reducer;

/** @deprecated Use startQuizRuntime — kept name alias for gradual import updates. */
export const quizDetails = startQuizRuntime;
