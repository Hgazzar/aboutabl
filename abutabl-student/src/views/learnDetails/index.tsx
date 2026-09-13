import { useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useSearchParams } from 'react-router-dom';
import LoadingPartially from 'components/loading-partially';
import {
	fetchStudentMyProgress,
	type MyProgressPayload,
} from 'lib/myProgressApi';
import { getApiErrorMessage } from 'lib/studentApiResponse';
import { gamesList } from 'redux-toolkit/reducer/GamesReducer';
import { SubjectDetails } from 'redux-toolkit/reducer/SubjectsReducer';
import { useDashboardData } from 'views/dashboard/useDashboardData';
import { fetchStudentAchievements } from 'views/profile/profileApi';
import type { ProfileAchievement } from 'views/profile/types';
import ActivityTimelineList from './bookDetails/ActivityTimelineList';
import BookDetailsSideRail from './bookDetails/BookDetailsSideRail';
import BookHeroBanner from './bookDetails/BookHeroBanner';
import {
	BOOK_DETAILS_BACK_PATH,
	buildUnitTimelineActivities,
	findBookProgress,
	normalizeUnits,
	parseViewSubjectPayload,
	resolveBookDetailsContinuePath,
	resolveInitialUnitId,
} from './bookDetails/bookDetailsModel';
import type { CurriculumGameItem } from './bookDetails/bookDetailsTypes';
import {
	BackLink,
	BookDetailsAside,
	BookDetailsMain,
	BookDetailsPage,
	EmptyHint,
	ErrorBanner,
	UnitHeaderBlock,
	UnitHeaderSub,
	UnitHeaderTitle,
} from './bookDetails/bookDetailsStyles';
import UnitTabSelector from './bookDetails/UnitTabSelector';

/**
 * kFrame-BookDetails — Subject Details at `/learn/:id`.
 * Data: viewSubject + my-progress (progress) + achievements + dashboard quests + subjectGames.
 * Destinations preserved: details/{contentId}, quiz/{id}, detailsGame/{id}, worksheet file_url.
 */
export default function LearnDetails() {
	const { formatMessage } = useIntl();
	const dispatch = useDispatch();
	const { id } = useParams();
	const [searchParams] = useSearchParams();
	const focusUnit = searchParams.get('focusUnit');
	const focusLesson = searchParams.get('focusLesson');

	const subjectDetailsState = useSelector((state: any) => state.SubjectsReducer);
	const gamesState = useSelector((state: any) => state.GamesReducer);

	const [subjectLoading, setSubjectLoading] = useState(true);
	const [subjectError, setSubjectError] = useState<string | null>(null);
	const [reloadKey, setReloadKey] = useState(0);

	const [progress, setProgress] = useState<MyProgressPayload | null>(null);
	const [achievements, setAchievements] = useState<ProfileAchievement[]>([]);
	const [activeUnitId, setActiveUnitId] = useState<number | null>(null);
	const [unitsExpanded, setUnitsExpanded] = useState(false);

	const {
		data: dashboard,
		error: dashboardError,
		retry: retryDashboard,
	} = useDashboardData('week');

	useEffect(() => {
		if (!id) return;
		let cancelled = false;
		(async () => {
			setSubjectLoading(true);
			setSubjectError(null);
			try {
				const args: { id: string; type?: string; type_id?: string | number } = { id };
				if (focusUnit) {
					args.type = 'units';
					args.type_id = focusUnit;
				} else if (focusLesson) {
					args.type = 'lessons';
					args.type_id = focusLesson;
				}
				await dispatch(SubjectDetails(args)).unwrap();
				await dispatch(gamesList({ id })).unwrap();
			} catch (err) {
				if (!cancelled) {
					setSubjectError(
						getApiErrorMessage(err, formatMessage({ id: 'book-details-load-error' }))
					);
				}
			} finally {
				if (!cancelled) setSubjectLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [dispatch, id, focusUnit, focusLesson, formatMessage, reloadKey]);

	useEffect(() => {
		const controller = new AbortController();
		fetchStudentMyProgress(controller.signal)
			.then((payload) => {
				if (!controller.signal.aborted) setProgress(payload);
			})
			.catch(() => {
				if (!controller.signal.aborted) setProgress(null);
			});
		return () => controller.abort();
	}, [reloadKey]);

	useEffect(() => {
		let cancelled = false;
		fetchStudentAchievements()
			.then((items) => {
				if (!cancelled) setAchievements(items);
			})
			.catch(() => {
				if (!cancelled) setAchievements([]);
			});
		return () => {
			cancelled = true;
		};
	}, [reloadKey]);

	const payload = parseViewSubjectPayload(subjectDetailsState?.subjectDetailsData);
	const units = useMemo(() => normalizeUnits(payload?.units), [payload]);

	useEffect(() => {
		setActiveUnitId(resolveInitialUnitId(units, focusUnit));
		setUnitsExpanded(false);
	}, [units, focusUnit, id]);

	const activeUnit = units.find((u) => u.id === activeUnitId) ?? units[0] ?? null;

	const games: CurriculumGameItem[] = useMemo(() => {
		const raw = gamesState?.gamesListData?.games;
		if (!Array.isArray(raw)) return [];
		return raw.map((g: { id: number; name: string; background?: string; progress?: number }) => ({
			id: Number(g.id),
			name: String(g.name ?? ''),
			background: g.background ?? null,
			progress: g.progress ?? null,
		}));
	}, [gamesState]);

	const worksheets = payload?.worksheetsSubject ?? [];

	const subjectIdNum = Number(id);
	const bookProgress = findBookProgress(progress?.books, subjectIdNum);

	const activities = useMemo(() => {
		if (!activeUnit || !Number.isFinite(subjectIdNum) || subjectIdNum <= 0) return [];
		return buildUnitTimelineActivities({
			subjectId: subjectIdNum,
			unit: activeUnit,
			worksheets,
			games,
		});
	}, [activeUnit, subjectIdNum, worksheets, games]);

	const firstContentHref =
		activities.find((a) => a.kind === 'lesson_content' && !a.external)?.href ?? null;

	const continuePath = resolveBookDetailsContinuePath({
		subjectId: subjectIdNum,
		continuePath: dashboard?.continue_learning?.path,
		continueSubjectId: dashboard?.continue_learning?.subject_id ?? null,
		nextGoalPath: bookProgress?.next_goal?.available
			? bookProgress.next_goal.cta_path
			: null,
		firstContentHref,
	});

	const retry = () => {
		setReloadKey((k) => k + 1);
		retryDashboard();
	};

	if (!id) {
		return (
			<BookDetailsPage>
				<BookDetailsMain>
					<EmptyHint>{formatMessage({ id: 'book-details-load-error' })}</EmptyHint>
				</BookDetailsMain>
			</BookDetailsPage>
		);
	}

	if (subjectLoading && !payload) {
		return (
			<BookDetailsPage>
				<BookDetailsMain>
					<LoadingPartially />
				</BookDetailsMain>
			</BookDetailsPage>
		);
	}

	if (!payload) {
		return (
			<BookDetailsPage data-testid="book-details-page">
				<BookDetailsMain>
					<BackLink to={BOOK_DETAILS_BACK_PATH}>
						{formatMessage({ id: 'book-details-back-books' })}
					</BackLink>
					<EmptyHint>
						{subjectError ?? formatMessage({ id: 'book-details-access-denied' })}
						{(subjectError || dashboardError) && (
							<>
								{' '}
								<button type="button" onClick={retry}>
									{formatMessage({ id: 'dashboard-retry' })}
								</button>
							</>
						)}
					</EmptyHint>
				</BookDetailsMain>
			</BookDetailsPage>
		);
	}

	const basic = payload.basic_info!;
	const photo =
		typeof basic.photo === 'string' && basic.photo.trim() ? basic.photo.trim() : null;
	const progressPercent =
		bookProgress?.progress_percent != null && Number.isFinite(bookProgress.progress_percent)
			? bookProgress.progress_percent
			: null;

	return (
		<BookDetailsPage data-testid="book-details-page">
			<BookDetailsMain>
				<BackLink to={BOOK_DETAILS_BACK_PATH}>
					{formatMessage({ id: 'book-details-back-books' })}
				</BackLink>

				{(subjectError || dashboardError) && (
					<ErrorBanner role="alert">
						<span>{subjectError || dashboardError}</span>
						<button type="button" onClick={retry}>
							{formatMessage({ id: 'dashboard-retry' })}
						</button>
					</ErrorBanner>
				)}

				<BookHeroBanner
					title={basic.name}
					photo={photo}
					activeUnitName={activeUnit?.name ?? null}
					progressPercent={progressPercent}
					continuePath={continuePath}
				/>

				{units.length === 0 ? (
					<EmptyHint>{formatMessage({ id: 'book-details-units-empty' })}</EmptyHint>
				) : (
					<>
						<UnitTabSelector
							units={units}
							activeUnitId={activeUnit?.id ?? null}
							onSelect={setActiveUnitId}
							expanded={unitsExpanded}
							onExpandOverflow={() => setUnitsExpanded(true)}
						/>

						<UnitHeaderBlock>
							<UnitHeaderTitle>{activeUnit?.name}</UnitHeaderTitle>
							{/* Unit % omitted — viewSubject has no canonical unit progress */}
							<UnitHeaderSub>
								{formatMessage({ id: 'book-details-unit-activities-hint' })}
							</UnitHeaderSub>
						</UnitHeaderBlock>

						<ActivityTimelineList activities={activities} />
					</>
				)}
			</BookDetailsMain>

			<BookDetailsAside>
				<BookDetailsSideRail
					bookTitle={basic.name}
					achievements={achievements}
					quests={dashboard?.quests}
				/>
			</BookDetailsAside>
		</BookDetailsPage>
	);
}
