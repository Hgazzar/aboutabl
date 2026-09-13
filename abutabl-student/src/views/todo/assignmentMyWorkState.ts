import type {
	AssignmentDetailPayload,
	AssignmentStudentWorkItem,
	AssignmentStudentWorkKind,
} from 'lib/assignmentDetailApi';

/** Parent lifecycle lock — same SSOT as backend my_work_locked. */
export function isMyWorkLockedFromDetail(
	detail: Pick<AssignmentDetailPayload, 'lifecycle'>
): boolean {
	const status = detail.lifecycle.status;
	return status === 'submitted' || status === 'graded';
}

export function canUploadMyWork(locked: boolean): boolean {
	return !locked;
}

export function canDeleteMyWork(locked: boolean): boolean {
	return !locked;
}

export function sortedMyWorkItems(
	items: AssignmentStudentWorkItem[]
): AssignmentStudentWorkItem[] {
	return [...items].sort((a, b) => {
		if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
		return a.id - b.id;
	});
}

export function myWorkAcceptForKind(kind: AssignmentStudentWorkKind): string {
	if (kind === 'image') return 'image/jpeg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp';
	if (kind === 'document') {
		return '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,application/pdf';
	}
	return 'audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/webm,audio/mp4,.mp3,.wav,.ogg,.webm,.m4a,.aac';
}

/** Matches StoreAssignmentStudentWorkRequest::MAX_FILE_KB (100MB). */
export const MY_WORK_MAX_FILE_BYTES = 100 * 1024 * 1024;

/** Soft cap per Upload click — each file still goes through the existing single-file API. */
export const MY_WORK_MAX_FILES_PER_PICK = 10;

export function myWorkAcceptAllKinds(): string {
	return [
		myWorkAcceptForKind('image'),
		myWorkAcceptForKind('document'),
		myWorkAcceptForKind('voice'),
	].join(',');
}

export function formatMyWorkSize(bytes: number | null, locale: string): string | null {
	if (bytes == null || !Number.isFinite(bytes) || bytes < 0) return null;
	const units = ['B', 'KB', 'MB', 'GB'];
	let value = bytes;
	let unit = 0;
	while (value >= 1024 && unit < units.length - 1) {
		value /= 1024;
		unit += 1;
	}
	const formatted = new Intl.NumberFormat(locale.startsWith('ar') ? 'ar' : 'en', {
		maximumFractionDigits: value >= 10 || unit === 0 ? 0 : 1,
	}).format(value);
	return `${formatted} ${units[unit]}`;
}

export function formatMyWorkDuration(
	durationMs: number | null,
	locale: string
): string | null {
	if (durationMs == null || !Number.isFinite(durationMs) || durationMs <= 0) {
		return null;
	}
	const totalSec = Math.round(durationMs / 1000);
	const minutes = Math.floor(totalSec / 60);
	const seconds = totalSec % 60;
	const pad = new Intl.NumberFormat(locale.startsWith('ar') ? 'ar' : 'en', {
		minimumIntegerDigits: 2,
	}).format(seconds);
	const minLabel = new Intl.NumberFormat(locale.startsWith('ar') ? 'ar' : 'en').format(
		minutes
	);
	return `${minLabel}:${pad}`;
}

/** Detect 409 my_work_locked from axios interceptor Error(message). */
export function isMyWorkLockedError(error: unknown): boolean {
	const msg =
		error instanceof Error
			? error.message
			: typeof error === 'string'
				? error
				: '';
	const normalized = msg.toLowerCase();
	return (
		normalized.includes('my_work_locked') ||
		normalized.includes('my work is locked') ||
		(normalized.includes('locked') && normalized.includes('work'))
	);
}

/**
 * My Work never affects Parent Submit — helper documents that invariant for tests.
 * Eligibility remains solely lifecycle.can_submit (+ mode/status gates).
 */
export function myWorkAffectsParentSubmit(_items: AssignmentStudentWorkItem[]): false {
	void _items;
	return false;
}

/** Same capability check as teacher assignment Materials voice record. */
export function isBrowserVoiceRecordingSupported(): boolean {
	return (
		typeof window !== 'undefined' &&
		typeof navigator !== 'undefined' &&
		!!navigator.mediaDevices?.getUserMedia &&
		typeof MediaRecorder !== 'undefined'
	);
}

export function pickMediaRecorderMimeType(): string {
	if (typeof MediaRecorder === 'undefined') return '';
	const preferred = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
	return preferred.find((type) => MediaRecorder.isTypeSupported(type)) || '';
}

export function extensionForVoiceMime(mimeType: string): string {
	return mimeType.includes('mp4') ? 'm4a' : 'webm';
}

/** Build a File suitable for POST my-work kind=voice (teacher-equivalent blob capture). */
export function recordedVoiceFileFromBlob(
	blob: Blob,
	mimeType: string,
	fileIndex = 1
): File {
	const type = mimeType || blob.type || 'audio/webm';
	const extension = extensionForVoiceMime(type);
	const name = `voice-recording-${fileIndex}.${extension}`;
	return new File([blob], name, { type });
}
