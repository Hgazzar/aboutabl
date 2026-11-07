import { useIntl } from 'react-intl';
import { figmaLiveGamesAssetUrl, figmaMyProgressAssetUrl } from 'config/figmaAssets';
import {
	LiveGamesHero,
	LiveGamesHeroArtWrap,
	LiveGamesHeroBird,
	LiveGamesHeroCopy,
	LiveGamesHeroPageLabel,
	LiveGamesHeroSpark,
	LiveGamesHeroSubtitle,
	LiveGamesHeroTitle,
	LiveGamesHeroTitleLine,
} from './liveCompetitionsStudentStyles';

const HERO_BIRD_CHEER = figmaMyProgressAssetUrl('hero-bird-cheer.png');
const HERO_BIRD_GAMER = figmaLiveGamesAssetUrl('hero-bird-gamer.png');
const HERO_SPARK = figmaMyProgressAssetUrl('hero-spark.png');

export type LiveGamesHeroBirdVariant = 'cheer' | 'gamer';

type Props = {
	pageTitle: string;
	subtitle?: string;
	/** Session join/play uses the gamer bird; list keeps the cheer bird. */
	bird?: LiveGamesHeroBirdVariant;
};

/** Same teal hero language as /progress and /leaderboard. */
export default function LiveGamesHeroSection({
	pageTitle,
	subtitle,
	bird = 'cheer',
}: Props) {
	const { formatMessage } = useIntl();
	const birdSrc = bird === 'gamer' ? HERO_BIRD_GAMER : HERO_BIRD_CHEER;

	return (
		<LiveGamesHero aria-label={pageTitle} data-testid="live-games-hero">
			<LiveGamesHeroCopy>
				<LiveGamesHeroTitle>
					<LiveGamesHeroTitleLine>
						{formatMessage({ id: 'myLiveGamesHeroLine1' })}
					</LiveGamesHeroTitleLine>
					<LiveGamesHeroTitleLine>
						{formatMessage({ id: 'myLiveGamesHeroLine2' })}
					</LiveGamesHeroTitleLine>
				</LiveGamesHeroTitle>
				{subtitle ? <LiveGamesHeroSubtitle>{subtitle}</LiveGamesHeroSubtitle> : null}
				<LiveGamesHeroPageLabel>{pageTitle}</LiveGamesHeroPageLabel>
			</LiveGamesHeroCopy>
			<LiveGamesHeroArtWrap aria-hidden>
				<LiveGamesHeroSpark src={HERO_SPARK} alt="" />
				<LiveGamesHeroBird
					src={birdSrc}
					alt=""
					data-testid={bird === 'gamer' ? 'live-games-hero-bird-gamer' : 'live-games-hero-bird-cheer'}
				/>
			</LiveGamesHeroArtWrap>
		</LiveGamesHero>
	);
}
