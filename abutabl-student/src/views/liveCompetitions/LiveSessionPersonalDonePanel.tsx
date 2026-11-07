import { useIntl } from 'react-intl';
import type { LiveCompetitionCurrentView } from 'lib/liveCompetitionsStudentApi';
import { LiveCompetitionPanel } from './LiveCompetitionStudentShell';
import {
	InviteChip,
	SessionChipRow,
	SessionCtaLinkFull,
	SessionHudChip,
	SessionHudRow,
	SessionStack,
	SessionSubtitle,
	SessionTitle,
} from './liveCompetitionsStudentStyles';

type Props = {
	current: LiveCompetitionCurrentView;
};

/**
 * playing + mode=done: personal questions finished; session still active.
 * Not final results — no rank / ended-only fields.
 */
export default function LiveSessionPersonalDonePanel({ current }: Props) {
	const { formatMessage } = useIntl();

	return (
		<div data-testid="live-comp-panel-personal_done">
			<LiveCompetitionPanel>
				<SessionStack>
					<SessionChipRow>
						<SessionTitle>
							{formatMessage({ id: 'liveCompArenaPersonalDoneTitle' })}
						</SessionTitle>
						<InviteChip $tone="ok" data-testid="live-comp-personal-done-status">
							{formatMessage({ id: 'liveCompPersonalDoneWaitingBadge' })}
						</InviteChip>
					</SessionChipRow>

					<SessionSubtitle data-testid="live-comp-personal-done-body">
						{formatMessage({ id: 'liveCompArenaPersonalDoneBody' })}
					</SessionSubtitle>

					{(current.score !== undefined || current.coins !== undefined) && (
						<SessionHudRow data-testid="live-comp-personal-done-stats">
							{current.score !== undefined ? (
								<SessionHudChip data-testid="live-comp-personal-done-score">
									{formatMessage(
										{ id: 'liveCompArenaScore' },
										{ score: current.score }
									)}
								</SessionHudChip>
							) : null}
							{current.coins !== undefined ? (
								<SessionHudChip data-testid="live-comp-personal-done-coins">
									{formatMessage(
										{ id: 'liveCompArenaCoins' },
										{ coins: current.coins }
									)}
								</SessionHudChip>
							) : null}
						</SessionHudRow>
					)}

					<SessionCtaLinkFull
						to="/live-games"
						data-testid="live-comp-personal-done-exit"
					>
						{formatMessage({ id: 'liveCompExit' })}
					</SessionCtaLinkFull>
				</SessionStack>
			</LiveCompetitionPanel>
		</div>
	);
}
