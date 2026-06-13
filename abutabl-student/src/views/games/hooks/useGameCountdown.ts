import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

function parseTimeToSeconds(time?: string | null): number {
	if (!time) return 300;
	const parts = String(time).split(':');
	const m = parseInt(parts[0] || '5', 10);
	const s = parseInt(parts[1] || '0', 10);
	return Math.max(1, m * 60 + s);
}

export function countdownStorageKey(gameId: string | undefined) {
	return gameId ? `interactive_game_countdown_end_${gameId}` : 'interactive_game_countdown_end';
}

/**
 * Persists wall-clock end time in localStorage (per game) so refresh keeps countdown.
 */
export function useGameCountdown(gameId: string | undefined, timeField: string | undefined, onExpire?: () => void) {
	const totalSeconds = useMemo(() => parseTimeToSeconds(timeField), [timeField]);
	const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
	const onExpireRef = useRef(onExpire);
	const firedRef = useRef(false);
	onExpireRef.current = onExpire;

	const bootstrap = useCallback(() => {
		firedRef.current = false;
		if (!gameId) {
			setSecondsLeft(totalSeconds);
			return;
		}
		const key = countdownStorageKey(gameId);
		const now = Date.now();
		let end = localStorage.getItem(key);
		let endMs: number;
		if (!end) {
			endMs = now + totalSeconds * 1000;
			localStorage.setItem(key, String(endMs));
		} else {
			endMs = parseInt(end, 10);
		}
		const remain = Math.ceil((endMs - now) / 1000);
		setSecondsLeft(remain > 0 ? remain : 0);
	}, [gameId, totalSeconds]);

	useEffect(() => {
		bootstrap();
	}, [bootstrap]);

	useEffect(() => {
		const id = window.setInterval(() => {
			if (!gameId) {
				setSecondsLeft((s) => {
					const n = s - 1;
					if (n <= 0) {
						if (!firedRef.current) {
							firedRef.current = true;
							onExpireRef.current?.();
						}
						return 0;
					}
					return n;
				});
				return;
			}
			const key = countdownStorageKey(gameId);
			const endMs = parseInt(localStorage.getItem(key) || '0', 10);
			if (!endMs) return;
			const remain = Math.ceil((endMs - Date.now()) / 1000);
			if (remain <= 0) {
				setSecondsLeft(0);
				localStorage.removeItem(key);
				if (!firedRef.current) {
					firedRef.current = true;
					onExpireRef.current?.();
				}
			} else {
				setSecondsLeft(remain);
			}
		}, 1000);
		return () => clearInterval(id);
	}, [gameId, totalSeconds]);

	const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
	const ss = String(secondsLeft % 60).padStart(2, '0');

	const clearCountdown = useCallback(() => {
		if (gameId) localStorage.removeItem(countdownStorageKey(gameId));
	}, [gameId]);

	return { secondsLeft, mm, ss, clearCountdown, totalSeconds };
}
