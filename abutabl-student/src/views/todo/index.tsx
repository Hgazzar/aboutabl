import { useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LoadingPartially from 'components/loading-partially';
import MyAssignmentsWidget from 'views/dashboard/components/MyAssignmentsWidget';
import TopRankingWidget from 'views/dashboard/components/TopRankingWidget';
import LearningStreakWidget from 'views/dashboard/components/LearningStreakWidget';
import { useDashboardData } from 'views/dashboard/useDashboardData';
import MyProgressAchievementsWidget from 'views/myProgress/MyProgressAchievementsWidget';
import { fetchStudentAchievements } from 'views/profile/profileApi';
import type { ProfileAchievement } from 'views/profile/types';
import TodoHeroSection from './components/TodoHeroSection';
import {
	applyTodoTabToSearchParams,
	readTodoTabFromSearchParams,
} from './todoTabRoute';
import {
	DashboardAside,
	TodoAssignmentsShell,
	TodoBackLink,
	TodoEmptyHint,
	TodoErrorBanner,
	TodoMainColumn,
	TodoPageGrid,
} from './todoPageStyles';

export default function Todo() {
	const { formatMessage } = useIntl();
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const activeTab = readTodoTabFromSearchParams(searchParams);
	const { data, initialLoading, error, retry } = useDashboardData('week');
	const [achievements, setAchievements] = useState<ProfileAchievement[]>([]);

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
	}, []);

	const assignItems = useMemo(() => {
		if (!data) return [];
		return data.assignments.tabs[activeTab] ?? [];
	}, [data, activeTab]);

	const setActiveTab = (tab: typeof activeTab) => {
		setSearchParams(applyTodoTabToSearchParams(searchParams, tab), { replace: true });
	};

	const openAchievements = () => {
		navigate('/progress#my-progress-achievements');
	};

	if (initialLoading && !data) {
		return (
			<TodoPageGrid>
				<TodoMainColumn>
					<LoadingPartially />
				</TodoMainColumn>
				<DashboardAside aria-hidden />
			</TodoPageGrid>
		);
	}

	if (!data) {
		return (
			<TodoPageGrid>
				<TodoMainColumn>
					<TodoEmptyHint>
						{error ?? formatMessage({ id: 'dashboard-load-error' })}
						{error ? (
							<>
								{' '}
								<button type="button" onClick={retry}>
									{formatMessage({ id: 'dashboard-retry' })}
								</button>
							</>
						) : null}
					</TodoEmptyHint>
				</TodoMainColumn>
				<DashboardAside aria-hidden />
			</TodoPageGrid>
		);
	}

	return (
		<TodoPageGrid>
			<TodoMainColumn>
				{error ? (
					<TodoErrorBanner role="alert">
						<span>{error}</span>
						<button type="button" onClick={retry}>
							{formatMessage({ id: 'dashboard-retry' })}
						</button>
					</TodoErrorBanner>
				) : null}

				<TodoHeroSection />

				<TodoAssignmentsShell>
					<TodoBackLink to="/learn">
						{formatMessage({ id: 'todo-back-dashboard' })}
					</TodoBackLink>

					<MyAssignmentsWidget
						idPrefix="todo"
						embedded
						listMode="full"
						activeTab={activeTab}
						items={assignItems}
						onTabChange={setActiveTab}
						onActionComplete={retry}
					/>
				</TodoAssignmentsShell>
			</TodoMainColumn>

			<DashboardAside>
				<MyProgressAchievementsWidget
					hero={{
						level: data.xp.level,
						level_badge_label: data.xp.level_badge_label,
					}}
					items={achievements}
					onViewAll={openAchievements}
				/>
				<TopRankingWidget rankings={data.rankings} />
				<LearningStreakWidget streak={data.streak} />
			</DashboardAside>
		</TodoPageGrid>
	);
}
