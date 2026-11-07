import type { ReactNode } from 'react';
import { useIntl } from 'react-intl';
import type { LiveCompetitionCurrentView } from 'lib/liveCompetitionsStudentApi';
import LiveSessionPasswordPanel from './LiveSessionPasswordPanel';
import LiveSessionPersonalDonePanel from './LiveSessionPersonalDonePanel';
import LiveSessionPowerControl, { hasUsablePowerContract } from './LiveSessionPowerControl';
import LiveSessionQuestionPanel from './LiveSessionQuestionPanel';
import LiveSessionReinforcePanel from './LiveSessionReinforcePanel';
import LiveSessionResultsPanel from './LiveSessionResultsPanel';
import LiveSessionRewardPanel from './LiveSessionRewardPanel';
import LivePlayHud from './play/LivePlayHud';
import styles from './play/livePlayExperience.module.css';
import {
	resolveArenaPanel,
	resolveArenaTheme,
	type LiveArenaPanel,
} from './liveSessionArenaState';

type Props = {
	current: LiveCompetitionCurrentView | null;
	sessionId: number;
	onCurrent: (next: LiveCompetitionCurrentView) => void;
	refreshCurrent: () => Promise<LiveCompetitionCurrentView | null>;
	/** Locks poll mode hops while the student reads post-answer explanation. */
	setAnswerFeedbackHold?: (holding: boolean) => void;
	gameName?: string | null;
};

const PANEL_COPY: Record<
	Exclude<
		LiveArenaPanel,
		| 'unknown'
		| 'question'
		| 'reinforce'
		| 'reward'
		| 'need_password'
		| 'personal_done'
		| 'ended_results'
	>,
	{ titleId: string; bodyId: string }
> = {
	loading: {
		titleId: 'liveCompArenaLoadingTitle',
		bodyId: 'liveCompArenaLoadingBody',
	},
};

function PlaceholderPanel({
	panel,
}: {
	panel: Exclude<
		LiveArenaPanel,
		| 'question'
		| 'reinforce'
		| 'reward'
		| 'need_password'
		| 'personal_done'
		| 'ended_results'
	>;
}) {
	const { formatMessage } = useIntl();
	const copy =
		panel === 'unknown'
			? {
					titleId: 'liveCompArenaUnknownTitle',
					bodyId: 'liveCompArenaUnknownBody',
				}
			: PANEL_COPY[panel];

	return (
		<div data-testid={`live-comp-panel-${panel}`} className={styles.stageBody}>
			<div className={styles.panelCard}>
				<h2 className={styles.lobbyTitle} style={{ fontSize: 22 }}>
					{formatMessage({ id: copy.titleId })}
				</h2>
				<p className={styles.lobbyHint}>{formatMessage({ id: copy.bodyId })}</p>
			</div>
		</div>
	);
}

function canShowPowerControl(panel: LiveArenaPanel): boolean {
	return panel === 'question' || panel === 'reinforce' || panel === 'reward';
}

/**
 * Arena host. Gameplay panels + personal done / ended results; no mutations from results.
 */
export default function LiveSessionArenaShell({
	current,
	sessionId,
	onCurrent,
	refreshCurrent,
	setAnswerFeedbackHold,
	gameName,
}: Props) {
	const panel = resolveArenaPanel(current);
	const themeKey = resolveArenaTheme(current);
	const showPower =
		Boolean(current) && hasUsablePowerContract(current) && canShowPowerControl(panel);
	const showHud =
		Boolean(current) && panel !== 'ended_results' && panel !== 'loading' && panel !== 'unknown';

	let body: ReactNode;
	if (panel === 'question' && current) {
		body = (
			<LiveSessionQuestionPanel
				key={`question-${current.live_game_session_question_id ?? 'none'}`}
				sessionId={sessionId}
				current={current}
				onCurrent={onCurrent}
				refreshCurrent={refreshCurrent}
				setAnswerFeedbackHold={setAnswerFeedbackHold}
			/>
		);
	} else if (panel === 'reinforce' && current) {
		body = (
			<LiveSessionReinforcePanel
				key={`reinforce-${current.live_game_session_question_id ?? 'none'}`}
				sessionId={sessionId}
				current={current}
				onCurrent={onCurrent}
				refreshCurrent={refreshCurrent}
			/>
		);
	} else if (panel === 'reward' && current) {
		body = (
			<div className={styles.stageBody}>
				<LiveSessionRewardPanel
					key={`reward-${current.reward_type ?? 'none'}-${current.live_version ?? 0}`}
					sessionId={sessionId}
					current={current}
					onCurrent={onCurrent}
					refreshCurrent={refreshCurrent}
				/>
			</div>
		);
	} else if (panel === 'need_password' && current) {
		body = (
			<div className={styles.stageBody}>
				<LiveSessionPasswordPanel
					key="need-password"
					sessionId={sessionId}
					current={current}
					onCurrent={onCurrent}
					refreshCurrent={refreshCurrent}
				/>
			</div>
		);
	} else if (panel === 'personal_done' && current) {
		body = (
			<div className={styles.stageBody}>
				<LiveSessionPersonalDonePanel current={current} />
			</div>
		);
	} else if (panel === 'ended_results' && current) {
		body = <LiveSessionResultsPanel current={current} />;
	} else {
		const placeholderPanel =
			panel === 'question' ||
			panel === 'reinforce' ||
			panel === 'reward' ||
			panel === 'need_password' ||
			panel === 'personal_done' ||
			panel === 'ended_results'
				? 'loading'
				: panel;
		body = <PlaceholderPanel panel={placeholderPanel} />;
	}

	return (
		<div
			data-testid="live-comp-arena"
			data-arena-theme={themeKey}
			data-arena-panel={panel}
		>
			{showHud && current ? (
				<LivePlayHud current={current} gameName={gameName} />
			) : null}
			{showPower && current ? (
				<div className={styles.powerRow} style={{ padding: '0 18px' }}>
					<LiveSessionPowerControl
						sessionId={sessionId}
						current={current}
						onCurrent={onCurrent}
						refreshCurrent={refreshCurrent}
					/>
				</div>
			) : null}
			{body}
		</div>
	);
}
