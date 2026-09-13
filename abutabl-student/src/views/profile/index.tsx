import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { useSearchParams } from 'react-router-dom';
import LoadingPartially from 'components/loading-partially';
import { fetchStudentDashboard, type DashboardPayload } from 'lib/dashboardApi';
import { getApiErrorMessage } from 'lib/studentApiResponse';
import { writeDashboardSessionCache } from 'views/dashboard/dashboardSessionCache';
import ProfileEditSection from './components/ProfileEditSection';
import ProfileChangePasswordSection from './components/ProfileChangePasswordSection';
import Logout from './components/logout/Logout';
import ProfileHeader from './components/ProfileHeader';
import ProfileSidebar from './components/ProfileSidebar';
import CurrentLevelCard from './components/CurrentLevelCard';
import ProfileStatistics from './components/ProfileStatistics';
import AchievementsSection from './components/AchievementsSection';
import ProfileAssignmentsSection from './components/ProfileAssignmentsSection';
import {
	EmptyState,
	ProfileError,
	ProfileMain,
	ProfilePage,
	ProfileShell,
} from './components/profileLayout';
import { fetchStudentProfileIdentity, fetchStudentAchievements } from './profileApi';
import {
	applyProfilePanelToSearchParams,
	readProfilePanelFromSearchParams,
} from './profilePanelRoute';
import { profileStreakDays, type ProfileIdentity } from './profileUtils';
import type { ProfileAchievement, ProfilePanel } from './types';

export default function Profile() {
	const { formatMessage } = useIntl();
	const [searchParams, setSearchParams] = useSearchParams();
	const active = readProfilePanelFromSearchParams(searchParams);

	const setActive = (panel: ProfilePanel) => {
		setSearchParams(applyProfilePanelToSearchParams(searchParams, panel), { replace: true });
	};
	const [logoutModalOpened, setLogoutModalOpened] = useState(false);
	const [identity, setIdentity] = useState<ProfileIdentity | null>(null);
	const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
	const [achievements, setAchievements] = useState<ProfileAchievement[]>([]);
	const [achievementsLoading, setAchievementsLoading] = useState(true);
	const [achievementsError, setAchievementsError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;

		Promise.all([fetchStudentProfileIdentity(), fetchStudentDashboard('week')])
			.then(([nextIdentity, nextDashboard]) => {
				if (cancelled) return;
				setIdentity(nextIdentity);
				setDashboard(nextDashboard);
				setError(null);
			})
			.catch((err) => {
				if (cancelled) return;
				setError(getApiErrorMessage(err, formatMessage({ id: 'profile-load-error' })));
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		setAchievementsLoading(true);
		fetchStudentAchievements()
			.then((nextAchievements) => {
				if (cancelled) return;
				setAchievements(nextAchievements);
				setAchievementsError(null);
			})
			.catch((err) => {
				if (cancelled) return;
				setAchievements([]);
				setAchievementsError(
					getApiErrorMessage(err, formatMessage({ id: 'profile-achievements-error' }))
				);
			})
			.finally(() => {
				if (!cancelled) setAchievementsLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [formatMessage]);

	const refreshAssignments = () => {
		void fetchStudentDashboard('week')
			.then((nextDashboard) => {
				writeDashboardSessionCache(nextDashboard);
				setDashboard(nextDashboard);
				setError(null);
			})
			.catch((err) => {
				setError(getApiErrorMessage(err, formatMessage({ id: 'profile-load-error' })));
			});
	};

	if (loading && !identity && !dashboard) {
		return <LoadingPartially />;
	}

	return (
		<ProfilePage>
			<Logout
				logoutModalOpened={logoutModalOpened}
				setLogoutModalOpened={setLogoutModalOpened}
			/>

			<ProfileHeader />

			<ProfileShell>
				<ProfileSidebar
					identity={identity ?? { name: '', code: '', photo: null }}
					active={active}
					onSelectPanel={setActive}
					onLogout={() => setLogoutModalOpened(true)}
				/>

				<ProfileMain>
					{error && active !== 'edit' ? <ProfileError role="alert">{error}</ProfileError> : null}

					{active === 'assignments' ? (
						<ProfileAssignmentsSection
							assignments={dashboard?.assignments}
							loading={loading}
							error={error}
							onActionComplete={refreshAssignments}
						/>
					) : active === 'edit' ? (
						<ProfileEditSection
							identity={identity ?? { name: '', code: '', photo: null }}
							onIdentityUpdated={setIdentity}
							onDiscard={() => setActive('progress')}
						/>
					) : active === 'password' ? (
						<ProfileChangePasswordSection onDiscard={() => setActive('progress')} />
					) : (
						<>
							{dashboard ? (
								<>
									<CurrentLevelCard xp={dashboard.xp} />
									<ProfileStatistics
										totalXp={dashboard.xp.total_xp}
										classRank={dashboard.rankings.class_rank}
										streakDays={profileStreakDays(dashboard.streak)}
									/>
								</>
							) : (
								<EmptyState>{formatMessage({ id: 'profile-load-error' })}</EmptyState>
							)}
							<AchievementsSection
								items={achievements}
								loading={achievementsLoading}
								error={achievementsError}
							/>
						</>
					)}
				</ProfileMain>
			</ProfileShell>
		</ProfilePage>
	);
}
