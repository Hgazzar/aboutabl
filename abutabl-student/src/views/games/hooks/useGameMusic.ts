import { useCallback, useEffect, useRef, useState } from 'react';

const BGM_SRC = '/assets/games/112.mp3';

export function useGameMusic(enabled: boolean) {
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const [muted, setMuted] = useState(false);

	useEffect(() => {
		if (!enabled) return;
		const a = new Audio(BGM_SRC);
		a.loop = true;
		a.volume = 0.35;
		audioRef.current = a;
		a.play().catch(() => {
			/* autoplay blocked */
		});
		return () => {
			a.pause();
			audioRef.current = null;
		};
	}, [enabled]);

	useEffect(() => {
		const a = audioRef.current;
		if (!a) return;
		if (muted) a.pause();
		else a.play().catch(() => {});
	}, [muted]);

	const toggleMute = useCallback(() => {
		setMuted((m) => !m);
	}, []);

	return { muted, toggleMute };
}
