import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('../../pageHeader', () => ({ default: () => null }));
vi.mock('components/Progress', () => ({ default: () => null }));
vi.mock('components/loading-partially', () => ({ default: () => null }));
vi.mock('./insight', () => ({ Insight: () => null }));

import quizReducer from 'redux-toolkit/reducer/QuizReducer';
import { startQuizAttempt } from 'lib/quizRuntime';
import Quiz from './index';

vi.mock('lib/quizRuntime', async () => {
	const actual = await vi.importActual<typeof import('lib/quizRuntime')>('lib/quizRuntime');
	return {
		...actual,
		startQuizAttempt: vi.fn(),
	};
});

const startMock = vi.mocked(startQuizAttempt);

function renderQuestion(type: 'MCQ' | 'Matching', options: Record<string, unknown>) {
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
			title: 'Media',
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
	const store = configureStore({ reducer: { QuizReducer: quizReducer } });
	return render(
		<Provider store={store}>
			<MemoryRouter initialEntries={['/learn/quiz/1']}>
				<Routes>
					<Route path="/learn/quiz/:idQuiz" element={<Quiz />} />
				</Routes>
			</MemoryRouter>
		</Provider>
	);
}

async function shownAnswer(type: 'MCQ' | 'Matching', options: Record<string, unknown>) {
	cleanup();
	const view = renderQuestion(type, options);
	await waitFor(() => expect(view.getByText('Look')).toBeTruthy());
	return view;
}

describe('answer image and text', () => {
	it.each(['MCQ', 'Matching'] as const)(
		'%s shows text under the image when both exist',
		async (type) => {
			const view = await shownAnswer(type, {
				answer1: 'Cat',
				answer1_image: 'http://127.0.0.1/storage/cat.png',
			});
			const image = view.container.querySelector('img[src="http://127.0.0.1/storage/cat.png"]');
			expect(image).toBeTruthy();
			expect(view.getByText('Cat')).toBeTruthy();
			expect(image?.nextElementSibling?.textContent).toBe('Cat');
		}
	);

	it.each(['MCQ', 'Matching'] as const)('%s shows text when there is no image', async (type) => {
		const view = await shownAnswer(type, { answer1: 'Rat' });
		expect(view.getByText('Rat')).toBeTruthy();
		expect(view.container.querySelector('img[src="http://127.0.0.1/storage/rat.png"]')).toBeNull();
	});

	it.each(['MCQ', 'Matching'] as const)('%s shows an image when there is no text', async (type) => {
		const view = await shownAnswer(type, {
			answer1_image: 'http://127.0.0.1/storage/only.png',
		});
		expect(view.container.querySelector('img[src="http://127.0.0.1/storage/only.png"]')).toBeTruthy();
		expect(view.queryByText('Cat')).toBeNull();
	});
});

const audio = 'http://127.0.0.1/storage/cat.mp3';
const image = 'http://127.0.0.1/storage/cat.png';

describe('answer audio choices', () => {
	beforeEach(() => {
		HTMLMediaElement.prototype.play = () => Promise.resolve();
	});

	it.each(['MCQ', 'Matching'] as const)('%s shows an audio player for an audio-only choice', async (type) => {
		const view = await shownAnswer(type, { answer1_audio: audio });
		const player = view.container.querySelector('audio') as HTMLAudioElement;
		expect(player).toBeTruthy();
		expect(player.getAttribute('src')).toBe(audio);
		expect(player.hasAttribute('controls')).toBe(true);
		await player.play();
		expect(view.container.querySelector('img[src="http://127.0.0.1/storage/cat.png"]')).toBeNull();
		expect(view.queryByText('Cat')).toBeNull();
	});

	it.each(['MCQ', 'Matching'] as const)('%s shows text and audio', async (type) => {
		const view = await shownAnswer(type, { answer1: 'Cat', answer1_audio: audio });
		expect(view.getByText('Cat')).toBeTruthy();
		expect(view.container.querySelector('audio')?.getAttribute('src')).toBe(audio);
		expect(view.container.querySelector(`img[src="${image}"]`)).toBeNull();
	});

	it.each(['MCQ', 'Matching'] as const)('%s shows an image and audio', async (type) => {
		const view = await shownAnswer(type, { answer1_image: image, answer1_audio: audio });
		expect(view.container.querySelector(`img[src="${image}"]`)).toBeTruthy();
		expect(view.container.querySelector('audio')?.getAttribute('src')).toBe(audio);
		expect(view.queryByText('Cat')).toBeNull();
	});

	it.each(['MCQ', 'Matching'] as const)('%s shows text, image, and audio together', async (type) => {
		const view = await shownAnswer(type, {
			answer1: 'Cat',
			answer1_image: image,
			answer1_audio: audio,
		});
		const picture = view.container.querySelector(`img[src="${image}"]`);
		expect(picture).toBeTruthy();
		expect(picture?.nextElementSibling?.textContent).toBe('Cat');
		expect(view.container.querySelector('audio')?.getAttribute('src')).toBe(audio);
	});

	it.each(['MCQ', 'Matching'] as const)('%s shows text without an audio player', async (type) => {
		const view = await shownAnswer(type, { answer1: 'Rat' });
		expect(view.getByText('Rat')).toBeTruthy();
		expect(view.container.querySelector('audio')).toBeNull();
	});

	it.each(['MCQ', 'Matching'] as const)('%s shows an image without an audio player', async (type) => {
		const view = await shownAnswer(type, { answer1_image: image });
		expect(view.container.querySelector(`img[src="${image}"]`)).toBeTruthy();
		expect(view.container.querySelector('audio')).toBeNull();
	});
});
