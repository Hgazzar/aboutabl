import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useIntl } from 'react-intl';
import type { LiveCompetitionCurrentView } from 'lib/liveCompetitionsStudentApi';
import { livePlayAudio } from './play/livePlayAudio';
import styles from './play/livePlayExperience.module.css';

type Props = {
	current: LiveCompetitionCurrentView;
};

/**
 * Personal results for status=ended only. Renders supplied fields; no mutations.
 */
export default function LiveSessionResultsPanel({ current }: Props) {
	const { formatMessage } = useIntl();

	const cancelled = Boolean(current.cancelled);

	useEffect(() => {
		if (!cancelled) {
			livePlayAudio.playCue('game_completion');
		}
	}, [cancelled]);

	const rows: Array<{ testId: string; label: string; value: string }> = [];

	if (current.score !== undefined) {
		rows.push({
			testId: 'live-comp-results-score',
			label: formatMessage({ id: 'liveCompResultsScoreLabel' }),
			value: String(current.score),
		});
	}
	if (current.coins !== undefined) {
		rows.push({
			testId: 'live-comp-results-coins',
			label: formatMessage({ id: 'liveCompResultsCoinsLabel' }),
			value: String(current.coins),
		});
	}
	if (current.rank !== undefined && current.rank !== null) {
		rows.push({
			testId: 'live-comp-results-rank',
			label: formatMessage({ id: 'liveCompResultsRankLabel' }),
			value: String(current.rank),
		});
	}
	if (current.best_streak !== undefined) {
		rows.push({
			testId: 'live-comp-results-best-streak',
			label: formatMessage({ id: 'liveCompResultsBestStreakLabel' }),
			value: String(current.best_streak),
		});
	}
	if (current.streak !== undefined) {
		rows.push({
			testId: 'live-comp-results-streak',
			label: formatMessage({ id: 'liveCompResultsStreakLabel' }),
			value: String(current.streak),
		});
	}
	if (current.progress !== undefined) {
		rows.push({
			testId: 'live-comp-results-progress',
			label: formatMessage({ id: 'liveCompResultsProgressLabel' }),
			value: formatMessage(
				{ id: 'liveCompResultsProgressValue' },
				{ progress: current.progress }
			),
		});
	}
	if (current.accuracy !== undefined) {
		rows.push({
			testId: 'live-comp-results-accuracy',
			label: formatMessage({ id: 'liveCompResultsAccuracyLabel' }),
			value: formatMessage(
				{ id: 'liveCompResultsAccuracyValue' },
				{ accuracy: current.accuracy }
			),
		});
	}
	if (current.question_total !== undefined) {
		rows.push({
			testId: 'live-comp-results-question-total',
			label: formatMessage({ id: 'liveCompResultsQuestionTotalLabel' }),
			value: String(current.question_total),
		});
	}
	if (current.class_accuracy !== undefined && current.class_accuracy !== null) {
		rows.push({
			testId: 'live-comp-results-class-accuracy',
			label: formatMessage({ id: 'liveCompResultsClassAccuracyLabel' }),
			value: formatMessage(
				{ id: 'liveCompResultsClassAccuracyValue' },
				{ accuracy: current.class_accuracy }
			),
		});
	}
	if (current.fastest_ms !== undefined && current.fastest_ms !== null) {
		rows.push({
			testId: 'live-comp-results-fastest',
			label: formatMessage({ id: 'liveCompResultsFastestLabel' }),
			value: formatMessage(
				{ id: 'liveCompResultsFastestValue' },
				{ ms: current.fastest_ms }
			),
		});
	}
	if (current.goal_label) {
		rows.push({
			testId: 'live-comp-results-goal',
			label: formatMessage({ id: 'liveCompResultsGoalLabel' }),
			value: current.goal_label,
		});
	} else if (current.goal) {
		rows.push({
			testId: 'live-comp-results-goal',
			label: formatMessage({ id: 'liveCompResultsGoalLabel' }),
			value: current.goal,
		});
	}

	return (
		<div
			data-testid="live-comp-panel-ended_results"
			className={`${styles.stageBody} ${styles.resultsBody}`}
			data-cancelled={cancelled ? 'true' : 'false'}
		>
			<div className={styles.lobbyCard}>
				<h1 className={styles.lobbyTitle}>
					{formatMessage({
						id: cancelled ? 'liveCompSessionCancelledTitle' : 'liveCompArenaEndedTitle',
					})}
				</h1>
				<p className={styles.lobbyHint} data-testid="live-comp-results-status">
					{formatMessage({
						id: cancelled
							? 'liveCompSessionCancelledStatus'
							: 'liveCompResultsStatusEnded',
					})}
				</p>
				{!cancelled && current.fire_lit ? (
					<p className={styles.lobbyWaiting} data-testid="live-comp-results-fire-lit">
						{formatMessage({ id: 'liveCompResultsFireLit' })}
					</p>
				) : null}
				<p className={styles.lobbyHint} data-testid="live-comp-results-body">
					{formatMessage({
						id: cancelled ? 'liveCompSessionCancelledBody' : 'liveCompResultsBody',
					})}
				</p>

				{!cancelled && rows.length > 0 ? (
					<div className={styles.resultsGrid} data-testid="live-comp-results-fields">
						{rows.map((row) => (
							<div key={row.testId} className={styles.resultCard} data-testid={row.testId}>
								<div className={styles.resultLabel}>{row.label}</div>
								<div className={styles.resultValue}>{row.value}</div>
							</div>
						))}
					</div>
				) : null}

				<div style={{ textAlign: 'center' }}>
					<Link to="/live-games" className={styles.cta} data-testid="live-comp-results-exit">
						{formatMessage({ id: 'liveCompExit' })}
					</Link>
				</div>
			</div>
		</div>
	);
}
