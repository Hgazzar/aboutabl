import { useIntl } from 'react-intl';
import type { LiveCompetitionCurrentView } from 'lib/liveCompetitionsStudentApi';
import { gameTypeLabel } from '../gameTypeLabel';
import { resolveArenaTheme } from '../liveSessionArenaState';
import { LIVE_PLAY_ASSET, resolveLivePlayThemeVisual } from './livePlayAssets';
import { useLivePlayHudTimer } from './LivePlayHudContext';
import { readLivePlayStudentName } from './livePlayStudentName';
import styles from './livePlayExperience.module.css';

type Props = {
	current: LiveCompetitionCurrentView;
	gameName?: string | null;
	/** Override timer when the question panel owns the countdown. */
	timerSeconds?: number | null;
};

function formatClock(totalSeconds: number): string {
	const safe = Math.max(0, Math.ceil(totalSeconds));
	const mm = String(Math.floor(safe / 60)).padStart(2, '0');
	const ss = String(safe % 60).padStart(2, '0');
	return `${mm}:${ss}`;
}

export default function LivePlayHud({ current, gameName, timerSeconds }: Props) {
	const { formatMessage } = useIntl();
	const theme = resolveArenaTheme(current);
	const visual = resolveLivePlayThemeVisual(theme);
	const { timerSeconds: contextTimer } = useLivePlayHudTimer();
	const studentName = readLivePlayStudentName();
	const seconds =
		timerSeconds !== undefined ? timerSeconds : contextTimer;

	return (
		<header className={styles.hud} data-testid="live-comp-play-hud">
			<div className={styles.hudLogo}>
				<img src={visual.logo} alt="" />
				<div className={styles.hudLogoText}>
					<span className={styles.hudGameName} data-testid="live-comp-play-game-name">
						{gameName ||
							(theme === 'unknown'
								? formatMessage({ id: 'liveCompArenaThemeUnknown' })
								: gameTypeLabel(theme, formatMessage))}
					</span>
					{studentName ? (
						<span className={styles.hudStudentName} data-testid="live-comp-play-student-name">
							{studentName}
						</span>
					) : null}
				</div>
			</div>

			{seconds != null ? (
				<div
					className={`${styles.hudTimer}${
						seconds <= 5 ? ` ${styles.hudTimerUrgent}` : ''
					}`}
					data-testid="live-comp-play-hud-timer"
				>
					<img src={LIVE_PLAY_ASSET.alarm} alt="" />
					<span>{formatClock(seconds)}</span>
				</div>
			) : (
				<div className={styles.hudTimer} data-testid="live-comp-play-hud-timer-pending">
					<img src={LIVE_PLAY_ASSET.alarm} alt="" />
					<span>--</span>
				</div>
			)}

			<div className={styles.hudStats} data-testid="live-comp-arena-hud">
				{current.score !== undefined ? (
					<span className={styles.hudStat} data-testid="live-comp-hud-score">
						{formatMessage({ id: 'liveCompArenaScore' }, { score: current.score })}
					</span>
				) : null}
				{current.coins !== undefined ? (
					<span className={styles.hudStat} data-testid="live-comp-hud-coins">
						<span>{current.coins}</span>
						<img src={LIVE_PLAY_ASSET.coin} alt="" />
					</span>
				) : null}
				{current.streak !== undefined ? (
					<span className={styles.hudStat} data-testid="live-comp-hud-streak">
						{formatMessage({ id: 'liveCompArenaStreak' }, { streak: current.streak })}
					</span>
				) : null}
				{current.frozen ? (
					<span className={styles.hudStat} data-testid="live-comp-hud-frozen">
						{formatMessage(
							{ id: 'liveCompArenaFrozen' },
							{ seconds: current.frozen_seconds ?? 0 }
						)}
					</span>
				) : null}
			</div>
		</header>
	);
}
