/**
 * Curriculum Learn API path builders — enrollment-based (no assignment required).
 */

export function buildViewSubjectPath(
	id: string | number,
	focus?: { type?: string; type_id?: string | number }
): string {
	const params = new URLSearchParams();
	if (focus?.type != null && focus?.type_id != null && String(focus.type_id) !== '') {
		params.set('type', String(focus.type));
		params.set('type_id', String(focus.type_id));
	}
	const qs = params.toString();
	return `viewSubject/${id}${qs ? `?${qs}` : ''}`;
}

export function buildSubjectGamesPath(id: string | number): string {
	return `subjectGames/${id}`;
}

export function buildQuizesListPath(id: string | number): string {
	return `quizesList/${id}`;
}

export function buildLessonShowPath(id: string | number): string {
	return `/lessons/show/${id}`;
}

/** Continue Learning deep-link shape used by the student app. */
export function continueLearningContentPath(subjectId: string | number, contentId: string | number): string {
	return `/learn/${subjectId}/details/${contentId}`;
}
