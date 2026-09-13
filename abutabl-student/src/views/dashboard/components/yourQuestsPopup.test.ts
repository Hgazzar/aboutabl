import { describe, expect, it } from 'vitest';
import type { DashboardQuestItem, DashboardQuestsPayload } from 'lib/dashboardApi';
import {
	isWeeklyXpQuest,
	popupQuestItems,
	questPopupIconFile,
	questRewardXpAmount,
	questSidebarIconFile,
	safeQuestProgressCounts,
} from './myQuestsUtils';
import { isYourQuestsActive } from './YourQuestsWidget';

const sampleQuest = (overrides: Partial<DashboardQuestItem> = {}): DashboardQuestItem => ({
	id: 1,
	quest_type: 'unit_lessons',
	unit_label: '1 lesson',
	subject_name: 'Math',
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

describe('Your Quests popup helpers', () => {
	it('uses the full dashboard quest collection in the popup', () => {
		const quests: DashboardQuestsPayload = {
			available: true,
			items: [
				sampleQuest({ id: 1, quest_type: 'weekly_xp', progress_target: 50 }),
				sampleQuest({ id: 2, quest_type: 'unit_lessons', subject_name: 'English' }),
			],
		};

		expect(popupQuestItems(quests)).toHaveLength(2);
	});

	it('maps quest icon assets for sidebar and popup', () => {
		expect(questSidebarIconFile(sampleQuest())).toBe('quest-book-icon.png');
		expect(questSidebarIconFile(sampleQuest({ quest_type: 'weekly_xp' }))).toBe('flash-4.svg');
		expect(questPopupIconFile(sampleQuest())).toBe('quests-popup-book-icon.png');
		expect(questPopupIconFile(sampleQuest({ quest_type: 'weekly_xp' }))).toBe('quests-popup-flash-icon.png');
	});

	it('derives weekly XP reward from progress_target without inventing unit-lesson XP', () => {
		expect(
			questRewardXpAmount(
				sampleQuest({
					quest_type: 'weekly_xp',
					progress_target: 50,
				})
			)
		).toBe(50);

		expect(questRewardXpAmount(sampleQuest({ quest_type: 'unit_lessons' }))).toBeNull();
	});

	it('keeps existing active/empty quest detection', () => {
		expect(isYourQuestsActive({ available: true, items: [sampleQuest()] })).toBe(true);
		expect(isYourQuestsActive({ available: false, items: [] })).toBe(false);
	});

	it('renders safe progress counts for popup rows', () => {
		expect(
			safeQuestProgressCounts(
				sampleQuest({
					progress_current: 10,
					progress_target: 50,
					quest_type: 'weekly_xp',
				})
			)
		).toEqual({ current: 10, target: 50 });
		expect(isWeeklyXpQuest(sampleQuest({ quest_type: 'weekly_xp' }))).toBe(true);
	});
});

describe('YourQuestsWidget helpers', () => {
	it('re-exports active detection through the widget module', () => {
		expect(isYourQuestsActive({ available: true, items: [sampleQuest()] })).toBe(true);
	});
});
