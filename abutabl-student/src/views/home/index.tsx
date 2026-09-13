import SideBar from 'layout/side-bar';
import NavBar from 'layout/nav-bar';
import { LayoutWrapper, LayoutBody, ShellMain } from 'layout/styles';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Suspense } from 'react';
import LoadingPartially from 'components/loading-partially';
import SiteFooter from 'components/site-footer/SiteFooter';
import { studentNeedsAvatarSelection } from 'lib/studentAvatar';

export default function Home() {
	const { pathname } = useLocation();

	if (studentNeedsAvatarSelection()) {
		return <Navigate to="/onboarding/avatar" replace />;
	}

	const isDashboard = pathname === '/learn';
	const isTodo = pathname === '/todo' || pathname.startsWith('/todo/');
	const isBooks = pathname === '/learn/books';
	/** Subject Details `/learn/:id` — exclude books and nested viewer routes. */
	const isSubjectDetails =
		/^\/learn\/[^/]+$/.test(pathname) && pathname !== '/learn/books';
	const isLeaderboard = pathname === '/leaderboard' || pathname.startsWith('/leaderboard/');
	const isProgress = pathname === '/progress' || pathname.startsWith('/progress/');
	const isProfile = pathname === '/profile' || pathname.startsWith('/profile/');
	/** Green shell behind rail cards (no cream ShellMain strip). */
	const useDashboardShell =
		isDashboard || isTodo || isBooks || isSubjectDetails || isLeaderboard || isProgress;

	if (isProfile) {
		return (
			<LayoutWrapper>
				<Suspense fallback={<LoadingPartially />}>
					<Outlet />
				</Suspense>
				<SiteFooter variant="shell" />
			</LayoutWrapper>
		);
	}

	return (
		<LayoutWrapper>
			<NavBar />
			<LayoutBody $dashboard={useDashboardShell}>
				<SideBar />
				{useDashboardShell ? (
					<Suspense fallback={<LoadingPartially />}>
						<Outlet />
					</Suspense>
				) : (
					<ShellMain>
						<Suspense fallback={<LoadingPartially />}>
							<Outlet />
						</Suspense>
					</ShellMain>
				)}
			</LayoutBody>
			<SiteFooter variant="shell" />
		</LayoutWrapper>
	);
}
