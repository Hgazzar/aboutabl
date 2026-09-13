import type { ReactNode } from 'react';
import { useIntl } from 'react-intl';
import styled from 'styled-components';
import type { DashboardRecommendedActivitiesPayload } from 'lib/dashboardApi';
import {
	birdAssetForVisual,
	formatPotentialXp,
	recommendedCtaPath,
	shouldShowPotentialXp,
} from './recommendedActivitiesUtils';
import {
	BirdLarge,
	CardBodyText,
	CardContent,
	CardCopy,
	CardCtaWrap,
	CardXp,
	CtaGold,
	CtaMint,
	CtaPurple,
	RecommendedCardLink,
	RecommendedHeader,
	SectionHeading,
	WIDGET6_CARD_GAP,
} from './widget6CardStyles';

const Column = styled.section`
	width: 100%;
	min-width: 0;
	box-sizing: border-box;
`;

const CardList = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${WIDGET6_CARD_GAP}px;
`;

type Props = {
	payload: DashboardRecommendedActivitiesPayload;
};

export default function RecommendedActivitiesWidget({ payload }: Props) {
	const { formatMessage } = useIntl();
	const items = payload.items ?? [];

	if (items.length === 0) {
		return null;
	}

	return (
		<Column aria-label={formatMessage({ id: 'dashboard-recommended' })}>
			<RecommendedHeader>
				<SectionHeading>{formatMessage({ id: 'dashboard-recommended' })}</SectionHeading>
			</RecommendedHeader>
			<CardList>
				{items.map((item, index) => {
					const cardTheme =
						item.kind === 'pending_assignments'
							? 'mint'
							: item.theme === 'mint' || item.theme === 'lavender'
								? item.theme
								: 'cream';

					const body =
						item.kind === 'pending_assignments' ? (
							<CardBodyText $accent="teal">
								{formatMessage(
									{ id: 'dashboard-rec-pending-body' },
									{
										count: item.count ?? 0,
										strong: (chunks: ReactNode) => <strong>{chunks}</strong>,
									}
								)}
							</CardBodyText>
						) : item.kind === 'game' ? (
							<CardBodyText>
								{formatMessage(
									{ id: 'dashboard-rec-game-body' },
									{
										review: (chunks: ReactNode) => <strong>{chunks}</strong>,
									}
								)}
							</CardBodyText>
						) : (
							<CardBodyText>
								{formatMessage(
									{ id: 'dashboard-rec-continue-body' },
									{
										label: item.content_label ?? '',
										subject: item.subject_name ?? '',
										labelStrong: (chunks: ReactNode) => <strong>{chunks}</strong>,
									}
								)}
							</CardBodyText>
						);

					const cta =
						item.kind === 'pending_assignments' ? (
							<CtaMint>{formatMessage({ id: 'dashboard-rec-view-assignments' })}</CtaMint>
						) : item.kind === 'game' ? (
							<CtaPurple>{formatMessage({ id: 'dashboard-rec-play-game' })}</CtaPurple>
						) : (
							<CtaGold>{formatMessage({ id: 'dashboard-rec-continue-btn' })}</CtaGold>
						);

					return (
						<RecommendedCardLink
							key={`${item.kind}-${item.subject_id ?? index}`}
							to={recommendedCtaPath(item)}
							$theme={cardTheme}
						>
							{shouldShowPotentialXp(item) && item.reward_xp != null ? (
								<CardXp>{formatPotentialXp(item.reward_xp)}</CardXp>
							) : null}
							<CardContent>
								<BirdLarge
									src={birdAssetForVisual(item.visual)}
									alt=""
									aria-hidden
								/>
								<CardCopy>{body}</CardCopy>
								<CardCtaWrap>{cta}</CardCtaWrap>
							</CardContent>
						</RecommendedCardLink>
					);
				})}
			</CardList>
		</Column>
	);
}
