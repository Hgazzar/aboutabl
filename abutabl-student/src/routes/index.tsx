import { lazy, useMemo } from 'react';
import { useIntl } from 'react-intl';
import LearnIcon from 'assets/images/svg/book.svg?react';
import ProfileIcon from 'assets/images/svg/profile.svg?react';
import SupportIcon from 'assets/images/svg/messages.svg?react';
import TodoIcon from 'assets/images/svg/todo.svg?react';
import Result from 'views/learnDetails/components/detailsQuiz/quiz/result';

const AuthSections = lazy(() => import('views/auth'));
const Learn = lazy(() => import('views/learn'));
const LearnDetails = lazy(() => import('views/learnDetails'));
const DetailsUnit = lazy(() => import('views/learnDetails/components/detailsLesson'));
const Profile = lazy(() => import('views/profile'));
const Todo = lazy(() => import('views/todo'));
const Support = lazy(() => import('views/support'));
const Login = lazy(() => import('views/auth/signIn'));
const Verify = lazy(() => import('views/auth/otpVerify'));
const VerifyEmail = lazy(() => import('views/auth/emailVerify'));
const Reset = lazy(() => import('views/auth/resetPassword'));
const DetailsGames = lazy(() => import('views/learnDetails/components/detailsGame'));
const QuizDetails = lazy(() => import('views/learnDetails/components/detailsQuiz/start'));
const Quiz = lazy(() => import('views/learnDetails/components/detailsQuiz/quiz'));
const GamesList = lazy(() => import('views/games/List'));

export interface IRoute<T = any> {
	component: JSX.Element;
	path: string;
	icon?: JSX.Element;
	privileges: true;
	to: (props?: T) => string;
	fullTitle: (props?: T) => { name: string; link?: string }[];
	title: () => string;
	sidebarTitle?: () => string;
	subLinks?: string[];
}

export interface IRoutes {
	authSections: IRoute;
	signIn: IRoute;
	otpVerify: IRoute;
	emailVerify: IRoute;
	restPassword: IRoute;
	learn: IRoute;
	liveGames: IRoute;
	profile: IRoute;
	todo: IRoute;
	support: IRoute;
	learnDetails: IRoute;
	learnDetailsUnit: IRoute;
	learnDetailsGame: IRoute;
	learnQuizDetails: IRoute;
	learnQuiz: IRoute;
	learnQuizResult: IRoute;
}

export function useRoutesConst() {
	const { formatMessage } = useIntl();

	const ROUTES: IRoutes = useMemo(() => {
		const routes: IRoutes = {
			authSections: {
				component: <AuthSections />,
				path: 'login',
				privileges: true,
				to: () => '/login',
				fullTitle: () => [{ name: formatMessage({ id: 'login' }) }],
				title: () => formatMessage({ id: 'login' }),
				sidebarTitle: () => formatMessage({ id: 'login' }),
			},
			signIn: {
				component: <Login />,
				path: 'login',
				privileges: true,
				to: () => '/login',
				fullTitle: () => [{ name: formatMessage({ id: 'login' }) }],
				title: () => formatMessage({ id: 'login' }),
				sidebarTitle: () => formatMessage({ id: 'login' }),
			},
			otpVerify: {
				component: <Verify />,
				path: 'verify',
				privileges: true,
				to: () => '/login/verify',
				fullTitle: () => [{ name: formatMessage({ id: 'login' }) }],
				title: () => formatMessage({ id: 'login' }),
				sidebarTitle: () => formatMessage({ id: 'login' }),
			},
			emailVerify: {
				component: <VerifyEmail />,
				path: 'verifyEmail',
				privileges: true,
				to: () => '/login/verifyEmail',
				fullTitle: () => [{ name: formatMessage({ id: 'login' }) }],
				title: () => formatMessage({ id: 'login' }),
				sidebarTitle: () => formatMessage({ id: 'login' }),
			},
			restPassword: {
				component: <Reset />,
				path: 'reset-password',
				privileges: true,
				to: () => '/login/reset-password',
				fullTitle: () => [{ name: formatMessage({ id: 'login' }) }],
				title: () => formatMessage({ id: 'login' }),
				sidebarTitle: () => formatMessage({ id: 'login' }),
			},
			learn: {
				component: <Learn />,
				path: 'learn',
				icon: <LearnIcon />,
				privileges: true,
				to: () => '/learn',
				fullTitle: () => [{ name: formatMessage({ id: 'learn' }) }],
				title: () => formatMessage({ id: 'learn' }),
				sidebarTitle: () => formatMessage({ id: 'learn' }),
			},

			liveGames: {
				component: <GamesList />,
				path: 'games',
				icon: <LearnIcon />,
				privileges: true,
				to: () => '/games',
				fullTitle: () => [{ name: formatMessage({ id: 'liveGames' }) }],
				title: () => formatMessage({ id: 'liveGames' }),
				sidebarTitle: () => formatMessage({ id: 'liveGames' }),
			},

			learnDetails: {
				component: <LearnDetails />,
				path: 'learn/:id',
				icon: <LearnIcon />,
				privileges: true,
				to: () => 'learn/:id',
				fullTitle: () => [{ name: formatMessage({ id: 'learnDetails' }) }],
				title: () => formatMessage({ id: 'learnDetails' }),
				sidebarTitle: () => formatMessage({ id: 'learn' }),
			},
			learnDetailsUnit: {
				component: <DetailsUnit />,
				path: 'details/:idUnit/:id',
				icon: <LearnIcon />,
				privileges: true,

				to: () => 'details/:idUnit/:id',
				fullTitle: () => [{ name: formatMessage({ id: 'learnDetailsUnit' }) }],
				title: () => formatMessage({ id: 'learnDetailsUnit' }),
				sidebarTitle: () => formatMessage({ id: 'learn' }),
			},
			learnDetailsGame: {
				component: <DetailsGames />,
				path: 'learn/:id/detailsGame/:idGame',
				icon: <LearnIcon />,
				privileges: true,

				to: () => 'learn/:id/detailsGame/:idGames',
				fullTitle: () => [{ name: formatMessage({ id: 'learnDetailsGame' }) }],
				title: () => formatMessage({ id: 'learnDetailsGame' }),
				sidebarTitle: () => formatMessage({ id: 'learn' }),
			},

			learnQuizDetails: {
				component: <QuizDetails />,
				path: 'learn/:id/quiz/:idQuiz',
				icon: <LearnIcon />,
				privileges: true,
				to: () => 'learn/:id/quiz/:idQuiz',
				fullTitle: () => [{ name: formatMessage({ id: 'learnQuizDetails' }) }],
				title: () => formatMessage({ id: 'learnQuizDetails' }),
				sidebarTitle: () => formatMessage({ id: 'learn' }),
			},
			learnQuiz: {
				component: <Quiz />,
				path: 'learn/quiz/:idQuiz',
				icon: <LearnIcon />,
				privileges: true,
				to: () => 'learn/quiz/:idQuiz',
				fullTitle: () => [{ name: formatMessage({ id: 'learnQuiz' }) }],
				title: () => formatMessage({ id: 'learnQuiz' }),
				sidebarTitle: () => formatMessage({ id: 'learn' }),
			},
			learnQuizResult: {
				component: <Result />,
				path: 'learn/quiz/:idQuiz/result/:score',
				icon: <LearnIcon />,
				privileges: true,
				to: () => 'learn/quiz/:idQuiz/result',
				fullTitle: () => [{ name: formatMessage({ id: 'learnQuizResult' }) }],
				title: () => formatMessage({ id: 'learnQuizResult' }),
				sidebarTitle: () => formatMessage({ id: 'learn' }),
			},

			todo: {
				component: <Todo />,
				path: 'todo',
				icon: <TodoIcon />,
				privileges: true,
				to: () => '/todo',
				fullTitle: () => [{ name: formatMessage({ id: 'todo' }) }],
				title: () => formatMessage({ id: 'todo' }),
				sidebarTitle: () => formatMessage({ id: 'todo' }),
			},

			profile: {
				component: <Profile />,
				path: 'profile',
				icon: <ProfileIcon />,
				privileges: true,
				to: () => '/profile',
				fullTitle: () => [{ name: formatMessage({ id: 'profile' }) }],
				title: () => formatMessage({ id: 'profile' }),
				sidebarTitle: () => formatMessage({ id: 'profile' }),
			},
			support: {
				component: <Support />,
				path: 'support',
				icon: <SupportIcon />,
				privileges: true,
				to: () => '/support',
				fullTitle: () => [{ name: formatMessage({ id: 'support' }) }],
				title: () => formatMessage({ id: 'support' }),
				sidebarTitle: () => formatMessage({ id: 'support' }),
			},
		};
		return routes;
	}, [formatMessage]);

	return { ROUTES };
}
