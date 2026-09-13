import { useIntl } from 'react-intl';
import styled from 'styled-components';
import { theme } from 'global-styles';
import { figmaMyProgressAssetUrl } from 'config/figmaAssets';
import type { MyProgressHero } from 'lib/myProgressApi';
import type { ProfileAchievement } from 'views/profile/types';
import { badgeStarsFilled, formatHeroBadgeTitle } from './myProgressUtils';
import { Card } from './styles';

const BADGE_ART = figmaMyProgressAssetUrl('achievements-badge.png');
const HEX_STAR = figmaMyProgressAssetUrl('hex-star-gold.png');
const BADGE_STAR_SLOTS = 4;

const WidgetShell = styled(Card)`
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 20px 18px 18px;
	text-align: center;
`;

const Title = styled.h2`
	margin: 0 0 16px;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 600;
	font-size: 22px;
	line-height: 1.25;
	color: #442817;
`;

const BadgeArt = styled.img`
	display: block;
	width: min(168px, 78%);
	aspect-ratio: 1;
	object-fit: contain;
	border-radius: 22px;
	margin: 0 auto 14px;
`;

const LevelRow = styled.div`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	margin: 0 0 6px;
`;

const LevelLabel = styled.span`
	font-family: ${theme.fonts.Fredoka};
	font-weight: 600;
	font-size: 18px;
	line-height: 1;
	color: #442817;
`;

const LevelPill = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 36px;
	height: 28px;
	padding: 0 10px;
	border-radius: 999px;
	background: #1ebba3;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 600;
	font-size: 16px;
	line-height: 1;
	color: ${theme.colours.white};
`;

const BadgeName = styled.p`
	margin: 0;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 600;
	font-size: 28px;
	line-height: 1.15;
	color: #442817;
`;

const BadgeCaption = styled.p`
	margin: 4px 0 12px;
	font-family: ${theme.fonts.Nunito};
	font-weight: 600;
	font-size: 13px;
	line-height: 1.3;
	color: #9a9288;
`;

const StarsRow = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	margin-bottom: 16px;
`;

const HexStar = styled.span<{ $filled: boolean }>`
	display: inline-flex;
	width: 28px;
	height: 30px;
	flex-shrink: 0;
	filter: ${({ $filled }) => ($filled ? 'none' : 'grayscale(1) opacity(0.55)')};

	img {
		width: 28px;
		height: 30px;
		object-fit: contain;
		display: block;
	}
`;

const ViewAll = styled.a`
	display: block;
	margin-top: 2px;
	font-family: ${theme.fonts.Nunito};
	font-weight: 800;
	font-size: 12px;
	letter-spacing: 0.04em;
	text-transform: uppercase;
	text-decoration: none;
	color: #408fd1;
	cursor: pointer;
`;

type Props = {
	hero: Pick<MyProgressHero, 'level' | 'level_badge_label'>;
	items: ProfileAchievement[];
	onViewAll?: () => void;
};

export default function MyProgressAchievementsWidget({ hero, items, onViewAll }: Props) {
	const { formatMessage } = useIntl();
	const filledStars = badgeStarsFilled(items, BADGE_STAR_SLOTS);
	const badgeTitle =
		formatHeroBadgeTitle(hero.level_badge_label) ||
		formatMessage({ id: 'my-progress-student-fallback' });

	return (
		<WidgetShell aria-label={formatMessage({ id: 'my-progress-achievements-widget' })}>
			<Title>{formatMessage({ id: 'my-progress-achievements-widget' })}</Title>
			<BadgeArt src={BADGE_ART} alt="" />
			<LevelRow>
				<LevelLabel>{formatMessage({ id: 'dashboard-level' })}</LevelLabel>
				<LevelPill>{hero.level}</LevelPill>
			</LevelRow>
			<BadgeName>{badgeTitle}</BadgeName>
			<BadgeCaption>{formatMessage({ id: 'my-progress-your-current-badge' })}</BadgeCaption>
			<StarsRow
				aria-label={formatMessage(
					{ id: 'my-progress-book-stars' },
					{ filled: filledStars, total: BADGE_STAR_SLOTS }
				)}
			>
				{Array.from({ length: BADGE_STAR_SLOTS }, (_, i) => (
					<HexStar key={i} $filled={i < filledStars}>
						<img src={HEX_STAR} alt="" aria-hidden />
					</HexStar>
				))}
			</StarsRow>
			{onViewAll ? (
				<ViewAll
					href="#my-progress-achievements"
					onClick={(e) => {
						e.preventDefault();
						onViewAll();
					}}
				>
					{formatMessage({ id: 'my-progress-view-all' })}
				</ViewAll>
			) : null}
		</WidgetShell>
	);
}
