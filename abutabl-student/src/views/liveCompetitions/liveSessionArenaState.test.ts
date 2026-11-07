import { describe, expect, it } from 'vitest';
import type { LiveCompetitionCurrentView } from 'lib/liveCompetitionsStudentApi';
import { resolveArenaPanel, resolveArenaTheme } from './liveSessionArenaState';

function current(
	overrides: Partial<LiveCompetitionCurrentView> &
		Pick<LiveCompetitionCurrentView, 'status' | 'mode'>
): LiveCompetitionCurrentView {
	return {
		session_id: 55,
		...overrides,
	};
}

describe('liveSessionArenaState', () => {
	it('resolves a panel for every supported mode', () => {
		expect(resolveArenaPanel(null)).toBe('loading');
		expect(
			resolveArenaPanel(current({ status: 'playing', mode: 'need_password', theme: 'hacking' }))
		).toBe('need_password');
		expect(resolveArenaPanel(current({ status: 'playing', mode: 'question' }))).toBe('question');
		expect(resolveArenaPanel(current({ status: 'playing', mode: 'reinforce' }))).toBe(
			'reinforce'
		);
		expect(resolveArenaPanel(current({ status: 'playing', mode: 'reward' }))).toBe('reward');
		expect(resolveArenaPanel(current({ status: 'playing', mode: 'done', done: true }))).toBe(
			'personal_done'
		);
		expect(resolveArenaPanel(current({ status: 'ended', mode: 'done', done: true }))).toBe(
			'ended_results'
		);
	});

	it('never treats personal_done as ended_results', () => {
		const panel = resolveArenaPanel(
			current({ status: 'playing', mode: 'done', done: true, rank: 1 })
		);
		expect(panel).toBe('personal_done');
		expect(panel).not.toBe('ended_results');
	});

	it('ended_results only when status is ended', () => {
		expect(resolveArenaPanel(current({ status: 'ended', mode: 'done' }))).toBe('ended_results');
		expect(resolveArenaPanel(current({ status: 'playing', mode: 'question' }))).not.toBe(
			'ended_results'
		);
	});

	it('theme resolution is presentation-only and independent of panel', () => {
		const question = current({ status: 'playing', mode: 'question', theme: 'classic' });
		const gold = current({ status: 'playing', mode: 'question', theme: 'gold_quest' });
		const hack = current({ status: 'playing', mode: 'need_password', theme: 'hacking' });
		expect(resolveArenaPanel(question)).toBe(resolveArenaPanel(gold));
		expect(resolveArenaTheme(question)).toBe('classic');
		expect(resolveArenaTheme(gold)).toBe('gold_quest');
		expect(resolveArenaTheme(hack)).toBe('hacking');
		expect(resolveArenaTheme(current({ status: 'playing', mode: 'question' }))).toBe('unknown');
	});
});
