import ProtectedRoute from 'components/protoctedRoutes';
import Layout from 'layout';
import { lazy, Suspense } from 'react';
import { Navigate, Outlet, useRoutes } from 'react-router-dom';
import { useRoutesConst } from 'routes';
import AdminPortalHandoff from 'views/auth/AdminPortalHandoff';
import Error from 'views/error';
import Home from 'views/home';
import Landing from 'views/landing';
import LoadingPartially from 'components/loading-partially';
import GameBareLayout from 'views/games/components/GameBareLayout';

const GamesList = lazy(() => import('views/games/List'));
const GameLobby = lazy(() => import('views/games/Lobby'));
const ClassicQuestion = lazy(() => import('views/games/Classic/Question'));
const HackingChoosePassword = lazy(() => import('views/games/Hacking/ChoosePassword'));
const GoldQuestChoosePassword = lazy(() => import('views/games/GoldQuest/ChoosePassword'));
const HackingQuestion = lazy(() => import('views/games/Hacking/Question'));
const GoldQuestQuestion = lazy(() => import('views/games/GoldQuest/Question'));
const HackScreen = lazy(() => import('views/games/Hacking/Hack'));
const HackingGifts = lazy(() => import('views/games/Hacking/Gifts'));
const GoldQuestGifts = lazy(() => import('views/games/GoldQuest/Gifts'));
const FactsScreen = lazy(() => import('views/games/Facts'));
const AnswerListScreen = lazy(() => import('views/games/AnswerList'));

const Routes = () => {
	const { ROUTES } = useRoutesConst();

	const routes = useRoutes([
		{
			path: '/',
			element: <Layout />,
			errorElement: <Error />,
			children: [
				{ path: 'welcome', element: <Landing /> },
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
							element: <Home />,
							children: [
								{ index: true, element: <Navigate to="/learn" replace /> },
								{
									path: 'games',
									element: (
										<Suspense fallback={<LoadingPartially />}>
											<GamesList />
										</Suspense>
									),
								},
								{
									path: 'games/:gameId/lobby',
									element: (
										<Suspense fallback={<LoadingPartially />}>
											<GameLobby />
										</Suspense>
									),
								},
								{
									path: 'learn',
									element: ROUTES.learn.component,
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
									],
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
						{
							element: <GameBareLayout />,
							children: [
								{ path: 'games/:gameId/play', element: <ClassicQuestion /> },
								{ path: 'games/:gameId/hacking/password', element: <HackingChoosePassword /> },
								{ path: 'games/:gameId/gold-quest/password', element: <GoldQuestChoosePassword /> },
								{ path: 'games/:gameId/hacking/play', element: <HackingQuestion /> },
								{ path: 'games/:gameId/gold-quest/play', element: <GoldQuestQuestion /> },
								{ path: 'games/:gameId/hacking', element: <HackScreen /> },
								{ path: 'games/:gameId/hacking/gifts', element: <HackingGifts /> },
								{ path: 'games/:gameId/gold-quest/gifts', element: <GoldQuestGifts /> },
								{ path: 'games/:gameId/facts', element: <FactsScreen /> },
								{ path: 'games/:gameId/answer-list', element: <AnswerListScreen /> },
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
