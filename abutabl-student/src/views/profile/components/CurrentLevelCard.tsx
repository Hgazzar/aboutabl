import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import styled from 'styled-components';
import { figmaDashboardAssetUrl, figmaProfileAssetUrl } from 'config/figmaAssets';
import { theme } from 'global-styles';
import type { DashboardXpPayload } from 'lib/dashboardApi';
import barFrameGapRaw from 'assets/images/figma/dashboard/bar-frame-gap.svg?raw';
import {
	BAR_TRACK_HEIGHT_PERCENT,
	BAR_TRACK_LEFT_PERCENT,
	BAR_TRACK_TOP_PERCENT,
	BAR_TRACK_WIDTH_PERCENT,
	clampFillPercent,
} from 'views/dashboard/components/myProgressBarUtils';
import {
	buildProfileLevelTrackSvg,
	formatProfileXpRatio,
	isProfileAchieverUnlocked,
} from '../profileUtils';
import { PocketCard } from './profileLayout';

const STAR_ICON = figmaDashboardAssetUrl('star-6-1.svg');
const ACHIEVER_BADGE = figmaDashboardAssetUrl('achiever-badge.svg');
const FLASH_ICON = figmaDashboardAssetUrl('flash-4.svg');
const PROGRESS_ICON = figmaProfileAssetUrl('progress-icon.png');

const Section = styled.section`
	display: flex;
	flex-direction: column;
	gap: 16px;
	width: 100%;
`;

const SectionHead = styled.h2`
	display: flex;
	align-items: center;
	gap: 10px;
	margin: 0;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 500;
	font-size: 22px;
	line-height: 1.35;
	color: #1f1e1e;

	img {
		width: 28px;
		height: 28px;
		object-fit: contain;
	}
`;

/**
 * Figma pocket inner layout mirrors dashboard Widget 3 progress frame:
 * Level/XP row above the bar, Achiever badge on the right column.
 */
const ProgressFrame = styled.div`
	display: grid;
	grid-template-columns: minmax(0, 1fr) 110px;
	grid-template-rows: auto auto;
	column-gap: 12px;
	row-gap: 4px;
	box-sizing: border-box;
	width: 100%;

	@media (max-width: 640px) {
		grid-template-columns: 1fr;
	}
`;

const LevelRow = styled.div`
	grid-column: 1;
	grid-row: 1;
	display: flex;
	flex-wrap: nowrap;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	min-width: 0;
	transform: translateY(-8px);

	@media (max-width: 640px) {
		flex-wrap: wrap;
		transform: none;
	}
`;

const LevelLeft = styled.div`
	display: flex;
	flex-wrap: nowrap;
	align-items: center;
	gap: 8px;
	min-width: 0;
`;

const LevelLabel = styled.span`
	font-family: ${theme.fonts.Nunito};
	font-weight: 600;
	font-size: 16px;
	line-height: 1.4;
	color: #442817;
`;

const LevelBadge = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 37px;
	height: 32px;
	padding: 0 8px;
	border-radius: 8px;
	background: #1ebba3;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 500;
	font-size: 20px;
	line-height: 1;
	color: ${theme.colours.white};
`;

const BadgeName = styled.span`
	font-family: ${theme.fonts.Nunito};
	font-weight: 600;
	font-size: 16px;
	line-height: 1.4;
	color: #442817;
	text-transform: capitalize;
	white-space: nowrap;
`;

const XpRatio = styled.div`
	display: flex;
	align-items: center;
	flex-shrink: 0;
	gap: 5px;
	font-family: ${theme.fonts.Nunito};
	font-weight: 600;
	font-size: 16px;
	line-height: 1.4;
	color: #442817;
	white-space: nowrap;

	img {
		width: 26px;
		height: 24px;
		object-fit: contain;
	}
`;

const BarWrap = styled.div`
	grid-column: 1;
	grid-row: 2;
	position: relative;
	width: 100%;
	max-width: 568px;
	line-height: 0;
	align-self: end;
	transform: translateY(-15px);

	@media (max-width: 640px) {
		max-width: 100%;
		transform: none;
	}

	svg {
		display: block;
		width: 100%;
		height: auto;
		isolation: isolate;
	}
`;

const BarFill = styled.div<{ $percent: number }>`
	position: absolute;
	left: ${BAR_TRACK_LEFT_PERCENT}%;
	top: ${BAR_TRACK_TOP_PERCENT}%;
	height: ${BAR_TRACK_HEIGHT_PERCENT}%;
	width: calc(${BAR_TRACK_WIDTH_PERCENT}% * ${({ $percent }) => $percent / 100});
	border-radius: 6px;
	background: linear-gradient(
		90deg,
		#72d8b9 16.83%,
		#d5b454 38.94%,
		#d1b658 60.1%,
		#eac65c 77.4%,
		#e5b314 100%
	);
	pointer-events: none;
`;

const AchieverBadgeWrap = styled.div`
	grid-column: 2;
	grid-row: 1;
	display: flex;
	justify-content: center;
	align-items: flex-start;
	transform: translateY(20px);

	@media (max-width: 640px) {
		grid-column: 1;
		grid-row: 3;
		justify-content: flex-start;
		transform: none;
	}
`;

const AchieverBadgeImg = styled.img<{ $unlocked: boolean }>`
	width: 110px;
	height: auto;
	object-fit: contain;
	flex-shrink: 0;
	filter: ${({ $unlocked }) => ($unlocked ? 'none' : 'grayscale(1) brightness(0.92)')};
`;

const AchieverLabel = styled.span`
	grid-column: 2;
	grid-row: 2;
	justify-self: center;
	align-self: end;
	transform: translateY(-15px);
	font-family: ${theme.fonts.Nunito};
	font-weight: 600;
	font-size: 16px;
	line-height: 1;
	color: #937c61;

	@media (max-width: 640px) {
		grid-column: 1;
		grid-row: 4;
		justify-self: start;
		transform: none;
	}
`;

const Motivational = styled.p`
	display: flex;
	align-items: center;
	gap: 8px;
	margin: 0;
	font-family: ${theme.fonts.Nunito};
	font-weight: 700;
	font-size: 16px;
	line-height: 1.4;
	color: #ea780c;

	img {
		width: 23px;
		height: 23px;
		object-fit: contain;
		flex-shrink: 0;
	}
`;

type Props = {
	xp: DashboardXpPayload;
};

export default function CurrentLevelCard({ xp }: Props) {
	const { formatMessage } = useIntl();
	const barFrameSvg = useMemo(
		() => (barFrameGapRaw ? buildProfileLevelTrackSvg(barFrameGapRaw, xp.level) : ''),
		[xp.level]
	);
	const fillPercent = clampFillPercent(xp.track?.fill_percent ?? 0);
	const unlocked = isProfileAchieverUnlocked(xp);

	return (
		<Section>
			<SectionHead>
				<img src={PROGRESS_ICON} alt="" />
				{formatMessage({ id: 'My-Progress' })}
			</SectionHead>

			<PocketCard>
				<ProgressFrame>
					<LevelRow>
						<LevelLeft>
							<LevelLabel>{formatMessage({ id: 'dashboard-level' })}</LevelLabel>
							<LevelBadge>{xp.level}</LevelBadge>
							<BadgeName>
								{formatMessage({ id: 'dashboard-level-badge' }, { badge: xp.level_badge_label })}
							</BadgeName>
						</LevelLeft>
						<XpRatio>
							<img src={STAR_ICON} alt="" />
							<span>{formatProfileXpRatio(xp)}</span>
						</XpRatio>
					</LevelRow>

					<BarWrap aria-hidden>
						<div dangerouslySetInnerHTML={{ __html: barFrameSvg }} />
						<BarFill $percent={fillPercent} data-fill-percent={fillPercent} />
					</BarWrap>

					<AchieverBadgeWrap>
						<AchieverBadgeImg src={ACHIEVER_BADGE} alt="" $unlocked={unlocked} />
					</AchieverBadgeWrap>

					<AchieverLabel>{formatMessage({ id: 'dashboard-achiever' })}</AchieverLabel>
				</ProgressFrame>
			</PocketCard>

			<Motivational>
				<img src={FLASH_ICON} alt="" />
				{xp.levels_away_from_achiever > 0
					? formatMessage({ id: 'dashboard-levels-away' }, { count: xp.levels_away_from_achiever })
					: formatMessage({ id: 'dashboard-achiever-unlocked' })}
			</Motivational>
		</Section>
	);
}
