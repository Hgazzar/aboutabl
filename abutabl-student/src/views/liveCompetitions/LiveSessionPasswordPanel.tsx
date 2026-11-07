import { useCallback, useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import {
	classifyLiveCompetitionApiError,
	pickLiveCompetitionPassword,
	type LiveCompetitionCurrentView,
	type LiveCompetitionPasswordResult,
} from 'lib/liveCompetitionsStudentApi';
import { gameplayErrorMessageId } from './liveSessionJoinState';
import styles from './play/livePlayExperience.module.css';

type Props = {
	sessionId: number;
	current: LiveCompetitionCurrentView;
	onCurrent: (next: LiveCompetitionCurrentView) => void;
	refreshCurrent: () => Promise<LiveCompetitionCurrentView | null>;
};

export default function LiveSessionPasswordPanel({
	sessionId,
	current,
	onCurrent,
	refreshCurrent,
}: Props) {
	const { formatMessage } = useIntl();
	const options = current.password_options ?? [];

	const [selected, setSelected] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [result, setResult] = useState<LiveCompetitionPasswordResult | null>(null);
	const [inlineErrorId, setInlineErrorId] = useState<string | null>(null);

	const mountedRef = useRef(true);
	const generationRef = useRef(0);
	const submitInFlightRef = useRef(false);

	useEffect(() => {
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
			generationRef.current += 1;
		};
	}, []);

	useEffect(() => {
		setSelected(null);
		setResult(null);
		setInlineErrorId(null);
		setSubmitting(false);
		submitInFlightRef.current = false;
	}, [current.session_id, current.mode]);

	const onSubmit = useCallback(async () => {
		if (!sessionId || !selected || submitInFlightRef.current || result || current.frozen) {
			return;
		}
		const gen = generationRef.current;
		submitInFlightRef.current = true;
		setSubmitting(true);
		setInlineErrorId(null);
		try {
			const feedback = await pickLiveCompetitionPassword(sessionId, selected);
			if (!mountedRef.current || gen !== generationRef.current) {
				return;
			}
			setResult(feedback);
			const next = await refreshCurrent();
			if (!mountedRef.current || gen !== generationRef.current) {
				return;
			}
			if (next) {
				onCurrent(next);
			}
		} catch (err) {
			if (!mountedRef.current || gen !== generationRef.current) {
				return;
			}
			const classified = classifyLiveCompetitionApiError(err);
			setInlineErrorId(gameplayErrorMessageId(classified.kind));
			const next = await refreshCurrent();
			if (mountedRef.current && gen === generationRef.current && next) {
				onCurrent(next);
			}
		} finally {
			if (gen === generationRef.current) {
				submitInFlightRef.current = false;
				setSubmitting(false);
			}
		}
	}, [current.frozen, onCurrent, refreshCurrent, result, selected, sessionId]);

	const disabled = submitting || Boolean(result) || Boolean(current.frozen);

	return (
		<div data-testid="live-comp-panel-need_password" className={styles.stageBody}>
			<div className={`${styles.panelCard} ${styles.passwordPanel}`}>
				<h2 className={styles.lobbyTitle} style={{ fontSize: 24 }}>
					{formatMessage({ id: 'liveCompArenaNeedPasswordTitle' })}
				</h2>
				<p className={styles.lobbyHint} data-testid="live-comp-password-body">
					{formatMessage({ id: 'liveCompPasswordBody' })}
				</p>

				{inlineErrorId ? (
					<div className={styles.inlineError} data-testid="live-comp-password-error">
						{formatMessage({ id: inlineErrorId })}
					</div>
				) : null}

				{result ? (
					<div
						className={`${styles.feedback} ${styles.feedbackCorrect}`}
						data-testid="live-comp-password-feedback"
					>
						<p>
							{result.already_selected
								? formatMessage({ id: 'liveCompPasswordAlreadySelected' })
								: result.has_password
									? formatMessage({ id: 'liveCompPasswordSet' })
									: formatMessage({ id: 'liveCompPasswordPending' })}
						</p>
					</div>
				) : (
					<>
						<div className={styles.passwordOptions} data-testid="live-comp-password-options">
							{options.map((option) => {
								const isSelected = selected === option;
								return (
									<button
										key={option}
										type="button"
										className={`${styles.passwordOption}${
											isSelected ? ` ${styles.passwordOptionSelected}` : ''
										}`}
										disabled={disabled}
										onClick={() => setSelected(option)}
										data-testid="live-comp-password-option"
										data-option={option}
									>
										{option}
									</button>
								);
							})}
						</div>
						<button
							type="button"
							className={styles.cta}
							disabled={disabled || !selected || submitting}
							onClick={() => void onSubmit()}
							data-testid="live-comp-password-submit"
						>
							{submitting
								? formatMessage({ id: 'liveCompPasswordSubmitting' })
								: formatMessage({ id: 'liveCompPasswordSubmit' })}
						</button>
					</>
				)}
			</div>
		</div>
	);
}
