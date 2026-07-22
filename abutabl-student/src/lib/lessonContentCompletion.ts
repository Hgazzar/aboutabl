import { postRequest } from 'lib/requests';

export type LessonContentCompletionKind =
	| 'media_ended'
	| 'media_threshold'
	| 'explicit_confirm';

export type LessonContentCompletionEvidence = {
	kind: LessonContentCompletionKind;
	client_event_id: string;
	occurred_at?: string;
	media?: { duration_ms: number; position_ms: number } | null;
	viewer?: { loaded: boolean } | null;
};

export const MEDIA_COMPLETION_TYPES = ['video', 'audio'] as const;
export const DOCUMENT_COMPLETION_TYPES = [
	'image',
	'pdf',
	'word',
	'powerpoints',
	'excel',
] as const;

export function isMediaCompletionType(type?: string | null): boolean {
	return MEDIA_COMPLETION_TYPES.includes((type || '') as any);
}

export function isDocumentCompletionType(type?: string | null): boolean {
	return DOCUMENT_COMPLETION_TYPES.includes((type || '') as any);
}

export function isBlockedCompletionType(type?: string | null): boolean {
	const t = (type || '').toLowerCase();
	return t === 'scorm' || t === 'scrom';
}

export function newClientEventId(): string {
	if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
		return crypto.randomUUID();
	}
	return `evt-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** F-030 — POST /api/student/lesson-contents/{contentId}/complete */
export async function completeLessonContent(
	contentId: number | string,
	evidence: LessonContentCompletionEvidence
) {
	return postRequest(`/lesson-contents/${contentId}/complete`, { evidence });
}
