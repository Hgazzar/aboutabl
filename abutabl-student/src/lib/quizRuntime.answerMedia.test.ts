import { describe, expect, it } from 'vitest';
import { listMcqOptions, parseQuizStem } from './quizRuntime';

describe('quiz player media contract', () => {
	it('keeps answer text beside image and audio urls', () => {
		const options = listMcqOptions({
			answer1: 'Cat',
			answer1_image: 'http://127.0.0.1/storage/cat.png',
			answer1_audio: 'http://127.0.0.1/storage/cat.mp3',
			answer2: 'Rat',
		});

		expect(options).toEqual([
			{
				index: 1,
				key: 'answer1',
				text: 'Cat',
				image: 'http://127.0.0.1/storage/cat.png',
				audio: 'http://127.0.0.1/storage/cat.mp3',
			},
			{
				index: 2,
				key: 'answer2',
				text: 'Rat',
				image: undefined,
				audio: undefined,
			},
		]);
	});

	it('lists an audio-only answer without changing its index', () => {
		expect(
			listMcqOptions({
				answer1_audio: 'http://127.0.0.1/storage/only.mp3',
				answer2: 'Rat',
			})
		).toEqual([
			{
				index: 1,
				key: 'answer1',
				text: undefined,
				image: undefined,
				audio: 'http://127.0.0.1/storage/only.mp3',
			},
			{
				index: 2,
				key: 'answer2',
				text: 'Rat',
				image: undefined,
				audio: undefined,
			},
		]);
	});

	it('lists an image-only answer so the player can still show the picture', () => {
		expect(
			listMcqOptions({
				answer1_image: 'http://127.0.0.1/storage/cat.png',
			})
		).toEqual([
			{
				index: 1,
				key: 'answer1',
				text: undefined,
				image: 'http://127.0.0.1/storage/cat.png',
				audio: undefined,
			},
		]);
	});

	it('parses question image and audio lines without dropping the text line', () => {
		const lines = parseQuizStem([
			{ type: 'file', ext: 'audio', text: 'http://127.0.0.1/storage/head.mp3' },
			{ type: 'file', ext: 'image', text: 'http://127.0.0.1/storage/cat.png' },
			{ type: 'text', text: 'Which picture shows the cat?' },
		]);

		expect(lines.map((line) => line.ext ?? line.type)).toEqual(['audio', 'image', 'text']);
		expect(lines[2]?.text).toBe('Which picture shows the cat?');
	});
});
