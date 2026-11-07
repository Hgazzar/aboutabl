import { useCallback, useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { Alert, Badge, Button, Flex, Stack, Text } from '@mantine/core';
import {
	classifyLiveCompetitionApiError,
	useLiveCompetitionPower,
	type LiveCompetitionCurrentView,
	type LiveCompetitionPowerResult,
} from 'lib/liveCompetitionsStudentApi';
import { gameplayErrorMessageId } from './liveSessionJoinState';

type Props = {
	sessionId: number;
	current: LiveCompetitionCurrentView;
	onCurrent: (next: LiveCompetitionCurrentView) => void;
	refreshCurrent: () => Promise<LiveCompetitionCurrentView | null>;
};

/** True when current view exposes a single assigned power the student can act on. */
export function hasUsablePowerContract(current: LiveCompetitionCurrentView | null): boolean {
	if (!current) {
		return false;
	}
	return typeof current.power === 'string' && current.power.length > 0;
}

export default function LiveSessionPowerControl({
	sessionId,
	current,
	onCurrent,
	refreshCurrent,
}: Props) {
	const { formatMessage } = useIntl();
	const [submitting, setSubmitting] = useState(false);
	const [result, setResult] = useState<LiveCompetitionPowerResult | null>(null);
	const [inlineErrorId, setInlineErrorId] = useState<string | null>(null);

	const mountedRef = useRef(true);
	const generationRef = useRef(0);
	const inFlightRef = useRef(false);

	useEffect(() => {
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
			generationRef.current += 1;
		};
	}, []);

	// Clear local feedback when the assigned power / used flag changes from the server.
	useEffect(() => {
		setResult(null);
		setInlineErrorId(null);
		setSubmitting(false);
		inFlightRef.current = false;
	}, [current.power, current.power_used, current.live_game_session_question_id]);

	const unavailable = Boolean(current.power_used) || Boolean(current.frozen);
	const label =
		current.power_label ||
		formatMessage({ id: 'liveCompPowerFallbackLabel' }, { power: current.power ?? '' });

	const onActivate = useCallback(async () => {
		if (!sessionId || inFlightRef.current || unavailable || result) {
			return;
		}
		const gen = generationRef.current;
		inFlightRef.current = true;
		setSubmitting(true);
		setInlineErrorId(null);
		try {
			const feedback = await useLiveCompetitionPower(sessionId);
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
				inFlightRef.current = false;
				setSubmitting(false);
			}
		}
	}, [onCurrent, refreshCurrent, result, sessionId, unavailable]);

	return (
		<div data-testid="live-comp-power-control" data-power={current.power ?? ''}>
			<Stack spacing="xs">
				<Flex gap="sm" wrap="wrap" align="center">
					<Badge color="gray" data-testid="live-comp-power-label">
						{label}
					</Badge>
					{current.power_used ? (
						<Badge color="gray" data-testid="live-comp-power-used">
							{formatMessage({ id: 'liveCompPowerUsed' })}
						</Badge>
					) : null}
					<Button
						size="sm"
						variant="light"
						loading={submitting}
						disabled={submitting || unavailable || Boolean(result)}
						onClick={() => void onActivate()}
						data-testid="live-comp-power-activate"
					>
						{submitting
							? formatMessage({ id: 'liveCompPowerActivating' })
							: formatMessage({ id: 'liveCompPowerActivate' })}
					</Button>
				</Flex>

				{inlineErrorId ? (
					<Alert color="orange" data-testid="live-comp-power-error">
						{formatMessage({ id: inlineErrorId })}
					</Alert>
				) : null}

				{result ? (
					<Alert color="teal" data-testid="live-comp-power-feedback">
						<Stack spacing={4}>
							<Text data-testid="live-comp-power-message">
								{result.message || formatMessage({ id: 'liveCompPowerActivated' })}
							</Text>
							{result.shield ? (
								<Text size="sm" data-testid="live-comp-power-shield">
									{formatMessage({ id: 'liveCompRewardShield' })}
								</Text>
							) : null}
						</Stack>
					</Alert>
				) : null}
			</Stack>
		</div>
	);
}
