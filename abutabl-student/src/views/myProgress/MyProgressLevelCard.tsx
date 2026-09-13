import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import { figmaDashboardAssetUrl } from 'config/figmaAssets';
import type { MyProgressHero as HeroPayload } from 'lib/myProgressApi';
import barFrameGapRaw from 'assets/images/figma/dashboard/bar-frame-gap.svg?raw';
import { clampFillPercent, formatSignedWeeklyXp, weeklyXpTrend } from 'views/dashboard/components/myProgressBarUtils';
import { buildProfileLevelTrackSvg } from 'views/profile/profileUtils';
import { formatHeroXpRatio } from './myProgressUtils';
import {
	AchieverBadgeImg,
	AchieverBadgeWrap,
	AchieverLabel,
	BackLink,
	BadgeName,
	BarFill,
	BarWrap,
	HeroFooter,
	LevelBadge,
	LevelLabel,
	LevelLeft,
	LevelRow,
	LevelsAway,
	PocketCard,
	ProgressFrame,
	WeeklyXpArrow,
	WeeklyXpBlock,
	WeeklyXpLabel,
	WeeklyXpValue,
	XpRatio,
} from './styles';

const STAR_ICON = figmaDashboardAssetUrl('star-6-1.svg');
const ACHIEVER_BADGE = figmaDashboardAssetUrl('achiever-badge.svg');
const FLASH_ICON = figmaDashboardAssetUrl('flash-4.svg');
const PROGRESS_ARROW_UP = figmaDashboardAssetUrl('progress-arrow-up.svg');

type Props = {
	hero: HeroPayload;
};

/**
 * Level / XP track — same pocket + frame layout as profile `CurrentLevelCard`,
 * with My Progress BackLink + weekly XP footer kept as-is.
 */
export default function MyProgressLevelCard({ hero }: Props) {
	const { formatMessage } = useIntl();

	const barFrameSvg = useMemo(
		() => (barFrameGapRaw ? buildProfileLevelTrackSvg(barFrameGapRaw, hero.level) : ''),
		[hero.level]
	);

	const fillPercent = clampFillPercent(hero.track.fill_percent);
	const unlocked = hero.level >= hero.track.achiever_level;
	const xpTrend = weeklyXpTrend(hero.weekly_xp, hero.previous_weekly_xp);

	return (
		<div>
			<BackLink to="/learn">{formatMessage({ id: 'my-progress-back-dashboard' })}</BackLink>

			<PocketCard>
				<ProgressFrame>
					<LevelRow>
						<LevelLeft>
							<LevelLabel>{formatMessage({ id: 'dashboard-level' })}</LevelLabel>
							<LevelBadge>{hero.level}</LevelBadge>
							<BadgeName>
								{formatMessage(
									{ id: 'dashboard-level-badge' },
									{ badge: hero.level_badge_label }
								)}
							</BadgeName>
						</LevelLeft>
						<XpRatio>
							<img src={STAR_ICON} alt="" />
							<span>{formatHeroXpRatio(hero)}</span>
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

			<HeroFooter>
				<LevelsAway>
					<img src={FLASH_ICON} alt="" />
					{hero.levels_away_from_achiever > 0
						? formatMessage(
								{ id: 'dashboard-levels-away' },
								{ count: hero.levels_away_from_achiever }
						  )
						: formatMessage({ id: 'dashboard-achiever-unlocked' })}
				</LevelsAway>
				<WeeklyXpBlock $trend={xpTrend}>
					<WeeklyXpArrow src={PROGRESS_ARROW_UP} alt="" $trend={xpTrend} />
					<WeeklyXpValue $trend={xpTrend}>
						{formatSignedWeeklyXp(hero.weekly_xp, hero.previous_weekly_xp)}
					</WeeklyXpValue>
					<WeeklyXpLabel $trend={xpTrend}>
						{formatMessage({ id: 'dashboard-this-week' })}
					</WeeklyXpLabel>
				</WeeklyXpBlock>
			</HeroFooter>
		</div>
	);
}
