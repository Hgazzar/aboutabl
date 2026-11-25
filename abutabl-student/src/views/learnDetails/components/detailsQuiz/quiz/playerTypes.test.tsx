import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('../../pageHeader', () => ({ default: () => null }));
vi.mock('components/Progress', () => ({ default: () => null }));
vi.mock('components/loading-partially', () => ({ default: () => null }));
vi.mock('./insight', () => ({ Insight: () => null }));

vi.mock('lib/requests', () => ({
	getRequest: vi.fn(() => {
		throw new Error('student API must not be called from the player fixture');
	}),
	postRequest: vi.fn(() => {
		throw new Error('student API must not be called from the player fixture');
	}),
	putRequest: vi.fn(() => {
		throw new Error('student API must not be called from the player fixture');
	}),
}));

import quizReducer from 'redux-toolkit/reducer/QuizReducer';
import { startQuizAttempt, submitQuizAttempt } from 'lib/quizRuntime';
import { getRequest, postRequest, putRequest } from 'lib/requests';
import Quiz from './index';

vi.mock('lib/quizRuntime', async () => {
	const actual = await vi.importActual<typeof import('lib/quizRuntime')>('lib/quizRuntime');
	return {
		...actual,
		startQuizAttempt: vi.fn(),
		submitQuizAttempt: vi.fn(),
		saveQuizProgress: vi.fn(),
	};
});

const startMock = vi.mocked(startQuizAttempt);
const submitMock = vi.mocked(submitQuizAttempt);

function playQuestion(type: string, options: Record<string, unknown> = {}) {
	startMock.mockResolvedValue({
		status: true,
		attempt: {
			id: 1,
			quiz_id: 1,
			status: 'in_progress',
			attempt_no: 1,
			row_version: 1,
			remaining_seconds: null,
			time_limit_seconds: null,
			assign_student_id: null,
			started_at: null,
			ends_at: null,
		},
		play: {
			title: 'Workbook fixture',
			questions: [
				{
					snapshot_question_key: 'i1_q1',
					question_id: 1,
					position: 1,
					type,
					stem: [{ type: 'text', text: 'Look' }],
					options,
					max_score: 1,
				},
			],
		},
		draft_answers: [],
	});
	submitMock.mockResolvedValue({
		status: true,
		attempt_id: 1,
		score: 0,
		max_score: 1,
		percentage: 0,
		pending_manual: false,
		attempt_status: 'auto_graded',
		finalized_at: null,
		pass: false,
	});

	const store = configureStore({ reducer: { QuizReducer: quizReducer } });
	const view = render(
		<Provider store={store}>
			<MemoryRouter initialEntries={['/learn/quiz/1']}>
				<Routes>
					<Route path="/learn/quiz/:idQuiz" element={<Quiz />} />
				</Routes>
			</MemoryRouter>
		</Provider>
	);
	return view;
}

async function openQuestion(type: string, options: Record<string, unknown> = {}) {
	cleanup();
	const view = playQuestion(type, options);
	await waitFor(() => expect(view.getByText('Look')).toBeTruthy());
	return view;
}

async function submittedPayload() {
	fireEvent.click(document.querySelector('button') as HTMLButtonElement);
	await waitFor(() => expect(submitMock).toHaveBeenCalled());
	const body = submitMock.mock.calls[0][1];
	return body.answers[0].response_payload;
}

describe('workbook quiz player types', () => {
	beforeEach(() => {
		cleanup();
		startMock.mockReset();
		submitMock.mockReset();
		vi.mocked(getRequest).mockClear();
		vi.mocked(postRequest).mockClear();
		vi.mocked(putRequest).mockClear();
	});

	it('renders MCQ choices and submits the selected indexes', async () => {
		const view = await openQuestion('MCQ', { answer1: 'Cat', answer2: 'Rat' });
		expect(view.getByText('Cat')).toBeTruthy();
		expect(view.getByText('Rat')).toBeTruthy();

		const boxes = view.getAllByRole('checkbox');
		fireEvent.click(boxes[1]);

		expect(await submittedPayload()).toEqual({ selected: [2] });
		expect(postRequest).not.toHaveBeenCalled();
		expect(putRequest).not.toHaveBeenCalled();
	});

	it('renders TF choices and submits a boolean value', async () => {
		const view = await openQuestion('TF');
		expect(view.getByText('True')).toBeTruthy();
		expect(view.getByText('False')).toBeTruthy();

		fireEvent.click(view.getByText('False'));
		fireEvent.click(view.getByText('True'));
		fireEvent.change(view.getByPlaceholderText('Enter your answer'), {
			target: { value: 'shown' },
		});

		expect(await submittedPayload()).toEqual({ value: true, reason: 'shown' });
		expect(postRequest).not.toHaveBeenCalled();
	});

	it('renders SHN and submits the typed text', async () => {
		const view = await openQuestion('SHN');
		fireEvent.change(view.getByPlaceholderText('Enter your answer'), {
			target: { value: 'short note' },
		});

		expect(await submittedPayload()).toEqual({ value: 'short note' });
		expect(postRequest).not.toHaveBeenCalled();
	});

	it('renders Matching and submits dropped pairs', async () => {
		const view = await openQuestion('Matching', { answer1: 'Cat', answer2: 'Rat' });
		expect(view.getAllByText('Drag your answer here')).toHaveLength(2);

		const cat = view.getByText('Cat');
		const rat = view.getByText('Rat');
		const slots = view.getAllByText('Drag your answer here');
		fireEvent.dragStart(cat);
		fireEvent.drop(slots[0]);
		fireEvent.dragStart(rat);
		fireEvent.drop(slots[1]);

		expect(view.getAllByText('Cat').length).toBeGreaterThan(1);
		expect(await submittedPayload()).toEqual({ pairs: ['1|1', '2|2'] });
		expect(postRequest).not.toHaveBeenCalled();
	});
});
