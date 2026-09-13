import { useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import LoadingPartially from 'components/loading-partially';
import {
	STUDENT_WIDGET6_COLUMN_GAP,
	STUDENT_WIDGET6_ROW_WIDTH,
} from 'config/studentShellLayout';
import NewAssignmentsBanner from './components/NewAssignmentsBanner';
import HelloQuickActions from './components/HelloQuickActions';
import MyProgressWidget from './components/MyProgressWidget';
import MyAssignmentsWidget from './components/MyAssignmentsWidget';
import MyQuestsWidget from './components/MyQuestsWidget';
import RecommendedActivitiesWidget from './components/RecommendedActivitiesWidget';
import RecentActivitiesWidget from './components/RecentActivitiesWidget';
import YourQuestsWidget from './components/YourQuestsWidget';
import LearningStreakWidget from './components/LearningStreakWidget';
import TopRankingWidget from './components/TopRankingWidget';
import type { AssignTab } from './components/myAssignmentsUtils';
import { useDashboardData } from './useDashboardData';
import {
	DashboardAside,
	DashboardErrorBanner,
	DashboardMain,
	DashboardPage,
	EmptyHint,
	WidgetSixRow,
} from './styles';

export default function Dashboard() {
	const { formatMessage } = useIntl();
	const { data, initialLoading, error, retry } = useDashboardData('week');
	const [assignTab, setAssignTab] = useState<AssignTab>('todo');

	const assignItems = useMemo(() => {
		if (!data) return [];
		return data.assignments.tabs[assignTab] ?? [];
	}, [data, assignTab]);

	if (initialLoading && !data) {
		return (
			<DashboardPage>
				<DashboardMain>
					<LoadingPartially />
				</DashboardMain>
				<DashboardAside aria-hidden />
			</DashboardPage>
		);
	}

	if (!data) {
		return (
			<DashboardPage>
				<DashboardMain>
					<EmptyHint>
						{error ?? formatMessage({ id: 'dashboard-load-error' })}
						{error ? (
							<>
								{' '}
								<button type="button" onClick={retry}>
									{formatMessage({ id: 'dashboard-retry' })}
								</button>
							</>
						) : null}
					</EmptyHint>
				</DashboardMain>
				<DashboardAside aria-hidden />
			</DashboardPage>
		);
	}

	const {
		student,
		assignments,
		xp,
		rankings,
		streak,
		recommended_activities,
		recent_activities,
		quests,
	} = data;

	return (
		<DashboardPage>
			<DashboardMain>
				{error ? (
					<DashboardErrorBanner role="alert">
						<span>{error}</span>
						<button type="button" onClick={retry}>
							{formatMessage({ id: 'dashboard-retry' })}
						</button>
					</DashboardErrorBanner>
				) : null}

				<NewAssignmentsBanner newCount={assignments.new_count} />

				<HelloQuickActions
					studentName={student.name}
					photoUrl={student.photo_url}
					newAssignmentsCount={assignments.new_count}
				/>

				<MyProgressWidget xp={xp} classRank={rankings.class_rank} />

				<MyAssignmentsWidget
					activeTab={assignTab}
					items={assignItems}
					onTabChange={setAssignTab}
					onActionComplete={retry}
				/>

				<MyQuestsWidget quests={quests} />

				<WidgetSixRow $maxWidth={STUDENT_WIDGET6_ROW_WIDTH} $gap={STUDENT_WIDGET6_COLUMN_GAP}>
					<RecommendedActivitiesWidget payload={recommended_activities} />
					<RecentActivitiesWidget payload={recent_activities} streak={streak} />
				</WidgetSixRow>
			</DashboardMain>

			<DashboardAside>
				<YourQuestsWidget quests={quests} />

				<LearningStreakWidget streak={streak} />

				<TopRankingWidget rankings={rankings} />
			</DashboardAside>
		</DashboardPage>
	);
}
