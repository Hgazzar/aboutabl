import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useIntl } from 'react-intl';
import type { LiveArenaTheme } from '../liveSessionArenaState';
import { livePlayAudio } from './livePlayAudio';
import { resolveLivePlayThemeVisual } from './livePlayAssets';
import LivePlayCoinBurst from './LivePlayCoinBurst';
import { LivePlayHudProvider } from './LivePlayHudContext';
import { LivePlayRewardFeedbackProvider } from './LivePlayRewardFeedbackContext';
import LivePlaySoundToggle from './LivePlaySoundToggle';
import styles from './livePlayExperience.module.css';

type Props = {
	theme: LiveArenaTheme | string | null | undefined;
	exitLabel: string;
	exitTo?: string;
	children: ReactNode;
	testId?: string;
	/** When true, try to start BGM after an explicit unlock gesture. */
	enableAudio?: boolean;
};

export default function LivePlayStage({
	theme,
	exitLabel,
	exitTo = '/live-games',
	children,
	testId = 'live-comp-play-stage',
	enableAudio = true,
}: Props) {
	const { formatMessage } = useIntl();
	const visual = useMemo(() => resolveLivePlayThemeVisual(theme), [theme]);
	const [soundOn, setSoundOn] = useState(
		() => livePlayAudio.unlocked && !livePlayAudio.muted
	);

	useEffect(() => {
		return () => {
			livePlayAudio.stopBgm();
		};
	}, []);

	const onToggleSound = async () => {
		if (!soundOn) {
			if (!livePlayAudio.unlocked) {
				await livePlayAudio.unlock();
				livePlayAudio.playCue('game_start');
			} else {
				livePlayAudio.setMuted(false);
				livePlayAudio.playCue('game_start');
			}
			setSoundOn(livePlayAudio.unlocked && !livePlayAudio.muted);
			return;
		}
		livePlayAudio.setMuted(true);
		setSoundOn(false);
	};

	const rootClass =
		visual.modeClass === 'hacking'
			? `${styles.root} ${styles.rootHacking}`
			: styles.root;

	const styleVars = {
		'--live-play-bg-color': visual.backgroundColor,
		'--live-play-bg-image': visual.backgroundImage
			? `url('${visual.backgroundImage}')`
			: 'none',
	} as CSSProperties;

	return (
		<LivePlayHudProvider>
			<LivePlayRewardFeedbackProvider>
				<div
					className={rootClass}
					style={styleVars}
					data-testid={testId}
					data-live-play-theme={visual.modeClass}
				>
					<div className={styles.topBar}>
						<Link to={exitTo} className={styles.exitLink} data-testid="live-comp-exit">
							{exitLabel}
						</Link>
						{enableAudio ? (
							<LivePlaySoundToggle
								soundOn={soundOn}
								onToggle={() => void onToggleSound()}
								labelOn={formatMessage({ id: 'liveCompPlayMuteSound' })}
								labelOff={formatMessage({ id: 'liveCompPlayEnableSound' })}
							/>
						) : null}
					</div>
					{children}
					<LivePlayCoinBurst themeClass={visual.modeClass} />
				</div>
			</LivePlayRewardFeedbackProvider>
		</LivePlayHudProvider>
	);
}
