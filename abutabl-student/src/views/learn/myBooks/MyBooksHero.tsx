import { useState } from 'react';
import { useIntl } from 'react-intl';
import { figmaDashboardAssetUrl, figmaMyProgressAssetUrl } from 'config/figmaAssets';
import type { MyProgressBook } from 'lib/myProgressApi';
import {
	bookProgressPercent,
	formatUnitsProgress,
	formatUnitsProgressLabel,
} from 'views/myProgress/myProgressUtils';
import {
	resolveMyBooksContinuePath,
	resolveMyBooksHeroLessonLabel,
	type MyBooksContinueLearning,
} from './myBooksPageState';
import {
	HeroBannerImg,
	HeroBookDescription,
	HeroBookMeta,
	HeroBookRow,
	HeroBookTitle,
	HeroContinueCta,
	HeroContent,
	HeroCopy,
	HeroCover,
	HeroCoverFallback,
	HeroEyebrow,
	HeroProgressBlock,
	HeroProgressFill,
	HeroProgressTrack,
	HeroSection,
	HeroSpeech,
	HeroSubtitle,
	HeroTitle,
	HeroUnitsLabel,
} from './myBooksStyles';

const COVER_FALLBACK = figmaMyProgressAssetUrl('book-cover-boy-bird.svg');
/** Full hero art (beige frame + foliage + bird). Tail hangs onto page green. */
const HERO_BANNER = figmaDashboardAssetUrl('my-books-hero-banner.png');

type Props = {
	heroBook: MyProgressBook | null;
	continueLearning: MyBooksContinueLearning | null | undefined;
	studentName: string;
};

export default function MyBooksHero({ heroBook, continueLearning, studentName }: Props) {
	const { formatMessage } = useIntl();
	const [coverBroken, setCoverBroken] = useState(false);

	const continuePath = resolveMyBooksContinuePath(continueLearning);
	const lessonLabel = resolveMyBooksHeroLessonLabel(continueLearning, heroBook);
	const progress = heroBook ? bookProgressPercent(heroBook) : 0;
	const apiCover = heroBook?.photo?.trim() || null;
	const coverSrc = apiCover && !coverBroken ? apiCover : COVER_FALLBACK;
	const greetingName =
		studentName.trim() || formatMessage({ id: 'my-progress-student-fallback' });

	return (
		<HeroSection data-testid="my-books-hero" aria-labelledby="my-books-hero-title">
			<HeroBannerImg src={HERO_BANNER} alt="" decoding="async" />
			<HeroContent>
				<HeroCopy>
					<HeroEyebrow>{formatMessage({ id: 'my-books-recently-opened' })}</HeroEyebrow>
					<HeroTitle id="my-books-hero-title">
						{formatMessage({ id: 'my-books-continue-journey' })}
					</HeroTitle>
					<HeroSubtitle>
						{lessonLabel
							? formatMessage({ id: 'my-books-on-lesson' }, { lesson: lessonLabel })
							: formatMessage({ id: 'my-books-keep-going' })}
					</HeroSubtitle>

					{heroBook ? (
						<HeroBookRow>
							{coverSrc ? (
								<HeroCover
									src={coverSrc}
									alt=""
									onError={() => {
										if (apiCover && !coverBroken) setCoverBroken(true);
									}}
								/>
							) : (
								<HeroCoverFallback aria-hidden />
							)}
							<HeroBookMeta>
								<HeroBookTitle>{heroBook.title}</HeroBookTitle>
								{heroBook.description ? (
									<HeroBookDescription>{heroBook.description}</HeroBookDescription>
								) : null}
								<HeroProgressBlock>
									<HeroUnitsLabel>
										{formatMessage(
											{ id: 'my-progress-units' },
											{
												progress: formatUnitsProgress(
													heroBook.units_completed,
													heroBook.units_total
												),
											}
										)}
									</HeroUnitsLabel>
									<HeroProgressTrack
										aria-label={formatUnitsProgressLabel(
											heroBook.units_completed,
											heroBook.units_total
										)}
									>
										<HeroProgressFill $percent={progress} />
									</HeroProgressTrack>
									<HeroContinueCta to={continuePath}>
										{formatMessage({ id: 'my-progress-continue-learning' })}
									</HeroContinueCta>
								</HeroProgressBlock>
							</HeroBookMeta>
						</HeroBookRow>
					) : (
						<HeroContinueCta to={continuePath}>
							{formatMessage({ id: 'my-progress-continue-learning' })}
						</HeroContinueCta>
					)}
				</HeroCopy>

				<HeroSpeech aria-hidden>
					{formatMessage({ id: 'my-books-bird-finish' }, { name: greetingName })}
				</HeroSpeech>
			</HeroContent>
		</HeroSection>
	);
}
