import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Button, Text } from '@mantine/core';
import { toStudentScormUrl } from 'utils/functions';
import {
	completeLessonContent,
	isBlockedCompletionType,
	isDocumentCompletionType,
	isMediaCompletionType,
	newClientEventId,
} from 'lib/lessonContentCompletion';

type Props = {
	item: {
		id: number | string;
		name?: string;
		type?: string;
		path?: string;
	};
};

/**
 * F-030 — Renders lesson content and emits trusted completion only:
 * - video/audio: media_ended or ≥95% threshold
 * - documents: explicit confirm after load
 * - scorm/scrom: never
 */
const LessonContentViewer: React.FC<Props> = ({ item }) => {
	const [viewerLoaded, setViewerLoaded] = useState(false);
	const [completed, setCompleted] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const submittedRef = useRef(false);
	const type = (item?.type || '').toLowerCase();
	const src = toStudentScormUrl(item?.path);

	useEffect(() => {
		setViewerLoaded(false);
		setCompleted(false);
		setSubmitting(false);
		setError(null);
		submittedRef.current = false;
	}, [item?.id, item?.type, item?.path]);

	const submit = useCallback(
		async (evidence: Parameters<typeof completeLessonContent>[1]) => {
			if (submittedRef.current || submitting || !item?.id) return;
			submittedRef.current = true;
			setSubmitting(true);
			setError(null);
			try {
				const result = await completeLessonContent(item.id, evidence);
				const data = result?.data ?? result;
				if (data?.content_completed || data?.content_already_completed) {
					setCompleted(true);
				}
			} catch (e: any) {
				submittedRef.current = false;
				setError(e?.response?.data?.msg || e?.message || 'Could not save completion');
			} finally {
				setSubmitting(false);
			}
		},
		[item?.id, submitting]
	);

	const submitMedia = useCallback(
		(kind: 'media_ended' | 'media_threshold', el: HTMLMediaElement) => {
			const durationMs = Math.round((el.duration || 0) * 1000);
			const positionMs = Math.round((el.currentTime || 0) * 1000);
			if (durationMs <= 0) return;
			void submit({
				kind,
				client_event_id: newClientEventId(),
				occurred_at: new Date().toISOString(),
				media: { duration_ms: durationMs, position_ms: positionMs },
			});
		},
		[submit]
	);

	const onMediaTimeUpdate = (el: HTMLMediaElement) => {
		if (submittedRef.current || !el.duration || el.duration <= 0) return;
		if (el.currentTime / el.duration >= 0.95) {
			submitMedia('media_threshold', el);
		}
	};

	const onConfirm = () => {
		if (!viewerLoaded) return;
		void submit({
			kind: 'explicit_confirm',
			client_event_id: newClientEventId(),
			occurred_at: new Date().toISOString(),
			viewer: { loaded: true },
		});
	};

	if (!item?.path) {
		return (
			<Box className="mt-48 flex justify-center items-center">
				<Text className="text-stone-500">No content available</Text>
			</Box>
		);
	}

	const status = (
		<Box className="mt-3 flex flex-col items-center gap-2">
			{completed ? (
				<Text className="text-LightSeaGreen text-sm font-semibold">Content marked complete</Text>
			) : null}
			{error ? <Text className="text-red-500 text-sm">{error}</Text> : null}
			{isDocumentCompletionType(type) && !isBlockedCompletionType(type) ? (
				<Button
					type="button"
					disabled={!viewerLoaded || submitting || completed}
					onClick={onConfirm}
					variant="filled"
					color="teal"
				>
					{submitting ? 'Saving…' : completed ? 'Completed' : 'Mark as finished'}
				</Button>
			) : null}
			{isBlockedCompletionType(type) ? (
				<Text className="text-stone-400 text-xs">SCORM completion is not recorded in this flow.</Text>
			) : null}
		</Box>
	);

	if (type === 'video') {
		return (
			<Box className="w-full flex flex-col items-center">
				<video
					key={String(item.id)}
					src={src}
					controls
					style={{ width: '100%', maxHeight: '90vh' }}
					onEnded={(e) => submitMedia('media_ended', e.currentTarget)}
					onTimeUpdate={(e) => onMediaTimeUpdate(e.currentTarget)}
				/>
				{status}
			</Box>
		);
	}

	if (type === 'audio') {
		return (
			<Box className="w-full flex flex-col items-center mt-24">
				<audio
					key={String(item.id)}
					src={src}
					controls
					style={{ width: '100%', maxWidth: 640 }}
					onEnded={(e) => submitMedia('media_ended', e.currentTarget)}
					onTimeUpdate={(e) => onMediaTimeUpdate(e.currentTarget)}
				/>
				{status}
			</Box>
		);
	}

	if (type === 'image') {
		return (
			<Box className="w-full flex flex-col items-center">
				<img
					src={src}
					alt={item?.name || 'lesson content'}
					style={{ maxWidth: '100%', maxHeight: '90vh', marginLeft: 'auto', marginRight: 'auto' }}
					onLoad={() => setViewerLoaded(true)}
				/>
				{status}
			</Box>
		);
	}

	if (type === 'word') {
		return (
			<Box className="w-full flex flex-col items-center">
				<iframe
					title="Word Viewer"
					allowFullScreen
					style={{ width: '100%', height: '90vh' }}
					scrolling="no"
					src={'https://view.officeapps.live.com/op/embed.aspx?src=' + encodeURIComponent(src)}
					onLoad={() => setViewerLoaded(true)}
				/>
				{status}
			</Box>
		);
	}

	// pdf, powerpoints, excel, scorm/scrom, unknown → iframe; confirm only for documents
	return (
		<Box className="w-full flex flex-col items-center">
			<iframe
				src={src}
				allowFullScreen
				style={{ width: '100%', height: '90vh' }}
				scrolling="no"
				title={item?.name || 'lesson content'}
				onLoad={() => {
					if (isDocumentCompletionType(type)) setViewerLoaded(true);
				}}
			/>
			{status}
		</Box>
	);
};

export default LessonContentViewer;
