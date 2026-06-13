type MusicApi = {
	muted: boolean;
	toggleMute: () => void;
};

type Props = {
	music: MusicApi;
	muteLabel: string;
	unmuteLabel: string;
};

export function MusicToggle({ music, muteLabel, unmuteLabel }: Props) {
	return (
		<button
			type="button"
			className="game-classic-music"
			onClick={() => music.toggleMute()}
			aria-label={music.muted ? unmuteLabel : muteLabel}
		>
			{music.muted ? '🔇' : '🔊'}
		</button>
	);
}
