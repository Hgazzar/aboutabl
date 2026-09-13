import { figmaDashboardAssetUrl } from 'config/figmaAssets';
import type { AssignmentStudentWorkKind } from 'lib/assignmentDetailApi';

export type MaterialVisualKind = 'pdf' | 'link' | 'image' | 'document' | 'voice';

const ICON: Record<MaterialVisualKind, string> = {
	pdf: figmaDashboardAssetUrl('todo-material-pdf.png'),
	link: figmaDashboardAssetUrl('todo-material-link.png'),
	image: figmaDashboardAssetUrl('todo-material-image.png'),
	document: figmaDashboardAssetUrl('todo-material-document.png'),
	voice: figmaDashboardAssetUrl('todo-material-mic.png'),
};

export const MATERIAL_UPLOAD_ICON = figmaDashboardAssetUrl('todo-material-paperclip.png');
export const MATERIAL_MIC_ICON = figmaDashboardAssetUrl('todo-material-mic.png');

export function materialIconSrc(kind: MaterialVisualKind): string {
	return ICON[kind];
}

export function isPdfFile(mimeType: string | null, filename: string | null): boolean {
	const mime = (mimeType || '').toLowerCase();
	if (mime.includes('pdf')) return true;
	const name = (filename || '').toLowerCase();
	return name.endsWith('.pdf');
}

export function isImageFile(mimeType: string | null, filename: string | null): boolean {
	const mime = (mimeType || '').toLowerCase();
	if (mime.startsWith('image/')) return true;
	const name = (filename || '').toLowerCase();
	return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name);
}

/** Teacher material `kind` from API: file | voice | link (+ mime/filename for file subtypes). */
export function teacherMaterialVisualKind(
	kind: string,
	mimeType: string | null,
	filename: string | null
): MaterialVisualKind {
	const normalized = kind.trim().toLowerCase();
	if (normalized === 'link') return 'link';
	if (normalized === 'voice') return 'voice';
	if (isPdfFile(mimeType, filename)) return 'pdf';
	if (isImageFile(mimeType, filename)) return 'image';
	return 'document';
}

export function studentWorkVisualKind(
	kind: AssignmentStudentWorkKind,
	mimeType: string | null,
	filename: string | null
): MaterialVisualKind {
	if (kind === 'image') return 'image';
	if (kind === 'voice') return 'voice';
	if (isPdfFile(mimeType, filename)) return 'pdf';
	return 'document';
}

export function detectStudentWorkKindFromFile(file: File): AssignmentStudentWorkKind {
	const mime = (file.type || '').toLowerCase();
	if (mime.startsWith('image/') || isImageFile(mime, file.name)) return 'image';
	if (mime.startsWith('audio/')) return 'voice';
	return 'document';
}

export function materialTypeLabelId(visual: MaterialVisualKind): string {
	if (visual === 'pdf') return 'assign-detail-materials-type-pdf';
	if (visual === 'link') return 'assign-detail-materials-type-link';
	if (visual === 'image') return 'assign-detail-materials-type-image';
	if (visual === 'voice') return 'assign-detail-materials-type-voice';
	return 'assign-detail-materials-type-document';
}
