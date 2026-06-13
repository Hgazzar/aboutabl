import { useEffect } from 'react';

export type GameBodyMode = 'mode-classic' | 'mode-hacking' | 'mode-gold-quest';

export function useBodyGameMode(mode: GameBodyMode | null) {
	useEffect(() => {
		if (!mode) return;
		document.body.classList.add(mode);
		return () => {
			document.body.classList.remove(mode);
		};
	}, [mode]);
}
