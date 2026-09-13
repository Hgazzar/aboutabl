import { describe, expect, it } from 'vitest';
import type { DashboardQuestItem, DashboardQuestsPayload } from 'lib/dashboardApi';
import { questProgressPercent, safeQuestProgressCounts } from './myQuestsUtils';
import { isYourQuestsActive } from './YourQuestsWidget';

const sampleQuest = (overrides: Partial<DashboardQuestItem> = {}): DashboardQuestItem => ({
	id: 1,
	quest_type: 'unit_lessons',
	unit_label: '1 lesson',
	subject_name: 'math',
	subject_id: 5,
	unit_id: 10,
	reward_type: 'xp',
	progress_current: 0,
	progress_target: 1,
	progress_percent: 0,
	status: 'active',
	cta_path: '/learn/5?focusUnit=10',
	...overrides,
});

const emptyQuests = (): DashboardQuestsPayload => ({
	available: false,
	items: [],
});

describe('YourQuestsWidget helpers', () => {
	it('treats available quests with items as active', () => {
		const quests: DashboardQuestsPayload = {
			available: true,
			items: [sampleQuest()],
		};
		expect(isYourQuestsActive(quests)).toBe(true);
	});

	it('treats unavailable or empty quest lists as inactive', () => {
		expect(isYourQuestsActive(emptyQuests())).toBe(false);
		expect(
			isYourQuestsActive({
				available: true,
				items: [],
			})
		).toBe(false);
	});

	it('renders safe progress counts for student quest data', () => {
		expect(
			safeQuestProgressCounts(
				sampleQuest({
					progress_current: 0,
					progress_target: 1,
				})
			)
		).toEqual({ current: 0, target: 1 });

		expect(
			safeQuestProgressCounts(
				sampleQuest({
					progress_current: undefined as unknown as number,
					progress_target: undefined as unknown as number,
				})
			)
		).toEqual({ current: 0, target: 0 });
	});

	it('uses backend progress_percent with clamping for the progress bar', () => {
		const quest = sampleQuest({ progress_percent: 150 });
		expect(questProgressPercent(quest)).toBe(100);

		const zeroTargetQuest = sampleQuest({
			progress_percent: undefined,
			progress_current: 2,
			progress_target: 0,
		});
		expect(questProgressPercent(zeroTargetQuest)).toBe(100);
	});

	it('identifies weekly XP quests for sidebar copy', () => {
		const weeklyQuest = sampleQuest({
			quest_type: 'weekly_xp',
			progress_current: 20,
			progress_target: 50,
			subject_name: 'XP',
		});
		expect(weeklyQuest.quest_type).toBe('weekly_xp');
		expect(safeQuestProgressCounts(weeklyQuest)).toEqual({ current: 20, target: 50 });
	});
});
