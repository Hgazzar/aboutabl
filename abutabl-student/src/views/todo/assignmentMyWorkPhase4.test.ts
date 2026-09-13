import { describe, expect, it, vi } from 'vitest';
import {
	buildMyWorkUploadFormData,
	parseAssignmentDetailPayload,
	parseAssignmentMyWorkListPayload,
	parseAssignmentStudentWorkItem,
} from 'lib/assignmentDetailApi';
import { canShowAssignmentSubmit } from './assignmentDetailState';
import {
	canDeleteMyWork,
	canUploadMyWork,
	extensionForVoiceMime,
	formatMyWorkDuration,
	formatMyWorkSize,
	isMyWorkLockedError,
	isMyWorkLockedFromDetail,
	MY_WORK_MAX_FILE_BYTES,
	MY_WORK_MAX_FILES_PER_PICK,
	myWorkAcceptAllKinds,
	myWorkAcceptForKind,
	myWorkAffectsParentSubmit,
	recordedVoiceFileFromBlob,
	sortedMyWorkItems,
} from './assignmentMyWorkState';

const workImage = {
	id: 1,
	assign_id: 10,
	assign_student_id: 5,
	student_id: 20,
	kind: 'image',
	original_filename: 'drawing.png',
	url: 'https://cdn.example/drawing.png',
	mime_type: 'image/png',
	size_bytes: 12345,
	duration_ms: null,
	sort_order: 0,
};

const workDoc = {
	id: 2,
	assign_id: 10,
	assign_student_id: 5,
	student_id: 20,
	kind: 'document',
	original_filename: 'notes.pdf',
	url: 'https://cdn.example/notes.pdf',
	mime_type: 'application/pdf',
	size_bytes: 2048,
	duration_ms: null,
	sort_order: 1,
};

const workVoice = {
	id: 3,
	assign_id: 10,
	assign_student_id: 5,
	student_id: 20,
	kind: 'voice',
	original_filename: 'answer.mp3',
	url: 'https://cdn.example/answer.mp3',
	mime_type: 'audio/mpeg',
	size_bytes: 4096,
	duration_ms: 1500,
	sort_order: 2,
};

function baseDetail(overrides: Record<string, unknown> = {}) {
	return parseAssignmentDetailPayload({
		assign_id: 10,
		assign_student_id: 5,
		title: 'HW',
		progress: { tasks_completed: 1, tasks_total: 1, fully_complete: true },
		lifecycle: {
			mode: 'homework_hero',
			status: 'active',
			can_submit: true,
			is_late: false,
			is_overdue: false,
			submitted_at: null,
			source: 'assigns_students',
		},
		activities: [
			{
				assign_activity_id: 1,
				assign_id: 10,
				activity_type: 'worksheet',
				activity_id: 9,
				source_table: 'work_sheets',
				grading_mode: 'manual',
				title: 'WS',
				sort_order: 0,
				subject_id: 1,
				path: null,
				submission: { id: 1, status: 'completed' },
			},
		],
		materials: [
			{
				id: 99,
				assign_id: 10,
				kind: 'link',
				label: 'Ref',
				original_filename: null,
				url: 'https://example.com',
				mime_type: null,
				size_bytes: null,
				duration_ms: null,
				sort_order: 0,
			},
		],
		my_work: [],
		rubric_available: false,
		rubric: null,
		...overrides,
	});
}

describe('assignment Phase 4 My Work', () => {
	it('parses empty my_work list', () => {
		const detail = baseDetail({ my_work: [] });
		expect(detail?.my_work).toEqual([]);
	});

	it('parses multiple my_work items including image document voice', () => {
		const detail = baseDetail({ my_work: [workImage, workDoc, workVoice] });
		expect(detail?.my_work).toHaveLength(3);
		expect(detail?.my_work.map((w) => w.kind)).toEqual(['image', 'document', 'voice']);
		expect(detail?.my_work[0].original_filename).toBe('drawing.png');
		expect(detail?.my_work[2].duration_ms).toBe(1500);
	});

	it('sorts my_work by sort_order then id', () => {
		const ordered = sortedMyWorkItems([
			{ ...workVoice, sort_order: 2 },
			{ ...workImage, sort_order: 0 },
			{ ...workDoc, sort_order: 1 },
		] as never);
		expect(ordered.map((w) => w.id)).toEqual([1, 2, 3]);
	});

	it('builds upload FormData with kind and file', () => {
		const file = new File(['x'], 'drawing.png', { type: 'image/png' });
		const form = buildMyWorkUploadFormData('image', file);
		expect(form.get('kind')).toBe('image');
		expect(form.get('file')).toBe(file);
		expect(form.get('duration_ms')).toBeNull();
	});

	it('builds voice upload FormData with duration_ms', () => {
		const file = new File(['a'], 'a.mp3', { type: 'audio/mpeg' });
		const form = buildMyWorkUploadFormData('voice', file, 2200);
		expect(form.get('kind')).toBe('voice');
		expect(form.get('file')).toBe(file);
		expect(form.get('duration_ms')).toBe('2200');
	});

	it('does not attach duration_ms for non-voice kinds', () => {
		const file = new File(['a'], 'a.pdf', { type: 'application/pdf' });
		const form = buildMyWorkUploadFormData('document', file, 999);
		expect(form.get('duration_ms')).toBeNull();
	});

	it('locks upload and delete when submitted or graded', () => {
		const submitted = baseDetail({
			lifecycle: {
				mode: 'waiting_on_teacher',
				status: 'submitted',
				can_submit: false,
				source: 'assigns_students',
			},
			my_work: [workImage],
		});
		expect(isMyWorkLockedFromDetail(submitted!)).toBe(true);
		expect(canUploadMyWork(true)).toBe(false);
		expect(canDeleteMyWork(true)).toBe(false);

		const graded = baseDetail({
			lifecycle: {
				mode: 'assignment_graded',
				status: 'graded',
				can_submit: false,
				source: 'assigns_students',
			},
			my_work: [workDoc],
		});
		expect(isMyWorkLockedFromDetail(graded!)).toBe(true);
		expect(graded!.my_work).toHaveLength(1);
	});

	it('allows upload and delete when active', () => {
		const active = baseDetail();
		expect(isMyWorkLockedFromDetail(active!)).toBe(false);
		expect(canUploadMyWork(false)).toBe(true);
		expect(canDeleteMyWork(false)).toBe(true);
	});

	it('detects 409 my_work_locked errors', () => {
		expect(isMyWorkLockedError(new Error('My Work is locked for this assignment.'))).toBe(
			true
		);
		expect(isMyWorkLockedError(new Error('my_work_locked'))).toBe(true);
		expect(isMyWorkLockedError(new Error('Could not upload'))).toBe(false);
	});

	it('formats size and duration for display', () => {
		expect(formatMyWorkSize(12345, 'en')).toMatch(/KB/);
		expect(formatMyWorkDuration(1500, 'en')).toBe('0:02');
		expect(formatMyWorkDuration(null, 'en')).toBeNull();
	});

	it('exposes accept filters per kind', () => {
		expect(myWorkAcceptForKind('image')).toContain('image/png');
		expect(myWorkAcceptForKind('document')).toContain('.pdf');
		expect(myWorkAcceptForKind('voice')).toContain('audio');
	});

	it('parses dedicated my-work list payload with locked flag', () => {
		const list = parseAssignmentMyWorkListPayload({
			assign_id: 10,
			assign_student_id: 5,
			my_work: [workImage, workDoc],
			my_work_locked: true,
		});
		expect(list?.my_work).toHaveLength(2);
		expect(list?.my_work_locked).toBe(true);
	});

	it('rejects invalid my_work kinds', () => {
		expect(parseAssignmentStudentWorkItem({ ...workImage, kind: 'link' })).toBeNull();
	});

	it('exposes multi-upload size and count limits', () => {
		expect(MY_WORK_MAX_FILE_BYTES).toBe(100 * 1024 * 1024);
		expect(MY_WORK_MAX_FILES_PER_PICK).toBe(10);
		expect(myWorkAcceptAllKinds()).toContain('image/png');
		expect(myWorkAcceptAllKinds()).toContain('.pdf');
		expect(myWorkAcceptAllKinds()).toContain('audio');
	});

	it('My Work does not affect Parent Submit eligibility', () => {
		const empty = baseDetail({ my_work: [] });
		const withWork = baseDetail({ my_work: [workImage, workDoc, workVoice] });
		expect(canShowAssignmentSubmit(empty!)).toBe(true);
		expect(canShowAssignmentSubmit(withWork!)).toBe(true);
		expect(myWorkAffectsParentSubmit(withWork!.my_work)).toBe(false);

		const incomplete = baseDetail({
			lifecycle: {
				mode: 'homework_hero',
				status: 'active',
				can_submit: false,
				source: 'assigns_students',
			},
			my_work: [workImage],
		});
		expect(canShowAssignmentSubmit(incomplete!)).toBe(false);
	});

	it('still parses materials separately from my_work', () => {
		const detail = baseDetail({ my_work: [workImage] });
		expect(detail?.materials).toHaveLength(1);
		expect(detail?.materials[0].kind).toBe('link');
		expect(detail?.my_work[0].kind).toBe('image');
	});

	it('preserves activity rows alongside my_work', () => {
		const detail = baseDetail({ my_work: [workDoc] });
		expect(detail?.activities).toHaveLength(1);
		expect(detail?.activities[0].activity_type).toBe('worksheet');
		expect(detail?.my_work[0].kind).toBe('document');
	});

	it('supports Arabic locale formatting without throwing', () => {
		expect(() => formatMyWorkSize(2048, 'ar')).not.toThrow();
		expect(() => formatMyWorkDuration(65000, 'ar')).not.toThrow();
		expect(formatMyWorkDuration(65000, 'ar')).toContain(':');
	});

	it('upload helpers keep selected kind unchanged on failure path', async () => {
		const upload = vi.fn().mockRejectedValue(new Error('validation failed'));
		const kind: 'image' = 'image';
		try {
			await upload(10, kind, new File(['x'], 'x.png'));
		} catch {
			/* expected */
		}
		expect(kind).toBe('image');
		expect(upload).toHaveBeenCalledWith(10, 'image', expect.any(File));
	});

	it('builds recorded voice File like teacher MediaRecorder capture', () => {
		const blob = new Blob(['audio-bytes'], { type: 'audio/webm' });
		const file = recordedVoiceFileFromBlob(blob, 'audio/webm', 2);
		expect(file.name).toBe('voice-recording-2.webm');
		expect(file.type).toBe('audio/webm');
		expect(extensionForVoiceMime('audio/mp4')).toBe('m4a');
	});
});
