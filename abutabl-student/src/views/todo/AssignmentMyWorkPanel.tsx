import { useCallback, useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import Modal from 'components/modal';
import {
	deleteAssignmentMyWork,
	fetchAssignmentMyWorkFileBlob,
	uploadAssignmentMyWork,
	type AssignmentStudentWorkItem,
} from 'lib/assignmentDetailApi';
import { getApiErrorMessage } from 'lib/studentApiResponse';
import {
	MATERIAL_MIC_ICON,
	MATERIAL_UPLOAD_ICON,
	detectStudentWorkKindFromFile,
	materialIconSrc,
	materialTypeLabelId,
	studentWorkVisualKind,
	type MaterialVisualKind,
} from './assignmentMaterialIcons';
import {
	assignmentAssetOpenMode,
	downloadBlobAsFile,
} from './assignmentWorkAssetUrl';
import {
	canDeleteMyWork,
	canUploadMyWork,
	isBrowserVoiceRecordingSupported,
	isMyWorkLockedError,
	MY_WORK_MAX_FILE_BYTES,
	MY_WORK_MAX_FILES_PER_PICK,
	myWorkAcceptAllKinds,
	pickMediaRecorderMimeType,
	recordedVoiceFileFromBlob,
	sortedMyWorkItems,
} from './assignmentMyWorkState';
import {
	ActionButton,
	ErrorText,
	MaterialsAudio,
	MaterialsCard,
	MaterialsCardButton,
	MaterialsCardDelete,
	MaterialsCardFooter,
	MaterialsCardGrid,
	MaterialsCardIcon,
	MaterialsCardName,
	MaterialsCardSurface,
	MaterialsCardTop,
	MaterialsCardType,
	MaterialsEmpty,
	MaterialsFileInput,
	MaterialsHeader,
	MaterialsHeaderAction,
	MaterialsHeaderActionIcon,
	MaterialsHeaderActions,
	MaterialsHeaderTitle,
	MaterialsImagePreviewFrame,
	MaterialsImagePreviewImg,
	MaterialsLockedBanner,
	MaterialsSection,
	MaterialsStatusText,
	MyWorkConfirmActions,
	MyWorkConfirmMessage,
	MyWorkGhostButton,
} from './assignmentDetailStyles';

type Props = {
	assignId: number;
	items: AssignmentStudentWorkItem[];
	locked: boolean;
	onRefresh: () => Promise<void>;
};

type ImagePreviewState = {
	url: string;
	name: string;
};

const UPLOAD_ACCEPT = myWorkAcceptAllKinds();

export default function AssignmentMyWorkPanel({
	assignId,
	items,
	locked,
	onRefresh,
}: Props) {
	const { formatMessage } = useIntl();
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const mediaStreamRef = useRef<MediaStream | null>(null);
	const voiceChunksRef = useRef<Blob[]>([]);
	const recordingStartedAtRef = useRef<number | null>(null);
	const previewObjectUrlRef = useRef<string | null>(null);

	const [uploading, setUploading] = useState(false);
	const [isRecording, setIsRecording] = useState(false);
	const [deletingId, setDeletingId] = useState<number | null>(null);
	const [openingId, setOpeningId] = useState<number | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [pendingDelete, setPendingDelete] = useState<AssignmentStudentWorkItem | null>(
		null
	);
	const [imagePreview, setImagePreview] = useState<ImagePreviewState | null>(null);
	const [voiceUrls, setVoiceUrls] = useState<Record<number, string>>({});

	const ordered = sortedMyWorkItems(items);
	const uploadEnabled =
		canUploadMyWork(locked) && !uploading && deletingId == null && !isRecording;
	const deleteEnabled = canDeleteMyWork(locked) && !uploading && !isRecording;

	const stopMediaTracks = useCallback(() => {
		mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
		mediaStreamRef.current = null;
	}, []);

	const stopVoiceRecording = useCallback(() => {
		const recorder = mediaRecorderRef.current;
		if (recorder && recorder.state !== 'inactive') {
			recorder.stop();
		} else {
			stopMediaTracks();
			setIsRecording(false);
			mediaRecorderRef.current = null;
			recordingStartedAtRef.current = null;
		}
	}, [stopMediaTracks]);

	useEffect(() => {
		return () => {
			const recorder = mediaRecorderRef.current;
			if (recorder && recorder.state !== 'inactive') {
				recorder.onstop = null;
				recorder.stop();
			}
			mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
			mediaRecorderRef.current = null;
			mediaStreamRef.current = null;
			voiceChunksRef.current = [];
		};
	}, []);

	/** Load voice via authenticated API → blob URL (public /storage often 404 when symlink broken). */
	useEffect(() => {
		const voiceItems = ordered.filter((item) => item.kind === 'voice');
		if (voiceItems.length === 0) {
			setVoiceUrls((prev) => {
				Object.values(prev).forEach((url) => URL.revokeObjectURL(url));
				return {};
			});
			return;
		}

		let cancelled = false;
		const created: string[] = [];
		const controller = new AbortController();

		void (async () => {
			const next: Record<number, string> = {};
			for (const item of voiceItems) {
				try {
					const blob = await fetchAssignmentMyWorkFileBlob(
						assignId,
						item.id,
						controller.signal
					);
					if (cancelled) return;
					const objectUrl = URL.createObjectURL(blob);
					created.push(objectUrl);
					next[item.id] = objectUrl;
				} catch {
					// Leave missing — player simply won't render src.
				}
			}
			if (!cancelled) {
				setVoiceUrls((prev) => {
					Object.values(prev).forEach((url) => URL.revokeObjectURL(url));
					return next;
				});
			}
		})();

		return () => {
			cancelled = true;
			controller.abort();
			created.forEach((url) => URL.revokeObjectURL(url));
		};
		// Re-fetch when work ids change.
		// eslint-disable-next-line react-hooks/exhaustive-deps -- intentional id signature
	}, [assignId, ordered.map((item) => `${item.id}:${item.kind}`).join('|')]);

	const closeImagePreview = () => {
		setImagePreview(null);
		if (previewObjectUrlRef.current) {
			URL.revokeObjectURL(previewObjectUrlRef.current);
			previewObjectUrlRef.current = null;
		}
	};

	const openItem = async (
		visual: MaterialVisualKind,
		item: AssignmentStudentWorkItem,
		displayName: string
	) => {
		const mode = assignmentAssetOpenMode(visual);
		if (mode === 'none') return;

		setError(null);
		setOpeningId(item.id);
		try {
			const blob = await fetchAssignmentMyWorkFileBlob(assignId, item.id);
			const objectUrl = URL.createObjectURL(blob);

			if (mode === 'preview-image') {
				if (previewObjectUrlRef.current) {
					URL.revokeObjectURL(previewObjectUrlRef.current);
				}
				previewObjectUrlRef.current = objectUrl;
				setImagePreview({ url: objectUrl, name: displayName });
				return;
			}

			if (mode === 'download') {
				downloadBlobAsFile(blob, item.original_filename || displayName);
				URL.revokeObjectURL(objectUrl);
				return;
			}

			// PDF — open blob in a new tab (actual PDF bytes, not empty storage 404 page).
			window.open(objectUrl, '_blank', 'noopener,noreferrer');
			window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
		} catch (err: unknown) {
			setError(
				getApiErrorMessage(err, formatMessage({ id: 'assign-detail-my-work-open-error' }))
			);
		} finally {
			setOpeningId(null);
		}
	};

	const uploadVoiceBlob = async (blob: Blob, mimeType: string, durationMs: number | null) => {
		const file = recordedVoiceFileFromBlob(blob, mimeType, ordered.length + 1);
		setUploading(true);
		try {
			await uploadAssignmentMyWork(assignId, 'voice', file, durationMs);
			await onRefresh();
		} catch (err: unknown) {
			setError(
				getApiErrorMessage(err, formatMessage({ id: 'assign-detail-my-work-upload-error' }))
			);
			if (isMyWorkLockedError(err)) {
				await onRefresh();
			}
		} finally {
			setUploading(false);
		}
	};

	const handleRecordVoice = async () => {
		if (!canUploadMyWork(locked) || uploading || deletingId != null) return;

		if (isRecording) {
			stopVoiceRecording();
			return;
		}

		if (!isBrowserVoiceRecordingSupported()) {
			setError(formatMessage({ id: 'assign-detail-my-work-voice-unsupported' }));
			return;
		}

		setError(null);

		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			mediaStreamRef.current = stream;
			voiceChunksRef.current = [];

			const mimeType = pickMediaRecorderMimeType();
			const recorder = mimeType
				? new MediaRecorder(stream, { mimeType })
				: new MediaRecorder(stream);

			recorder.ondataavailable = (event) => {
				if (event.data && event.data.size > 0) {
					voiceChunksRef.current.push(event.data);
				}
			};

			recorder.onstop = () => {
				const blobType = recorder.mimeType || mimeType || 'audio/webm';
				const blob = new Blob(voiceChunksRef.current, { type: blobType });
				voiceChunksRef.current = [];
				const startedAt = recordingStartedAtRef.current;
				recordingStartedAtRef.current = null;
				const durationMs =
					startedAt != null ? Math.max(1, Date.now() - startedAt) : null;

				stopMediaTracks();
				mediaRecorderRef.current = null;
				setIsRecording(false);

				if (blob.size === 0) {
					setError(formatMessage({ id: 'assign-detail-my-work-voice-empty' }));
					return;
				}

				void uploadVoiceBlob(blob, blobType, durationMs);
			};

			mediaRecorderRef.current = recorder;
			recordingStartedAtRef.current = Date.now();
			recorder.start();
			setIsRecording(true);
		} catch {
			stopMediaTracks();
			setIsRecording(false);
			mediaRecorderRef.current = null;
			recordingStartedAtRef.current = null;
			setError(formatMessage({ id: 'assign-detail-my-work-voice-permission' }));
		}
	};

	const onFileSelected = async (fileList: FileList | null) => {
		if (!fileList || fileList.length === 0 || !uploadEnabled) return;

		const picked = Array.from(fileList).slice(0, MY_WORK_MAX_FILES_PER_PICK);
		setError(null);
		setUploading(true);

		const failures: string[] = [];
		let uploaded = 0;

		try {
			for (const file of picked) {
				if (file.size > MY_WORK_MAX_FILE_BYTES) {
					failures.push(
						formatMessage(
							{ id: 'assign-detail-my-work-file-too-large' },
							{ name: file.name, maxMb: 100 }
						)
					);
					continue;
				}

				try {
					const kind = detectStudentWorkKindFromFile(file);
					let durationMs: number | null = null;
					if (kind === 'voice') {
						durationMs = await readAudioDurationMs(file);
					}
					await uploadAssignmentMyWork(assignId, kind, file, durationMs);
					uploaded += 1;
				} catch (err: unknown) {
					failures.push(
						getApiErrorMessage(
							err,
							formatMessage(
								{ id: 'assign-detail-my-work-file-upload-failed' },
								{ name: file.name }
							)
						)
					);
					if (isMyWorkLockedError(err)) {
						await onRefresh();
						break;
					}
				}
			}

			if (uploaded > 0) {
				await onRefresh();
			}

			if (failures.length > 0) {
				setError(failures.join(' · '));
			} else if (fileList.length > MY_WORK_MAX_FILES_PER_PICK) {
				setError(
					formatMessage(
						{ id: 'assign-detail-my-work-too-many-files' },
						{ max: MY_WORK_MAX_FILES_PER_PICK }
					)
				);
			}
		} finally {
			setUploading(false);
			if (fileInputRef.current) {
				fileInputRef.current.value = '';
			}
		}
	};

	const confirmDelete = async () => {
		if (!pendingDelete || !deleteEnabled) return;
		const workId = pendingDelete.id;
		setPendingDelete(null);
		setError(null);
		setDeletingId(workId);
		try {
			await deleteAssignmentMyWork(assignId, workId);
			await onRefresh();
		} catch (err: unknown) {
			setError(
				getApiErrorMessage(err, formatMessage({ id: 'assign-detail-my-work-delete-error' }))
			);
			if (isMyWorkLockedError(err)) {
				await onRefresh();
			}
		} finally {
			setDeletingId(null);
		}
	};

	return (
		<>
			<MaterialsSection aria-labelledby="assign-detail-my-work-heading">
				<MaterialsHeader>
					<MaterialsHeaderTitle id="assign-detail-my-work-heading">
						{formatMessage({ id: 'assign-detail-my-work-title' })}
					</MaterialsHeaderTitle>
					{!locked ? (
						<MaterialsHeaderActions>
							<MaterialsHeaderAction
								type="button"
								disabled={!uploadEnabled}
								onClick={() => fileInputRef.current?.click()}
							>
								<MaterialsHeaderActionIcon
									src={MATERIAL_UPLOAD_ICON}
									alt=""
									aria-hidden
									decoding="async"
								/>
								{formatMessage({ id: 'assign-detail-materials-upload' })}
							</MaterialsHeaderAction>
							<MaterialsHeaderAction
								type="button"
								disabled={uploading || deletingId != null}
								onClick={() => void handleRecordVoice()}
								aria-pressed={isRecording}
							>
								<MaterialsHeaderActionIcon
									src={MATERIAL_MIC_ICON}
									alt=""
									aria-hidden
									decoding="async"
								/>
								{isRecording
									? formatMessage({ id: 'assign-detail-my-work-stop-recording' })
									: formatMessage({ id: 'assign-detail-materials-record-voice' })}
							</MaterialsHeaderAction>
						</MaterialsHeaderActions>
					) : null}
				</MaterialsHeader>

				{locked ? (
					<MaterialsLockedBanner role="status">
						{formatMessage({ id: 'assign-detail-my-work-locked' })}
					</MaterialsLockedBanner>
				) : null}

				{error ? <ErrorText>{error}</ErrorText> : null}

				{isRecording ? (
					<MaterialsStatusText>
						{formatMessage({ id: 'assign-detail-my-work-recording-hint' })}
					</MaterialsStatusText>
				) : null}

				{uploading ? (
					<MaterialsStatusText>
						{formatMessage({ id: 'assign-detail-my-work-uploading' })}
					</MaterialsStatusText>
				) : null}

				{ordered.length === 0 ? (
					<MaterialsEmpty>
						{formatMessage({ id: 'assign-detail-my-work-empty' })}
					</MaterialsEmpty>
				) : (
					<MaterialsCardGrid>
						{ordered.map((item) => {
							const visual = studentWorkVisualKind(
								item.kind,
								item.mime_type,
								item.original_filename
							);
							const name =
								item.original_filename ||
								formatMessage({ id: materialTypeLabelId(visual) });
							const busy = deletingId === item.id || openingId === item.id;
							const openMode = assignmentAssetOpenMode(visual);
							const canOpen = openMode !== 'none';
							const voiceSrc = voiceUrls[item.id] || null;
							return (
								<MaterialsCard key={item.id}>
									<MaterialsCardSurface>
										<MaterialsCardButton
											type="button"
											disabled={(!canOpen && item.kind !== 'voice') || openingId != null}
											onClick={() => {
												if (canOpen) void openItem(visual, item, name);
											}}
										>
											<MaterialsCardIcon
												src={materialIconSrc(visual)}
												alt=""
												aria-hidden
												decoding="async"
											/>
											<MaterialsCardTop>
												<MaterialsCardType>
													{formatMessage({ id: materialTypeLabelId(visual) })}
												</MaterialsCardType>
												<MaterialsCardName title={name}>{name}</MaterialsCardName>
											</MaterialsCardTop>
										</MaterialsCardButton>
										{deleteEnabled ? (
											<MaterialsCardFooter>
												<MaterialsCardDelete
													type="button"
													disabled={busy || uploading || isRecording}
													onClick={() => setPendingDelete(item)}
												>
													{busy && deletingId === item.id
														? formatMessage({
																id: 'assign-detail-my-work-deleting',
															})
														: formatMessage({
																id: 'assign-detail-my-work-delete',
															})}
												</MaterialsCardDelete>
											</MaterialsCardFooter>
										) : null}
										{item.kind === 'voice' && voiceSrc ? (
											<MaterialsAudio
												controls
												preload="metadata"
												src={voiceSrc}
											>
												{formatMessage({ id: 'assign-detail-my-work-play' })}
											</MaterialsAudio>
										) : null}
									</MaterialsCardSurface>
								</MaterialsCard>
							);
						})}
					</MaterialsCardGrid>
				)}

				{!locked ? (
					<MaterialsFileInput
						ref={fileInputRef}
						type="file"
						multiple
						accept={UPLOAD_ACCEPT}
						disabled={!uploadEnabled}
						aria-label={formatMessage({ id: 'assign-detail-my-work-choose-file' })}
						onChange={(e) => void onFileSelected(e.target.files)}
					/>
				) : null}
			</MaterialsSection>

			<Modal
				opened={pendingDelete != null}
				onClose={() => setPendingDelete(null)}
				title={formatMessage({ id: 'assign-detail-my-work-delete-title' })}
				centered
			>
				<MyWorkConfirmMessage>
					{formatMessage({ id: 'assign-detail-my-work-delete-confirm' })}
				</MyWorkConfirmMessage>
				<MyWorkConfirmActions>
					<MyWorkGhostButton type="button" onClick={() => setPendingDelete(null)}>
						{formatMessage({ id: 'assign-detail-my-work-cancel' })}
					</MyWorkGhostButton>
					<ActionButton type="button" onClick={() => void confirmDelete()}>
						{formatMessage({ id: 'assign-detail-my-work-delete' })}
					</ActionButton>
				</MyWorkConfirmActions>
			</Modal>

			<Modal
				opened={imagePreview != null}
				onClose={closeImagePreview}
				title={
					imagePreview?.name ||
					formatMessage({ id: 'assign-detail-asset-image-preview-title' })
				}
				centered
				size="auto"
			>
				{imagePreview ? (
					<MaterialsImagePreviewFrame>
						<MaterialsImagePreviewImg
							src={imagePreview.url}
							alt={imagePreview.name}
						/>
					</MaterialsImagePreviewFrame>
				) : null}
			</Modal>
		</>
	);
}

function readAudioDurationMs(file: File): Promise<number | null> {
	return new Promise((resolve) => {
		try {
			const url = URL.createObjectURL(file);
			const audio = new Audio();
			const cleanup = () => {
				URL.revokeObjectURL(url);
				audio.removeAttribute('src');
			};
			audio.preload = 'metadata';
			audio.onloadedmetadata = () => {
				const seconds = audio.duration;
				cleanup();
				if (!Number.isFinite(seconds) || seconds <= 0) {
					resolve(null);
					return;
				}
				resolve(Math.round(seconds * 1000));
			};
			audio.onerror = () => {
				cleanup();
				resolve(null);
			};
			audio.src = url;
		} catch {
			resolve(null);
		}
	});
}
