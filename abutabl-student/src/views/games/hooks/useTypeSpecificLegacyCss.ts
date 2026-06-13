import { useEffect } from 'react';

const ATTR = 'data-game-type-css';

/**
 * After base sheets from `GameBareLayout`, load hack.css or gold_quest.css for
 * `/facts` and `/answer-list` once `gameType` is known (matches Blade conditionals).
 */
export function useTypeSpecificLegacyCss(gameType?: string | null) {
	useEffect(() => {
		if (!gameType || gameType === 'classic') return;
		const name = gameType === 'hacking' ? 'hack.css' : gameType === 'gold_quest' ? 'gold_quest.css' : null;
		if (!name) return;
		const sel = `link[${ATTR}="${name}"]`;
		if (document.querySelector(sel)) return;
		const link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = `/assets/games/css/${name}`;
		link.setAttribute(ATTR, name);
		document.head.appendChild(link);
		return () => {
			document.querySelector(sel)?.remove();
		};
	}, [gameType]);
}
