import ProtectedRoute from 'components/protoctedRoutes';
import Layout from 'layout';
import { lazy, Suspense } from 'react';
import { Navigate, Outlet, useRoutes } from 'react-router-dom';
import { useRoutesConst } from 'routes';
import AdminPortalHandoff from 'views/auth/AdminPortalHandoff';
import Error from 'views/error';
import Home from 'views/home';
import PublicHome from 'views/landing/PublicHome';
import LoadingPartially from 'components/loading-partially';

const LiveSessionJoinPage = lazy(() => import('views/liveCompetitions/LiveSessionJoinPage'));
const MyLiveGamesPage = lazy(() => import('views/liveCompetitions/MyLiveGamesPage'));
const TodoAssignActivities = lazy(() => import('views/todo/AssignActivities'));
const LeaderboardPage = lazy(() => import('views/leaderboard'));
const MyProgressPage = lazy(() => import('views/myProgress'));
const AvatarOnboarding = lazy(() => import('views/onboarding/avatar'));

const Routes = () => {
	const { ROUTES } = useRoutesConst();

	const routes = useRoutes([
		{
			path: '/',
			element: <Layout />,
			errorElement: <Error />,
			children: [
				{ index: true, element: <PublicHome /> },
				{ path: 'welcome', element: <Navigate to="/" replace /> },
				{
					path: 'login',
					element: ROUTES.authSections.component,
					children: [
						{ index: true, element: ROUTES.signIn.component },
						{
							path: 'handoff',
							element: <AdminPortalHandoff />,
						},
						{
							path: ROUTES.otpVerify.path,
							element: ROUTES.otpVerify.component,
						},
						{
							path: ROUTES.emailVerify.path,
							element: ROUTES.emailVerify.component,
						},
						{
							path: ROUTES.restPassword.path,
							element: ROUTES.restPassword.component,
						},
					],
				},
				{
					path: '',
					element: (
						<ProtectedRoute>
							<Outlet />
						</ProtectedRoute>
					),
					children: [
						{
							path: 'onboarding/avatar',
							element: (
								<Suspense fallback={<LoadingPartially />}>
									<AvatarOnboarding />
								</Suspense>
							),
						},
						{
							element: <Home />,
							children: [
								{
									/** Legacy Interactive Games list retired — send leftover links to Live Competitions. */
									path: 'games',
									element: <Navigate to="/live-games" replace />,
								},
								{
									path: 'games/*',
									element: <Navigate to="/live-games" replace />,
								},
								{
									path: 'live-games',
									element: (
										<Suspense fallback={<LoadingPartially />}>
											<MyLiveGamesPage />
										</Suspense>
									),
								},
								{
									path: 'live-games/sessions/:sessionId',
									element: (
										<Suspense fallback={<LoadingPartially />}>
											<LiveSessionJoinPage />
										</Suspense>
									),
								},
								{
									path: 'learn',
									element: ROUTES.learn.component,
								},
								{
									path: 'learn/books',
									element: ROUTES.learnBooks.component,
								},
								{
									path: 'learn/:id',
									element: ROUTES.learnDetails.component,
								},
								{
									path: ROUTES.todo.path,
									element: <Outlet />,
									children: [
										{
											index: true,
											element: ROUTES.todo.component,
										},
										{
											path: 'assign/:assignId',
											element: (
												<Suspense fallback={<LoadingPartially />}>
													<TodoAssignActivities />
												</Suspense>
											),
										},
									],
								},
								{
									path: 'leaderboard',
									element: (
										<Suspense fallback={<LoadingPartially />}>
											<LeaderboardPage />
										</Suspense>
									),
								},
								{
									path: 'progress',
									element: (
										<Suspense fallback={<LoadingPartially />}>
											<MyProgressPage />
										</Suspense>
									),
								},
								{
									path: ROUTES.profile.path,
									element: <Outlet />,
									children: [
										{
											index: true,
											element: ROUTES.profile.component,
										},
									],
								},
								{
									path: ROUTES.support.path,
									element: <Outlet />,
									children: [{ index: true, element: ROUTES.support.component }],
								},
							],
						},
					],
				},
				{
					path: 'learn/:id/quiz/:idQuiz',
					element: ROUTES.learnQuizDetails.component,
				},
				{
					path: 'learn/quiz/:idQuiz',
					element: ROUTES.learnQuiz.component,
				},
				{
					path: 'learn/:id/details/:idUnit',
					element: ROUTES.learnDetailsUnit.component,
				},
				{
					path: 'learn/:id/detailsGame/:idGame',
					element: ROUTES.learnDetailsGame.component,
				},
				{
					path: 'learn/quiz/:idQuiz/result/:score',
					element: ROUTES.learnQuizResult.component,
				},
			],
		},
	]);
	return routes;
};

export default Routes;
