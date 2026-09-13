import { describe, expect, it } from 'vitest';
import {
	detectStudentWorkKindFromFile,
	isImageFile,
	isPdfFile,
	materialTypeLabelId,
	studentWorkVisualKind,
	teacherMaterialVisualKind,
} from './assignmentMaterialIcons';
import {
	assignmentAssetOpenMode,
	isSafeHttpUrl,
	resolveAssignmentAssetUrl,
} from './assignmentWorkAssetUrl';

describe('assignmentMaterialIcons', () => {
	it('maps teacher link/file/voice kinds to visual kinds', () => {
		expect(teacherMaterialVisualKind('link', null, null)).toBe('link');
		expect(teacherMaterialVisualKind('voice', 'audio/webm', 'a.webm')).toBe('voice');
		expect(teacherMaterialVisualKind('file', 'application/pdf', 'guide.pdf')).toBe('pdf');
		expect(teacherMaterialVisualKind('file', 'image/png', 'pic.png')).toBe('image');
		expect(teacherMaterialVisualKind('file', 'application/msword', 'a.doc')).toBe(
			'document'
		);
	});

	it('maps student work kinds to visual kinds', () => {
		expect(studentWorkVisualKind('image', 'image/jpeg', 'a.jpg')).toBe('image');
		expect(studentWorkVisualKind('voice', 'audio/mpeg', 'a.mp3')).toBe('voice');
		expect(studentWorkVisualKind('document', 'application/pdf', 'a.pdf')).toBe('pdf');
		expect(studentWorkVisualKind('document', null, 'a.docx')).toBe('document');
	});

	it('detects upload kind from File mime/name', () => {
		expect(
			detectStudentWorkKindFromFile(new File(['x'], 'a.png', { type: 'image/png' }))
		).toBe('image');
		expect(
			detectStudentWorkKindFromFile(new File(['x'], 'a.webm', { type: 'audio/webm' }))
		).toBe('voice');
		expect(
			detectStudentWorkKindFromFile(
				new File(['x'], 'a.docx', {
					type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
				})
			)
		).toBe('document');
	});

	it('detects pdf/image helpers', () => {
		expect(isPdfFile('application/pdf', null)).toBe(true);
		expect(isPdfFile(null, 'x.PDF')).toBe(true);
		expect(isImageFile('image/webp', null)).toBe(true);
		expect(isImageFile(null, 'shot.jpeg')).toBe(true);
	});

	it('returns i18n label ids for visual kinds', () => {
		expect(materialTypeLabelId('pdf')).toBe('assign-detail-materials-type-pdf');
		expect(materialTypeLabelId('link')).toBe('assign-detail-materials-type-link');
		expect(materialTypeLabelId('image')).toBe('assign-detail-materials-type-image');
		expect(materialTypeLabelId('document')).toBe('assign-detail-materials-type-document');
		expect(materialTypeLabelId('voice')).toBe('assign-detail-materials-type-voice');
	});
});

describe('assignmentWorkAssetUrl', () => {
	it('passes through absolute http(s) urls', () => {
		expect(resolveAssignmentAssetUrl('https://cdn.example/a.pdf')).toBe(
			'https://cdn.example/a.pdf'
		);
		expect(isSafeHttpUrl('https://cdn.example/a.pdf')).toBe(true);
	});

	it('rejects javascript and empty urls', () => {
		expect(isSafeHttpUrl('javascript:alert(1)')).toBe(false);
		expect(isSafeHttpUrl(null)).toBe(false);
		expect(isSafeHttpUrl('')).toBe(false);
	});

	it('resolves relative /storage paths to an absolute url', () => {
		const resolved = resolveAssignmentAssetUrl('/storage/assignments/1/materials/a.pdf');
		expect(resolved).toBe('/storage/assignments/1/materials/a.pdf');
		expect(isSafeHttpUrl(resolved)).toBe(true);
	});

	it('rewrites local Laravel storage URLs to same-origin /storage paths', () => {
		const resolved = resolveAssignmentAssetUrl(
			'http://127.0.0.1:8000/storage/assignments/1/work/a.jpeg'
		);
		expect(resolved).toBe('/storage/assignments/1/work/a.jpeg');
		expect(isSafeHttpUrl(resolved)).toBe(true);
	});

	it('picks the correct open mode per visual kind', () => {
		expect(assignmentAssetOpenMode('image')).toBe('preview-image');
		expect(assignmentAssetOpenMode('document')).toBe('download');
		expect(assignmentAssetOpenMode('pdf')).toBe('open-tab');
		expect(assignmentAssetOpenMode('link')).toBe('open-tab');
		expect(assignmentAssetOpenMode('voice')).toBe('none');
	});
});
