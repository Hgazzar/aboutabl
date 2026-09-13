import { describe, expect, it } from 'vitest';
import { questCtaPath, questProgressPercent } from './myQuestsUtils';
import type { DashboardQuestItem } from 'lib/dashboardApi';

const baseQuest: DashboardQuestItem = {
	id: 1,
	quest_type: 'unit_lessons',
	unit_label: 'Unit 2',
	subject_name: 'English',
	subject_id: 10,
	unit_id: 20,
	reward_label: null,
	reward_type: 'xp',
	progress_current: 5,
	progress_target: 10,
	progress_percent: 50,
	status: 'active',
	cta_path: '/learn/10?focusUnit=20',
};

describe('myQuestsUtils', () => {
	it('uses cta_path when present', () => {
		expect(questCtaPath(baseQuest)).toBe('/learn/10?focusUnit=20');
	});

	it('falls back to subject learn path', () => {
		expect(
			questCtaPath({
				...baseQuest,
				cta_path: null,
			})
		).toBe('/learn/10');
	});

	it('computes progress percent from counts when percent missing', () => {
		expect(
			questProgressPercent({
				...baseQuest,
				progress_percent: undefined,
				progress_current: 3,
				progress_target: 6,
			})
		).toBe(50);
	});
});
