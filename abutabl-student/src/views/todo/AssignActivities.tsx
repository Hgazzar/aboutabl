import { useCallback, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { useNavigate, useParams } from 'react-router-dom';
import LoadingPartially from 'components/loading-partially';
import { figmaDashboardAssetUrl } from 'config/figmaAssets';
import {
	fetchAssignmentDetail,
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
	canShowAssignmentSubmit,
	formatDueLabel,
	formatSubmittedLabel,
	gradedXpDisplay,
	heroCopyKey,
	progressLabel,
	resolveDetailHeroMode,
} from './assignmentDetailState';
import {
	ActionButton,
	ActivityList,
	ActivityMeta,
	ActivityName,
	ActivityRow,
	ActivityStatus,
	ActivityType,
	AssignTitle,
	AssignmentFeedbackCard,
	AssignmentFeedbackLabel,
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
	GradeBadgeStar,
	GradeScoreText,
	GradeXpPill,
	GradedShell,
	HeroCopy,
	HeroGrid,
	HeroIllustration,
	HeroMascot,
	HeroSpark,
	HeroSubtitle,
	HeroTitle,
	MetricCard,
	MetricIcon,
	MetricLabel,
	MetricValueRow,
	MetricsRow,
	ProgressFill,
	ProgressTrack,
	ReviewBanner,
	ReviewBannerMascot,
	SectionHint,
	SectionTitle,
	StatusMeta,
	StatusMetaMuted,
	TitleBlock,
	TitleMetaColumn,
	TitleRow,
} from './assignmentDetailStyles';

const STAR_ICON = figmaDashboardAssetUrl('star-6-1.svg');
const SPARK = figmaDashboardAssetUrl('leaderboard-spark.png');
/** Closest existing Figma bird assets — exact state mascots not in repo. */
const MASCOT_HOMEWORK = figmaDashboardAssetUrl('todo-bird-reading.svg');
const MASCOT_WAITING = figmaDashboardAssetUrl('bird-main.svg');
const MASCOT_GRADED = figmaDashboardAssetUrl('leaderboard-bird-trophy.png');
const MASCOT_BANNER = figmaDashboardAssetUrl('quests-popup-bird.png');

function mascotForMode(mode: AssignmentLifecycleMode): string {
	if (mode === 'waiting_on_teacher') return MASCOT_WAITING;
	if (mode === 'assignment_graded') return MASCOT_GRADED;
	return MASCOT_HOMEWORK;
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
	const showSubmit = canShowAssignmentSubmit(data);
	const grade = graded ? data.grade : null;
	const returnedLabel = formatSubmittedLabel(grade?.finalized_at ?? null, locale);
	const xpDisplay = gradedXpDisplay(grade);
	const badgeLabel = grade?.badge?.label ?? null;
	const assignmentFeedback = grade?.teacher_feedback ?? null;
	const mascotSrc = mascotForMode(mode);

	return (
		<DetailPage>
			<DetailMain>
				<DetailHero aria-label={formatMessage({ id: hero.titleId })}>
					<HeroGrid>
						<HeroCopy>
							<HeroTitle>{formatMessage({ id: hero.titleId })}</HeroTitle>
							<HeroSubtitle>{formatMessage({ id: hero.subtitleId })}</HeroSubtitle>
						</HeroCopy>
						<HeroIllustration aria-hidden>
							<HeroSpark src={SPARK} alt="" decoding="async" />
							<HeroMascot src={mascotSrc} alt="" decoding="async" />
						</HeroIllustration>
					</HeroGrid>
				</DetailHero>

				<DetailCard>
					<BackLink to="/todo">{formatMessage({ id: 'assign-detail-back' })}</BackLink>

					<TitleRow>
						<TitleBlock>
							<AssignTitle>{data.title}</AssignTitle>
							{graded ? (
								<StatusMeta>{formatMessage({ id: 'assign-detail-status-graded' })}</StatusMeta>
							) : null}
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
							{mode === 'homework_hero' && data.lifecycle.is_overdue ? (
								<StatusMeta>{formatMessage({ id: 'assign-detail-overdue' })}</StatusMeta>
							) : null}
						</TitleBlock>
						<TitleMetaColumn>
							{showSubmit ? (
								<ActionButton
									type="button"
									disabled={submittingId != null}
									onClick={() => void submitAssignment()}
								>
									{formatMessage({ id: 'assign-detail-submit-assignment' })}
								</ActionButton>
							) : null}
							{waiting ? (
								<StatusMetaMuted>
									{formatMessage({ id: 'assign-detail-under-review' })}
								</StatusMetaMuted>
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

					{waiting ? (
						<ReviewBanner>
							<ReviewBannerMascot src={MASCOT_BANNER} alt="" aria-hidden decoding="async" />
							<span>{formatMessage({ id: 'assign-detail-waiting-banner' })}</span>
						</ReviewBanner>
					) : null}

					{mode === 'homework_hero' && data.lifecycle.is_overdue ? (
						<ReviewBanner>
							<span>{formatMessage({ id: 'assign-detail-overdue-banner' })}</span>
						</ReviewBanner>
					) : null}

					{actionError ? <ErrorText>{actionError}</ErrorText> : null}

					{graded && grade ? (
						<GradedShell>
							{badgeLabel ? (
								<GradeBadgePill>
									{badgeLabel}
									{badgeLabel.endsWith('!') ? '' : '!'}
									<GradeBadgeStar src={STAR_ICON} alt="" aria-hidden decoding="async" />
								</GradeBadgePill>
							) : null}
							{grade.final_percent != null ? (
								<GradeScoreText>
									{formatMessage(
										{ id: 'assign-detail-final-percent' },
										{ percent: grade.final_percent }
									)}
								</GradeScoreText>
							) : null}
							{xpDisplay ? (
								<GradeXpPill>
									<MetricIcon src={STAR_ICON} alt="" aria-hidden decoding="async" />
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
								</GradeXpPill>
							) : null}
							{assignmentFeedback ? (
								<AssignmentFeedbackCard>
									<AssignmentFeedbackLabel>
										{formatMessage({ id: 'assign-detail-assignment-feedback-title' })}
									</AssignmentFeedbackLabel>
									<FeedbackText>{assignmentFeedback}</FeedbackText>
								</AssignmentFeedbackCard>
							) : null}
						</GradedShell>
					) : null}

					<MetricsRow>
						<MetricCard $wide>
							<MetricLabel>
								{formatMessage(
									{ id: 'assign-detail-progress' },
									{ completed: progress.completed, total: progress.total }
								)}
							</MetricLabel>
							<ProgressTrack
								role="progressbar"
								aria-valuemin={0}
								aria-valuemax={100}
								aria-valuenow={progress.percent}
								aria-label={formatMessage(
									{ id: 'assign-detail-progress' },
									{ completed: progress.completed, total: progress.total }
								)}
							>
								<ProgressFill $percent={progress.percent} />
							</ProgressTrack>
						</MetricCard>
						{xpDisplay ? (
							<MetricCard $solid>
								<MetricLabel>
									{formatMessage({ id: 'assign-detail-metric-xp' })}
								</MetricLabel>
								<MetricValueRow>
									<MetricIcon src={STAR_ICON} alt="" aria-hidden decoding="async" />
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
							</MetricCard>
						) : null}
						{dueLabel ? (
							<DuePill>
								<MetricLabel>
									{formatMessage({ id: 'assign-detail-metric-due' })}
								</MetricLabel>
								<span>{dueLabel}</span>
							</DuePill>
						) : null}
					</MetricsRow>

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

					<SectionTitle>{formatMessage({ id: 'assign-detail-instructions-title' })}</SectionTitle>
					<SectionHint>{formatMessage({ id: 'assign-detail-instructions-hint' })}</SectionHint>

					<ActivityList>
						{data.activities.map((activity) => {
							const complete = activityIsComplete(activity);
							const locked = activityActionLocked(data.lifecycle.mode, activity);
							const status = activity.submission?.status;
							return (
								<ActivityRow key={activity.assign_activity_id}>
									<ActivityMeta>
										<ActivityType>{activity.activity_type}</ActivityType>
										<ActivityName>{activity.title}</ActivityName>
										{complete ? (
											<ActivityStatus>
												{formatMessage({ id: 'assign-detail-activity-completed' })}
												{activity.submission?.percent != null
													? ` · ${activity.submission.percent}%`
													: ''}
											</ActivityStatus>
										) : status ? (
											<ActivityStatus>
												{formatMessage(
													{ id: 'assign-detail-activity-status' },
													{ status }
												)}
											</ActivityStatus>
										) : null}
									</ActivityMeta>
									{!complete ? (
										<ActionButton
											type="button"
											disabled={locked || submittingId === activity.assign_activity_id}
											onClick={() => void openActivity(activity)}
										>
											{activity.activity_type === 'worksheet'
												? formatMessage({ id: 'assign-detail-submit-activity' })
												: formatMessage({ id: 'assign-detail-start-activity' })}
										</ActionButton>
									) : null}
								</ActivityRow>
							);
						})}
					</ActivityList>

					{/* Materials / My Work / Rubric modal / Redo: deferred (Phase 4D–4F). */}
				</DetailCard>
			</DetailMain>
		</DetailPage>
	);
}
