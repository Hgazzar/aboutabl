import type { DashboardQuestItem } from 'lib/dashboardApi';

export function questCtaPath(quest: DashboardQuestItem): string {
	return quest.cta_path || (quest.subject_id ? `/learn/${quest.subject_id}` : '/learn/books');
}

export function questProgressPercent(quest: DashboardQuestItem): number {
	if (quest.progress_percent != null) {
		return Math.min(100, Math.max(0, quest.progress_percent));
	}
	const target = Math.max(1, quest.progress_target ?? 1);
	const current = Math.min(quest.progress_current ?? 0, target);
	return Math.round((current / target) * 100);
}

export function isWeeklyXpQuest(quest: DashboardQuestItem): boolean {
	return quest.quest_type === 'weekly_xp';
}

export function safeQuestProgressCounts(quest: DashboardQuestItem): {
	current: number;
	target: number;
} {
	return {
		current: Math.max(0, quest.progress_current ?? 0),
		target: Math.max(0, quest.progress_target ?? 0),
	};
}

export function questSidebarIconFile(quest: DashboardQuestItem): string {
	return quest.quest_type === 'unit_lessons' ? 'quest-book-icon.png' : 'flash-4.svg';
}

export function questPopupIconFile(quest: DashboardQuestItem): string {
	return quest.quest_type === 'unit_lessons'
		? 'quests-popup-book-icon.png'
		: 'quests-popup-flash-icon.png';
}

/** Weekly XP quests use progress_target as the XP reward goal from the dashboard API. */
export function questRewardXpAmount(quest: DashboardQuestItem): number | null {
	if (quest.reward_label) {
		const parsed = Number.parseInt(quest.reward_label, 10);
		if (!Number.isNaN(parsed)) return parsed;
	}
	if (isWeeklyXpQuest(quest)) {
		return safeQuestProgressCounts(quest).target || null;
	}
	return null;
}

export function popupQuestItems(quests: { items?: DashboardQuestItem[] }): DashboardQuestItem[] {
	return quests.items ?? [];
}
