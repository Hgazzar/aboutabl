import type { ReactNode } from 'react';
import { useState } from 'react';
import { useIntl } from 'react-intl';
import styled from 'styled-components';
import { STUDENT_WIDGET6_RECENT_WIDTH } from 'config/studentShellLayout';
import { theme } from 'global-styles';
import type {
	DashboardPayload,
	DashboardRecentActivitiesPayload,
} from 'lib/dashboardApi';
import LearningStreakPopup from './LearningStreakPopup';
import {
	birdAssetForVisual,
	formatEarnedXp,
	formatRecentActivityDate,
	recentRowTheme,
} from './recommendedActivitiesUtils';
import {
	BirdSmall,
	EmptyHint,
	RecentBodyText,
	RecentDateText,
	RecentHeader,
	RecentRow,
	RecentRowContent,
	RecentTextBlock,
	RecentXp,
	SectionHeading,
	ViewMoreLabel,
	WIDGET6_RECENT_ROW_GAP,
} from './widget6CardStyles';

const Column = styled.section`
	width: 100%;
	max-width: ${STUDENT_WIDGET6_RECENT_WIDTH}px;
	min-width: 0;
	box-sizing: border-box;
`;

const RowList = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${WIDGET6_RECENT_ROW_GAP}px;
`;

const ViewMoreButton = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 0;
	border: none;
	background: transparent;
	cursor: pointer;

	&:focus-visible {
		outline: 2px solid ${theme.colours.LightSeaGreen};
		outline-offset: 3px;
		border-radius: 4px;
	}
`;

type Props = {
	payload: DashboardRecentActivitiesPayload;
	streak: DashboardPayload['streak'];
};

export default function RecentActivitiesWidget({ payload, streak }: Props) {
	const { formatMessage } = useIntl();
	const [popupOpen, setPopupOpen] = useState(false);
	const items = payload.items ?? [];
	const viewMoreLabel = formatMessage({ id: 'dashboard-recent-view-more' });

	return (
		<>
			<Column>
				<RecentHeader>
					<SectionHeading>{formatMessage({ id: 'dashboard-recent-activities' })}</SectionHeading>
					<ViewMoreButton
						type="button"
						onClick={() => setPopupOpen(true)}
						aria-label={viewMoreLabel}
					>
						<ViewMoreLabel>{viewMoreLabel}</ViewMoreLabel>
					</ViewMoreButton>
				</RecentHeader>

				{items.length === 0 ? (
					<EmptyHint>{formatMessage({ id: 'dashboard-recent-empty' })}</EmptyHint>
				) : (
					<RowList>
						{items.map((item, index) => {
							const xpLabel = formatEarnedXp(item.xp_earned);
							const rowTheme = recentRowTheme(item.theme);

							return (
								<RecentRow key={`${item.kind}-${item.occurred_at}-${index}`} $theme={rowTheme}>
									{xpLabel ? <RecentXp>{xpLabel}</RecentXp> : null}
									<RecentRowContent>
										<BirdSmall
											src={birdAssetForVisual(item.visual)}
											alt=""
											aria-hidden
										/>
										<RecentTextBlock>
											<RecentBodyText>
												{formatMessage(
													{ id: 'dashboard-recent-completed' },
													{
														label: item.content_label,
														subject: item.subject_name,
														strong: (chunks: ReactNode) => <strong>{chunks}</strong>,
													}
												)}
											</RecentBodyText>
											<RecentDateText>
												{formatRecentActivityDate(item.occurred_at, formatMessage)}
											</RecentDateText>
										</RecentTextBlock>
									</RecentRowContent>
								</RecentRow>
							);
						})}
					</RowList>
				)}
			</Column>

			<LearningStreakPopup
				opened={popupOpen}
				onClose={() => setPopupOpen(false)}
				streak={streak}
			/>
		</>
	);
}
