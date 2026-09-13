import { describe, expect, it } from 'vitest';
import type { DashboardQuestItem, DashboardQuestsPayload } from 'lib/dashboardApi';
import { mainColumnQuestItems } from './MyQuestsWidget';

const sampleQuest = (overrides: Partial<DashboardQuestItem> = {}): DashboardQuestItem => ({
	id: 1,
	quest_type: 'unit_lessons',
	unit_label: 'Unit 2',
	subject_name: 'English',
	subject_id: 10,
	unit_id: 20,
	reward_type: 'xp',
	progress_current: 2,
	progress_target: 3,
	progress_percent: 67,
	status: 'active',
	cta_path: '/learn/10?focusUnit=20',
	...overrides,
});

describe('MyQuestsWidget main column filter', () => {
	it('shows only unit_lessons and excludes weekly_xp', () => {
		const quests: DashboardQuestsPayload = {
			available: true,
			items: [
				sampleQuest({
					id: 2,
					quest_type: 'weekly_xp',
					unit_label: '50',
					subject_name: 'XP',
					subject_id: 0,
					unit_id: 0,
					progress_current: 50,
					progress_target: 50,
					progress_percent: 100,
					cta_path: '/learn',
				}),
				sampleQuest({ id: 1, quest_type: 'unit_lessons' }),
			],
		};

		const items = mainColumnQuestItems(quests);

		expect(items).toHaveLength(1);
		expect(items.every((quest) => quest.quest_type === 'unit_lessons')).toBe(true);
		expect(items.some((quest) => quest.quest_type === 'weekly_xp')).toBe(false);
		expect(items[0]?.id).toBe(1);
	});
});
