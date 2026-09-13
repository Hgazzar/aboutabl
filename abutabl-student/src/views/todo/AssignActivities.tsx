import { useCallback, useEffect, useState, type ReactNode } from 'react';
import Cookies from 'js-cookie';
import { useIntl } from 'react-intl';
import { useNavigate, useParams } from 'react-router-dom';
import LoadingPartially from 'components/loading-partially';
import { figmaDashboardAssetUrl, figmaMyProgressAssetUrl } from 'config/figmaAssets';
import {
	fetchAssignmentDetail,
	redoAssignActivity,
	redoAssignmentParent,
	submitAssignActivity,
	submitAssignmentParent,
	type AssignmentActivityRow,
	type AssignmentDetailPayload,
	type AssignmentLifecycleMode,
} from 'lib/assignmentDetailApi';
import { getApiErrorMessage } from 'lib/studentApiResponse';
import {
	activityActionLocked,
	activityIsComplete,
	assignmentHeaderDisplay,
	canShowActivityRedo,
	canShowAssignmentRedo,
	canShowAssignmentSubmit,
	formatDueLabel,
	formatSubmittedLabel,
	gradedXpDisplay,
	heroCopyKey,
	insertStudentNameAfterGreatWork,
	progressLabel,
	resolveDetailHeroMode,
	unavailableProductFeatures,
} from './assignmentDetailState';
import { isMyWorkLockedFromDetail } from './assignmentMyWorkState';
import {
	ASSIGNMENT_REDO_BUSY_ID,
	executeAssignmentRedo,
	shouldBlockAssignmentRedoClick,
} from './assignmentRedoWorkflow';
import AssignmentMaterialsPanel from './AssignmentMaterialsPanel';
import AssignmentMyWorkPanel from './AssignmentMyWorkPanel';
import AssignmentRubricPanel from './AssignmentRubricPanel';
import {
	ActionButton,
	AssignmentRedoButton,
	AssignmentRedoIcon,
	ActivityActions,
	ActivityLead,
	ActivityList,
	ActivityMeta,
	ActivityName,
	ActivityRedoIconButton,
	ActivityRow,
	ActivityStatus,
	ActivityTypeIcon,
	AssignTitle,
	BackLink,
	DetailCard,
	DetailHero,
	DetailMain,
	DetailPage,
	DuePill,
	ErrorText,
	FeedbackActivity,
	FeedbackCard,
	FeedbackList,
	FeedbackText,
	GradeBadgePill,
	GradedBadgeCluster,
	GradedBees,
	GradedTeacherAvatar,
	HeaderAssignmentLine,
	HeaderContextLine,
	HeroCopy,
	HeroGrid,
	HeroArtCluster,
	HeroIllustration,
	HeroMascot,
	HeroSpark,
	HeroSparkClip,
	HeroSubtitle,
	HeroSubtitleLine,
	HeroTitle,
	HeroTitleLine,
	MetricCard,
	MetricIcon,
	MetricLabel,
	MetricTextStack,
	MetricValueRow,
	MetricsPills,
	MetricsProgress,
	MetricsProgressLabel,
	MetricsRow,
	ProgressFill,
	ProgressTrack,
	ReviewBanner,
	WaitingReviewBees,
	WaitingReviewBird,
	WaitingReviewBubble,
	WaitingReviewBubbleWrap,
	WaitingReviewDecor,
	WaitingReviewDecorSlot,
	WaitingReviewMessageLabel,
	WaitingReviewMessageText,
	WaitingReviewScene,
	TeacherFeedbackHeading,
	TeacherFeedbackLead,
	TeacherFeedbackRow,
	SectionHint,
	SectionTitle,
	StatusMeta,
	UnderReviewIcon,
	UnderReviewStatus,
	TitleBlock,
	TitleMetaActionsRow,
	TitleMetaColumn,
	TitleRow,
} from './assignmentDetailStyles';

const STAR_ICON = figmaDashboardAssetUrl('star-6-1.svg');
const METRIC_CLOCK_ICON = figmaDashboardAssetUrl('todo-metric-clock.svg');
const ACTIVITY_ICON_BOOK = figmaDashboardAssetUrl('todo-activity-book.png');
const ACTIVITY_ICON_WORKSHEET = figmaDashboardAssetUrl('todo-activity-worksheet.png');
const ACTIVITY_ICON_QUIZ = figmaDashboardAssetUrl('todo-activity-quiz.png');
/** Same sun as `/progress` hero. */
const SPARK = figmaMyProgressAssetUrl('hero-spark.png');
/** Homework Hero mascot — superhero bird (provided asset). */
const MASCOT_HOMEWORK = figmaDashboardAssetUrl('todo-bird-hero.png');
/** Waiting on teacher — peeking masked bird (product asset). */
const MASCOT_WAITING = figmaDashboardAssetUrl('todo-bird-waiting.png');
/** Assignment Graded / Complete — peeking graduate bird (SVG from product asset). */
const MASCOT_GRADED = figmaDashboardAssetUrl('todo-bird-graded.svg');
const WAITING_BANNER_BIRD = figmaDashboardAssetUrl('todo-waiting-banner-bird.png');
const WAITING_BANNER_BEES = figmaDashboardAssetUrl('todo-waiting-banner-bees.png');
const WAITING_BANNER_DECOR = figmaDashboardAssetUrl('todo-waiting-banner-decor.png');
const GRADED_TEACHER_AVATAR = figmaDashboardAssetUrl('todo-graded-teacher-avatar.png');

function mascotForMode(mode: AssignmentLifecycleMode): string {
	if (mode === 'waiting_on_teacher') return MASCOT_WAITING;
	if (mode === 'assignment_graded') return MASCOT_GRADED;
	return MASCOT_HOMEWORK;
}

function activityTypeIcon(activityType: string): string {
	const t = activityType.trim().toLowerCase();
	if (t === 'book' || t === 'lesson' || t === 'scorm') return ACTIVITY_ICON_BOOK;
	if (t === 'quiz' || t === 'quizes') return ACTIVITY_ICON_QUIZ;
	if (t === 'worksheet') return ACTIVITY_ICON_WORKSHEET;
	return ACTIVITY_ICON_BOOK;
}

function activityTypeLabel(activityType: string): string {
	const t = activityType.trim();
	if (!t) return 'Activity';
	return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}

export default function TodoAssignActivities() {
	const { assignId } = useParams();
	const navigate = useNavigate();
	const { formatMessage, locale } = useIntl();
	const [loading, setLoading] = useState(true);
	const [submittingId, setSubmittingId] = useState<number | null>(null);
	const [data, setData] = useState<AssignmentDetailPayload | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [actionError, setActionError] = useState<string | null>(null);

	const load = useCallback(async () => {
		const id = Number(assignId);
		if (!Number.isFinite(id) || id <= 0) {
			setError(formatMessage({ id: 'assign-detail-load-error' }));
			setData(null);
			setLoading(false);
			return;
		}
		setLoading(true);
		setError(null);
		try {
			const payload = await fetchAssignmentDetail(id);
			setData(payload);
		} catch (err: unknown) {
			setError(getApiErrorMessage(err, formatMessage({ id: 'assign-detail-load-error' })));
			setData(null);
		} finally {
			setLoading(false);
		}
	}, [assignId, formatMessage]);

	useEffect(() => {
		void load();
	}, [load]);

	const openActivity = async (activity: AssignmentActivityRow) => {
		if (!data) return;
		if (activityActionLocked(data.lifecycle.mode, activity)) return;

		setActionError(null);
		const needsSubmit =
			activity.activity_type === 'worksheet' || activity.activity_type === 'ebook';

		if (needsSubmit) {
			setSubmittingId(activity.assign_activity_id);
			try {
				await submitAssignActivity(activity.assign_activity_id);
				await load();
			} catch (err: unknown) {
				setActionError(
					getApiErrorMessage(err, formatMessage({ id: 'assign-detail-submit-error' }))
				);
				if (activity.activity_type === 'worksheet') {
					setSubmittingId(null);
					return;
				}
			} finally {
				setSubmittingId(null);
			}
		}

		if (activity.activity_type !== 'worksheet' && activity.path) {
			navigate(activity.path);
		}
	};

	/** Final parent Assignment SUBMIT → Waiting On Teacher. */
	const submitAssignment = async () => {
		if (!data || !canShowAssignmentSubmit(data)) return;
		setActionError(null);
		setSubmittingId(-1);
		try {
			const next = await submitAssignmentParent(data.assign_id);
			setData(next);
		} catch (err: unknown) {
			setActionError(
				getApiErrorMessage(err, formatMessage({ id: 'assign-detail-submit-error' }))
			);
		} finally {
			setSubmittingId(null);
		}
	};

	/** Assignment-level REDO: submitted → active (backend enforces deadline). */
	const redoAssignment = async () => {
		if (
			!data ||
			shouldBlockAssignmentRedoClick({
				canShow: canShowAssignmentRedo(data),
				busyId: submittingId,
			})
		) {
			return;
		}
		setActionError(null);
		setSubmittingId(ASSIGNMENT_REDO_BUSY_ID);
		const result = await executeAssignmentRedo({
			assignId: data.assign_id,
			redo: redoAssignmentParent,
			refresh: fetchAssignmentDetail,
		});
		if (result.detail) {
			setData(result.detail);
		}
		if (!result.ok) {
			setActionError(
				getApiErrorMessage(
					result.error,
					formatMessage({ id: 'assign-detail-redo-error' })
				)
			);
		}
		setSubmittingId(null);
	};

	/** Activity-level REDO — one activity only; then open it. */
	const redoActivity = async (activity: AssignmentActivityRow) => {
		if (!data || !canShowActivityRedo(activity) || submittingId != null) return;
		setActionError(null);
		setSubmittingId(activity.assign_activity_id);
		try {
			const next = await redoAssignActivity(activity.assign_activity_id);
			setData(next);
			const refreshed = next.activities.find(
				(row) => row.assign_activity_id === activity.assign_activity_id
			);
			if (refreshed) {
				await openActivityAfterRedo(refreshed);
			}
		} catch (err: unknown) {
			setActionError(
				getApiErrorMessage(err, formatMessage({ id: 'assign-detail-activity-redo-error' }))
			);
		} finally {
			setSubmittingId(null);
		}
	};

	const openActivityAfterRedo = async (activity: AssignmentActivityRow) => {
		if (activity.activity_type === 'worksheet') {
			return;
		}
		if (activity.path) {
			navigate(activity.path);
		}
	};

	if (loading && !data) {
		return (
			<DetailPage>
				<DetailMain>
					<DetailCard>
						<LoadingPartially />
					</DetailCard>
				</DetailMain>
			</DetailPage>
		);
	}

	if (!data) {
		return (
			<DetailPage>
				<DetailMain>
					<DetailCard>
						<BackLink to="/todo">{formatMessage({ id: 'assign-detail-back' })}</BackLink>
						<ErrorText>{error ?? formatMessage({ id: 'assign-detail-load-error' })}</ErrorText>
					</DetailCard>
				</DetailMain>
			</DetailPage>
		);
	}

	const mode = resolveDetailHeroMode(data.lifecycle.mode);
	const hero = heroCopyKey(mode);
	const progress = progressLabel(data);
	const dueLabel = formatDueLabel(data.due_at, locale);
	const submittedLabel = formatSubmittedLabel(
		data.lifecycle.submitted_at ?? data.progress.last_submitted_at,
		locale
	);
	const waiting = mode === 'waiting_on_teacher';
	const graded = mode === 'assignment_graded';
	const header = assignmentHeaderDisplay(data);
	const showSubmit = header.showSubmit;
	const showAssignmentRedo = canShowAssignmentRedo(data);
	const grade = graded ? data.grade : null;
	const returnedLabel = formatSubmittedLabel(grade?.finalized_at ?? null, locale);
	const xpDisplay = gradedXpDisplay(grade);
	const pointsPossible =
		data.assignment_xp ??
		data.rubric?.points_possible ??
		grade?.possible_xp ??
		null;
	const badgeLabel = grade?.badge?.label ?? null;
	const studentName = Cookies.get('username')?.trim() || '';
	const assignmentFeedback = grade?.teacher_feedback ?? null;
	const gradedMessage = assignmentFeedback
		? insertStudentNameAfterGreatWork(assignmentFeedback, studentName)
		: studentName
			? formatMessage({ id: 'assign-detail-graded-banner' }, { name: studentName })
			: formatMessage(
					{ id: 'assign-detail-graded-banner' },
					{ name: '' }
				).replace(/\s*,/, '!');
	const teacherAvatarSrc = grade?.teacher_photo_url?.trim() || GRADED_TEACHER_AVATAR;
	const teacherAvatarAlt = grade?.teacher_name?.trim() || '';
	const mascotSrc = mascotForMode(mode);
	const showRubric = unavailableProductFeatures(data).showRubric;
	/** Homework hero bird stays clipped under the white card; waiting/graded peek overlays. */
	const underWhite = mode === 'homework_hero';
	const peekBird = waiting || graded;

	return (
		<DetailPage>
			<DetailMain $peekBird={peekBird}>
				<DetailHero $peekBird={peekBird} aria-label={formatMessage({ id: hero.titleId })}>
					<HeroGrid>
						<HeroCopy $waiting={peekBird} $nudgeY={graded ? 5 : 0}>
							{mode === 'homework_hero' ? (
								<>
									<HeroTitle>
										<HeroTitleLine>
											{formatMessage({ id: 'assign-detail-hero-active-line-1' })}
										</HeroTitleLine>
										<HeroTitleLine>
											{formatMessage({ id: 'assign-detail-hero-active-line-2' })}
										</HeroTitleLine>
									</HeroTitle>
									<HeroSubtitle>
										<HeroSubtitleLine>
											{formatMessage({ id: 'assign-detail-hero-active-subtitle-line-1' })}
										</HeroSubtitleLine>
										<HeroSubtitleLine>
											{formatMessage({ id: 'assign-detail-hero-active-subtitle-line-2' })}
										</HeroSubtitleLine>
									</HeroSubtitle>
								</>
							) : (
								<>
									<HeroTitle>{formatMessage({ id: hero.titleId })}</HeroTitle>
									<HeroSubtitle>{formatMessage({ id: hero.subtitleId })}</HeroSubtitle>
								</>
							)}
						</HeroCopy>
						{/* Sun clipped to teal hero + under white card (same as homework /assign/433). */}
						<HeroSparkClip aria-hidden>
							<HeroIllustration $underWhite>
								<HeroArtCluster
									$underWhite={underWhite}
									$nudgeY={graded ? -55 : 0}
								>
									<HeroSpark src={SPARK} alt="" decoding="async" />
								</HeroArtCluster>
							</HeroIllustration>
						</HeroSparkClip>
						{/* Bird peeks over card on waiting/graded; stays under card on homework. */}
						<HeroIllustration $underWhite={underWhite} aria-hidden>
							<HeroArtCluster
								$underWhite={underWhite}
								$nudgeY={graded ? -55 : 0}
							>
								<HeroMascot
									$underWhite={underWhite}
									src={mascotSrc}
									alt=""
									decoding="async"
								/>
							</HeroArtCluster>
						</HeroIllustration>
					</HeroGrid>
				</DetailHero>

				<DetailCard>
					<BackLink to="/todo">{formatMessage({ id: 'assign-detail-back' })}</BackLink>

					<TitleRow>
						<TitleBlock>
							{header.subjectName ? (
								<AssignTitle>
									{`${header.subjectName} ${formatMessage({
										id: 'assign-detail-header-homework',
									})}`}
								</AssignTitle>
							) : null}
							{header.assignmentTitle ? (
								<HeaderAssignmentLine>{header.assignmentTitle}</HeaderAssignmentLine>
							) : null}
							{header.contextLabel &&
							header.contextLabel !== header.assignmentTitle ? (
								<HeaderContextLine>{header.contextLabel}</HeaderContextLine>
							) : null}
							{waiting ? (
								<UnderReviewStatus>
									<UnderReviewIcon aria-hidden>
										<svg viewBox="0 0 16 16" fill="none" focusable="false">
											<circle
												cx="8"
												cy="8"
												r="6.25"
												stroke="currentColor"
												strokeWidth="1.4"
											/>
											<path
												d="M8 8V3.5M8 8H12.25"
												stroke="currentColor"
												strokeWidth="1.4"
												strokeLinecap="round"
											/>
										</svg>
									</UnderReviewIcon>
									{formatMessage({ id: 'assign-detail-under-review' })}
								</UnderReviewStatus>
							) : null}
							{graded ? (
								<UnderReviewStatus>
									{formatMessage({ id: 'assign-detail-status-graded' })}
								</UnderReviewStatus>
							) : null}
							{mode === 'homework_hero' && data.lifecycle.is_overdue ? (
								<StatusMeta>{formatMessage({ id: 'assign-detail-overdue' })}</StatusMeta>
							) : null}
						</TitleBlock>
						<TitleMetaColumn>
							{showSubmit ? (
								<ActionButton
									type="button"
									$large
									disabled={submittingId != null}
									onClick={() => void submitAssignment()}
								>
									{formatMessage({ id: 'assign-detail-submit-assignment' })}
								</ActionButton>
							) : null}
							{showAssignmentRedo || (waiting && submittedLabel) ? (
								<TitleMetaActionsRow>
									{waiting && submittedLabel ? (
										<StatusMeta>
											{data.lifecycle.is_late
												? formatMessage(
														{ id: 'assign-detail-submitted-late' },
														{ when: submittedLabel }
													)
												: formatMessage(
														{ id: 'assign-detail-submitted-at' },
														{ when: submittedLabel }
													)}
										</StatusMeta>
									) : null}
									{showAssignmentRedo ? (
										<AssignmentRedoButton
											type="button"
											disabled={submittingId != null}
											aria-busy={submittingId === ASSIGNMENT_REDO_BUSY_ID}
											onClick={() => void redoAssignment()}
										>
											<AssignmentRedoIcon aria-hidden>
												<svg viewBox="0 0 24 24" focusable="false">
													<path
														fill="currentColor"
														d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6a6 6 0 0 1-9.33 4.97l-1.46 1.46A8 8 0 0 0 20 13c0-4.42-3.58-8-8-8zm-6.09 3.54A7.95 7.95 0 0 0 4 13c0 2.39 1.05 4.53 2.71 6l1.42-1.42A5.98 5.98 0 0 1 6 13c0-1.18.34-2.28.93-3.21l-1.02-1.25z"
													/>
												</svg>
											</AssignmentRedoIcon>
											{formatMessage({ id: 'assign-detail-redo-assignment' })}
										</AssignmentRedoButton>
									) : null}
								</TitleMetaActionsRow>
							) : null}
							{graded && returnedLabel ? (
								<StatusMeta>
									{formatMessage(
										{ id: 'assign-detail-returned-at' },
										{ when: returnedLabel }
									)}
								</StatusMeta>
							) : null}
						</TitleMetaColumn>
					</TitleRow>

					{waiting || graded ? (
						<WaitingReviewScene>
							{graded ? (
								<TeacherFeedbackLead>
									<TeacherFeedbackHeading>
										{formatMessage({ id: 'assign-detail-assignment-feedback-title' })}
									</TeacherFeedbackHeading>
									<TeacherFeedbackRow>
										<GradedTeacherAvatar
											src={teacherAvatarSrc}
											alt={teacherAvatarAlt}
											decoding="async"
											onError={(event) => {
												const img = event.currentTarget;
												if (img.src !== GRADED_TEACHER_AVATAR) {
													img.src = GRADED_TEACHER_AVATAR;
												}
											}}
										/>
										<WaitingReviewBubbleWrap>
											<WaitingReviewBubble>
												<WaitingReviewMessageLabel>
													{formatMessage({ id: 'assign-detail-waiting-message-label' })}
												</WaitingReviewMessageLabel>
												<WaitingReviewMessageText>
													{gradedMessage}
												</WaitingReviewMessageText>
											</WaitingReviewBubble>
										</WaitingReviewBubbleWrap>
									</TeacherFeedbackRow>
								</TeacherFeedbackLead>
							) : (
								<>
									<WaitingReviewBird
										src={WAITING_BANNER_BIRD}
										alt=""
										aria-hidden
										decoding="async"
									/>
									<WaitingReviewBubbleWrap>
										<WaitingReviewBees
											src={WAITING_BANNER_BEES}
											alt=""
											aria-hidden
											decoding="async"
										/>
										<WaitingReviewBubble>
											<WaitingReviewMessageLabel>
												{formatMessage({ id: 'assign-detail-waiting-message-label' })}
											</WaitingReviewMessageLabel>
											<WaitingReviewMessageText>
												{formatMessage({ id: 'assign-detail-waiting-banner' })}
											</WaitingReviewMessageText>
										</WaitingReviewBubble>
									</WaitingReviewBubbleWrap>
								</>
							)}
							<WaitingReviewDecorSlot $alignEnd={graded}>
								{graded && badgeLabel ? (
									<GradedBadgeCluster>
										<GradedBees
											src={WAITING_BANNER_BEES}
											alt=""
											aria-hidden
											decoding="async"
										/>
										<GradeBadgePill>
											{badgeLabel}
											{badgeLabel.endsWith('!') ? '' : '!'}
										</GradeBadgePill>
										<WaitingReviewDecor
											src={WAITING_BANNER_DECOR}
											alt=""
											aria-hidden
											decoding="async"
										/>
									</GradedBadgeCluster>
								) : (
									<WaitingReviewDecor
										src={WAITING_BANNER_DECOR}
										alt=""
										aria-hidden
										decoding="async"
									/>
								)}
							</WaitingReviewDecorSlot>
						</WaitingReviewScene>
					) : null}

					{mode === 'homework_hero' && data.lifecycle.is_overdue ? (
						<ReviewBanner>
							<span>{formatMessage({ id: 'assign-detail-overdue-banner' })}</span>
						</ReviewBanner>
					) : null}

					{actionError ? <ErrorText>{actionError}</ErrorText> : null}

					<MetricsRow>
						<MetricsProgress>
							<MetricsProgressLabel>
								{formatMessage(
									{ id: 'assign-detail-progress' },
									{
										completed: progress.completed,
										total: progress.total,
										completedWord: (chunks: ReactNode) => <em>{chunks}</em>,
									}
								)}
							</MetricsProgressLabel>
							<ProgressTrack
								role="progressbar"
								aria-valuemin={0}
								aria-valuemax={100}
								aria-valuenow={progress.percent}
								aria-label={formatMessage(
									{ id: 'assign-detail-progress-plain' },
									{ completed: progress.completed, total: progress.total }
								)}
							>
								<ProgressFill $percent={progress.percent} />
							</ProgressTrack>
						</MetricsProgress>
						<MetricsPills>
							{pointsPossible != null ? (
								<MetricCard $solid>
									<MetricIcon src={STAR_ICON} alt="" aria-hidden decoding="async" />
									<MetricTextStack>
										<MetricLabel>
											{formatMessage({ id: 'assign-detail-metric-xp' })}
										</MetricLabel>
										<MetricValueRow>
											{formatMessage(
												{ id: 'assign-detail-xp-possible' },
												{ possible: pointsPossible }
											)}
										</MetricValueRow>
									</MetricTextStack>
								</MetricCard>
							) : xpDisplay ? (
								<MetricCard $solid>
									<MetricIcon src={STAR_ICON} alt="" aria-hidden decoding="async" />
									<MetricTextStack>
										<MetricLabel>
											{formatMessage({ id: 'assign-detail-metric-xp' })}
										</MetricLabel>
										<MetricValueRow>
											{xpDisplay.possible != null
												? formatMessage(
														{ id: 'assign-detail-xp-earned-of-possible' },
														{
															earned: xpDisplay.earned,
															possible: xpDisplay.possible,
														}
													)
												: formatMessage(
														{ id: 'assign-detail-xp-earned' },
														{ earned: xpDisplay.earned }
													)}
										</MetricValueRow>
									</MetricTextStack>
								</MetricCard>
							) : null}
							{dueLabel ? (
								<DuePill>
									<MetricIcon
										src={METRIC_CLOCK_ICON}
										alt=""
										aria-hidden
										decoding="async"
									/>
									<MetricTextStack>
										<MetricLabel>
											{formatMessage({ id: 'assign-detail-metric-due' })}
										</MetricLabel>
										<MetricValueRow>{dueLabel}</MetricValueRow>
									</MetricTextStack>
								</DuePill>
							) : null}
						</MetricsPills>
					</MetricsRow>

					{showRubric && data.rubric ? (
						<AssignmentRubricPanel rubric={data.rubric} />
					) : null}

					<SectionTitle $gapBefore>
						{formatMessage({ id: 'assign-detail-instructions-title' })}
					</SectionTitle>
					<SectionHint>{formatMessage({ id: 'assign-detail-instructions-hint' })}</SectionHint>

					<ActivityList>
						{data.activities.map((activity) => {
							const complete = activityIsComplete(activity);
							const locked = activityActionLocked(data.lifecycle.mode, activity);
							const showActivityRedo = canShowActivityRedo(activity);
							const typeLabel = activityTypeLabel(activity.activity_type);
							const rawTitle = activity.title?.trim() || '';
							const displayTitle =
								rawTitle.toLowerCase().startsWith(`${typeLabel.toLowerCase()}:`)
									? rawTitle
									: rawTitle
										? `${typeLabel}: ${rawTitle}`
										: typeLabel;
							return (
								<ActivityRow key={activity.assign_activity_id} $completed={complete}>
									<ActivityLead>
										<ActivityTypeIcon
											src={activityTypeIcon(activity.activity_type)}
											alt=""
											aria-hidden
											decoding="async"
										/>
										<ActivityMeta>
											<ActivityName>{displayTitle}</ActivityName>
										</ActivityMeta>
									</ActivityLead>
									<ActivityActions>
										{complete ? (
											<>
												<ActivityStatus>
													{formatMessage({ id: 'assign-detail-activity-completed' })}
												</ActivityStatus>
												{showActivityRedo ? (
													<ActivityRedoIconButton
														type="button"
														disabled={submittingId != null}
														onClick={() => void redoActivity(activity)}
														aria-label={formatMessage({
															id: 'assign-detail-activity-redo',
														})}
													>
														<svg viewBox="0 0 24 24" focusable="false" aria-hidden>
															<path
																fill="currentColor"
																d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6a6 6 0 0 1-9.33 4.97l-1.46 1.46A8 8 0 0 0 20 13c0-4.42-3.58-8-8-8zm-6.09 3.54A7.95 7.95 0 0 0 4 13c0 2.39 1.05 4.53 2.71 6l1.42-1.42A5.98 5.98 0 0 1 6 13c0-1.18.34-2.28.93-3.21l-1.02-1.25z"
															/>
														</svg>
													</ActivityRedoIconButton>
												) : null}
											</>
										) : (
											<ActionButton
												type="button"
												disabled={locked || submittingId != null}
												onClick={() => void openActivity(activity)}
											>
												{formatMessage({ id: 'assign-detail-start-activity' })}
											</ActionButton>
										)}
									</ActivityActions>
								</ActivityRow>
							);
						})}
					</ActivityList>

					<AssignmentMaterialsPanel items={data.materials} />

					<AssignmentMyWorkPanel
						assignId={data.assign_id}
						items={data.my_work}
						locked={isMyWorkLockedFromDetail(data)}
						onRefresh={load}
					/>

					{data.teacher_feedback_items.length > 0 ? (
						<>
							<SectionTitle>
								{formatMessage({ id: 'assign-detail-activity-feedback-title' })}
							</SectionTitle>
							<FeedbackList>
								{data.teacher_feedback_items.map((item) => (
									<FeedbackCard key={item.assign_activity_id}>
										<FeedbackActivity>
											{item.activity_type}: {item.activity_title}
										</FeedbackActivity>
										<FeedbackText>{item.teacher_feedback}</FeedbackText>
									</FeedbackCard>
								))}
							</FeedbackList>
						</>
					) : null}
				</DetailCard>
			</DetailMain>
		</DetailPage>
	);
}
