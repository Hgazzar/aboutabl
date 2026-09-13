/** Display label for the assignments banner count badge (caps at 99+). */
export function formatAssignmentsBadgeCount(newCount: number): string | null {
	if (newCount <= 0) return null;
	return newCount > 99 ? '99+' : String(newCount);
}
