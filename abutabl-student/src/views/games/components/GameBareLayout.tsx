import LoadingPartially from 'components/loading-partially';
import { Suspense, useEffect, useMemo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

const BASE = ['style.css', 'styleNew.css', 'normalize.css', 'all.min.css'];
const CSS_PREFIX = '/assets/games/css/';
const ATTR = 'data-legacy-game-css';

function legacySheetsForPath(pathname: string): string[] {
	if (pathname.includes('/facts') || pathname.includes('/answer-list')) {
		return [...BASE];
	}
	if (pathname.includes('/hacking/password') || pathname.includes('/gold-quest/password')) {
		return ['hack.css'];
	}
	const sheets = [...BASE];
	if (pathname.includes('/gold-quest')) {
		sheets.push('gold_quest.css');
	} else if (pathname.includes('/hacking')) {
		sheets.push('hack.css');
	}
	return sheets;
}

/**
 * Full-bleed game shell: no student sidebar / PageHeader. Injects legacy `game/` CSS
 * copied to `public/assets/games/css/`.
 */
export default function GameBareLayout() {
	const { pathname } = useLocation();
	const sheets = useMemo(() => legacySheetsForPath(pathname), [pathname]);

	useEffect(() => {
		const links = sheets.map((name) => {
			const link = document.createElement('link');
			link.rel = 'stylesheet';
			link.href = `${CSS_PREFIX}${name}`;
			link.setAttribute(ATTR, name);
			document.head.appendChild(link);
			return link;
		});
		return () => {
			links.forEach((l) => l.remove());
		};
	}, [sheets]);

	return (
		<Suspense fallback={<LoadingPartially />}>
			<Outlet />
		</Suspense>
	);
}
