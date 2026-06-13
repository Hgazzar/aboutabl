export function gameTypeLabel(type: string, formatMessage: (v: { id: string }) => string): string {
	const idByType: Record<string, string> = {
		classic: 'gameType_classic',
		hacking: 'gameType_hacking',
		gold_quest: 'gameType_gold_quest',
		demo: 'gameType_demo',
	};
	const id = idByType[type] ?? 'gameType_other';
	return formatMessage({ id });
}
