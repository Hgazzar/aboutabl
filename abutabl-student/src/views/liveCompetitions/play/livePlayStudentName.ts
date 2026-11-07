/** Read the signed-in student display name from the existing student session cache. */
export function readLivePlayStudentName(): string {
	try {
		const raw = localStorage.getItem('user_info');
		if (!raw) {
			return '';
		}
		const parsed = JSON.parse(raw) as { name?: unknown };
		const name = typeof parsed?.name === 'string' ? parsed.name.trim() : '';
		return name;
	} catch {
		return '';
	}
}
