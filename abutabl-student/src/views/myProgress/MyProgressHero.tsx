import { useIntl } from 'react-intl';
import { figmaMyProgressAssetUrl } from 'config/figmaAssets';
import type { MyProgressHero as HeroPayload } from 'lib/myProgressApi';
import {
	ProgressHero,
	ProgressHeroArtWrap,
	ProgressHeroBird,
	ProgressHeroCopy,
	ProgressHeroPageLabel,
	ProgressHeroSpark,
	ProgressHeroSubtitle,
	ProgressHeroTitle,
	ProgressHeroTitleLine,
} from './styles';

const HERO_BIRD = figmaMyProgressAssetUrl('hero-bird-cheer.png');
const HERO_SPARK = figmaMyProgressAssetUrl('hero-spark.png');

type Props = {
	hero: HeroPayload;
};

/** Teal hero — same shell pattern as /leaderboard, Progress copy + cheer bird. */
export default function MyProgressHero({ hero }: Props) {
	const { formatMessage } = useIntl();
	const greetingName = hero.name.trim() || formatMessage({ id: 'my-progress-student-fallback' });

	return (
		<ProgressHero>
			<ProgressHeroCopy>
				<ProgressHeroTitle>
					<ProgressHeroTitleLine>
						{formatMessage({ id: 'my-progress-keep-going-line-1' })}
					</ProgressHeroTitleLine>
					<ProgressHeroTitleLine>{greetingName}</ProgressHeroTitleLine>
				</ProgressHeroTitle>
				<ProgressHeroSubtitle>
					{formatMessage({ id: 'my-progress-hero-subtitle' })}
				</ProgressHeroSubtitle>
				<ProgressHeroPageLabel>
					{formatMessage({ id: 'my-progress-page-title' })}
				</ProgressHeroPageLabel>
			</ProgressHeroCopy>
			<ProgressHeroArtWrap aria-hidden>
				<ProgressHeroSpark src={HERO_SPARK} alt="" />
				<ProgressHeroBird src={HERO_BIRD} alt="" />
			</ProgressHeroArtWrap>
		</ProgressHero>
	);
}
