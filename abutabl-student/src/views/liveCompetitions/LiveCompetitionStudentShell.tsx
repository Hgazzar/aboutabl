import type { ReactNode } from 'react';
import LiveGamesHeroSection, {
	type LiveGamesHeroBirdVariant,
} from './LiveGamesHeroSection';
import {
	DashboardAside,
	LiveGamesBackLink,
	LiveGamesBoardCard,
	LiveGamesMainColumn,
	LiveGamesPageGrid,
	LiveGamesPanelCard,
} from './liveCompetitionsStudentStyles';

type Props = {
	title: string;
	subtitle?: string;
	exitLabel: string;
	exitTo?: string;
	children: ReactNode;
	/** Optional test id for the outer page wrapper. */
	testId?: string;
	/** Session play uses gamer bird; invitation list keeps cheer. */
	heroBird?: LiveGamesHeroBirdVariant;
};

/**
 * Student Live Competitions chrome — matches dashboard /progress /todo shell
 * (green main column + hero + white board). No legacy learn welcome strip.
 */
export default function LiveCompetitionStudentShell({
	title,
	subtitle,
	exitLabel,
	exitTo = '/learn',
	children,
	testId = 'live-comp-student-shell',
	heroBird = 'cheer',
}: Props) {
	return (
		<LiveGamesPageGrid data-testid={testId}>
			<LiveGamesMainColumn>
				<LiveGamesHeroSection pageTitle={title} subtitle={subtitle} bird={heroBird} />
				<LiveGamesBoardCard>
					<LiveGamesBackLink to={exitTo} data-testid="live-comp-exit">
						{exitLabel}
					</LiveGamesBackLink>
					{children}
				</LiveGamesBoardCard>
			</LiveGamesMainColumn>
			<DashboardAside aria-hidden />
		</LiveGamesPageGrid>
	);
}

/** Invitation / arena content card inside the white board. */
export function LiveCompetitionPanel({
	children,
	testId,
}: {
	children: ReactNode;
	testId?: string;
}) {
	return <LiveGamesPanelCard data-testid={testId}>{children}</LiveGamesPanelCard>;
}
