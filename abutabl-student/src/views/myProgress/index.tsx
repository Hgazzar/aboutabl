import { useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import LoadingPartially from 'components/loading-partially';
import {
	fetchStudentMyProgress,
	type MyProgressPayload,
} from 'lib/myProgressApi';
import { getApiErrorMessage } from 'lib/studentApiResponse';
import MyAchievementsSection from './MyAchievementsSection';
import MyBooksSection from './MyBooksSection';
import MyProgressAchievementsWidget from './MyProgressAchievementsWidget';
import MyProgressHero from './MyProgressHero';
import MyProgressLevelCard from './MyProgressLevelCard';
import MyProgressStatistics from './MyProgressStatistics';
import MyProgressStreakRail from './MyProgressStreakRail';
import MyProgressXpRankingWidget from './MyProgressXpRankingWidget';
import { AsideColumn, BoardCard, EmptyHint, ErrorBanner, MainColumn, Page } from './styles';

export default function MyProgressPage() {
	const { formatMessage } = useIntl();
	const [data, setData] = useState<MyProgressPayload | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [reloadKey, setReloadKey] = useState(0);
	const achievementsRef = useRef<HTMLElement | null>(null);

	useEffect(() => {
		const controller = new AbortController();
		setLoading(true);

		fetchStudentMyProgress(controller.signal)
			.then((payload) => {
				if (controller.signal.aborted) return;
				setData(payload);
				setError(null);
			})
			.catch((err) => {
				if (controller.signal.aborted) return;
				setData(null);
				setError(getApiErrorMessage(err, formatMessage({ id: 'my-progress-load-error' })));
			})
			.finally(() => {
				if (!controller.signal.aborted) {
					setLoading(false);
				}
			});

		return () => controller.abort();
	}, [formatMessage, reloadKey]);

	const retry = () => setReloadKey((k) => k + 1);

	const scrollToAchievements = () => {
		achievementsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	};

	if (loading && !data) {
		return (
			<Page>
				<MainColumn>
					<LoadingPartially />
				</MainColumn>
				<AsideColumn aria-hidden />
			</Page>
		);
	}

	if (!data) {
		return (
			<Page>
				<MainColumn>
					<EmptyHint>
						{error ?? formatMessage({ id: 'my-progress-load-error' })}
						{error ? (
							<>
								{' '}
								<button type="button" onClick={retry}>
									{formatMessage({ id: 'dashboard-retry' })}
								</button>
							</>
						) : null}
					</EmptyHint>
				</MainColumn>
				<AsideColumn aria-hidden />
			</Page>
		);
	}

	return (
		<Page>
			<MainColumn>
				{error ? (
					<ErrorBanner role="alert">
						<span>{error}</span>
						<button type="button" onClick={retry}>
							{formatMessage({ id: 'dashboard-retry' })}
						</button>
					</ErrorBanner>
				) : null}

				<MyProgressHero hero={data.hero} />

				<BoardCard>
					<MyProgressLevelCard hero={data.hero} />
					<MyProgressStatistics statistics={data.statistics} />
					<MyBooksSection books={data.books} />
					<section id="my-progress-achievements" ref={achievementsRef}>
						<MyAchievementsSection items={data.achievements} />
					</section>
				</BoardCard>
			</MainColumn>

			<AsideColumn>
				<MyProgressAchievementsWidget
					hero={data.hero}
					items={data.achievements}
					onViewAll={scrollToAchievements}
				/>
				<MyProgressStreakRail streak={data.streak} />
				<MyProgressXpRankingWidget ranking={data.xp_ranking} />
			</AsideColumn>
		</Page>
	);
}
