import volumeIcon from './assets/volume.png';
import styles from './livePlayExperience.module.css';

type Props = {
	soundOn: boolean;
	onToggle: () => void;
	labelOn: string;
	labelOff: string;
};

/** Cartoon volume asset (sidebar-style) — slash overlay when muted. */
export default function LivePlaySoundToggle({
	soundOn,
	onToggle,
	labelOn,
	labelOff,
}: Props) {
	return (
		<button
			type="button"
			className={styles.soundToggle}
			onClick={onToggle}
			aria-label={soundOn ? labelOn : labelOff}
			aria-pressed={soundOn}
			data-testid="live-comp-play-audio-unlock"
			data-sound={soundOn ? 'on' : 'off'}
		>
			<span className={styles.soundIconWrap} aria-hidden>
				<img
					className={styles.soundIcon}
					src={volumeIcon}
					alt=""
					width={56}
					height={56}
					draggable={false}
				/>
				{!soundOn ? <span className={styles.soundSlash} /> : null}
			</span>
		</button>
	);
}
