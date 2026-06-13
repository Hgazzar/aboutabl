import { useRef } from 'react';

type Props = {
	voiceUrl?: string | null;
	label: string;
};

export function VoiceButton({ voiceUrl, label }: Props) {
	const audioRef = useRef<HTMLAudioElement | null>(null);

	if (!voiceUrl) return null;

	const play = () => {
		try {
			if (!audioRef.current) {
				audioRef.current = new Audio(voiceUrl);
			}
			audioRef.current.currentTime = 0;
			void audioRef.current.play();
		} catch {
			/* ignore */
		}
	};

	return (
		<button type="button" className="game-classic-voice" onClick={play} aria-label={label}>
			<img src="/assets/games/icons/mic.svg" alt="" />
		</button>
	);
}
