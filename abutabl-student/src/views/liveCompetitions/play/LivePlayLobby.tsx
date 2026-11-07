import { useIntl } from 'react-intl';
import type { LiveCompetitionInvitePreview } from 'lib/liveCompetitionsStudentApi';
import { gameTypeLabel } from '../gameTypeLabel';
import { LIVE_PLAY_ASSET, resolveLivePlayThemeVisual } from './livePlayAssets';
import { readLivePlayStudentName } from './livePlayStudentName';
import styles from './livePlayExperience.module.css';

type Props = {
	preview: LiveCompetitionInvitePreview;
};

/**
 * Themed waiting lobby. Participant roster is not returned by the student current/preview API;
 * we only surface join state the API actually provides.
 */
export default function LivePlayLobby({ preview }: Props) {
	const { formatMessage } = useIntl();
	const visual = resolveLivePlayThemeVisual(preview.session.theme);
	const studentName = readLivePlayStudentName();
	const gameName =
		preview.session.game_name || formatMessage({ id: 'liveCompUntitledGame' });

	return (
		<div className={styles.stageBody} data-testid="live-comp-waiting">
			<div className={styles.lobbyCard} data-testid="live-comp-preview-card">
				<header className={styles.hudLogo} style={{ justifyContent: 'center', marginBottom: 8 }}>
					<img src={visual.logo} alt="" width={48} height={48} />
				</header>
				<h1 className={styles.lobbyTitle} data-testid="live-comp-play-game-name">
					{gameName}
				</h1>
				{studentName ? (
					<p className={styles.lobbyHint} data-testid="live-comp-play-student-name">
						{studentName}
					</p>
				) : null}
				<div className={styles.lobbyMeta}>
					<span data-testid="live-comp-theme">
						{gameTypeLabel(preview.session.theme, formatMessage)}
					</span>
					{preview.session.goal_label ? (
						<span data-testid="live-comp-goal">
							{formatMessage(
								{ id: 'liveCompGoal' },
								{ goal: preview.session.goal_label }
							)}
						</span>
					) : null}
					{preview.session.question_total > 0 ? (
						<span data-testid="live-comp-questions">
							{formatMessage(
								{ id: 'liveCompQuestionTotal' },
								{ total: preview.session.question_total }
							)}
						</span>
					) : null}
				</div>

				<p className={styles.lobbyWaiting} data-testid="live-comp-waiting-title">
					{formatMessage({ id: 'liveCompWaitingTitle' })}
				</p>
				<p className={styles.lobbyHint}>
					{formatMessage({ id: 'liveCompWaitingBody' })}
				</p>

				{preview.joined ? (
					<div className={styles.lobbyJoined} data-testid="live-comp-lobby-joined">
						<img src={LIVE_PLAY_ASSET.person} alt="" width={18} height={18} />
						<span>{formatMessage({ id: 'liveCompPlayLobbyJoined' })}</span>
					</div>
				) : null}
			</div>
		</div>
	);
}
