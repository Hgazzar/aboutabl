import { useState } from 'react';
import { useIntl } from 'react-intl';
import { figmaMyProgressAssetUrl } from 'config/figmaAssets';
import {
	HeroArtSpacer,
	HeroBanner,
	HeroContinue,
	HeroCopy,
	HeroCover,
	HeroCoverFallback,
	HeroFill,
	HeroProgressLabel,
	HeroProgressRow,
	HeroTitle,
	HeroTrack,
	HeroUnit,
} from './bookDetailsStyles';
import {
	resolveSubjectHeroTheme,
	subjectHeroBannerUrl,
} from './subjectHeroTheme';

const COVER_FALLBACK = figmaMyProgressAssetUrl('book-cover-boy-bird.svg');

type Props = {
	title: string;
	photo: string | null;
	activeUnitName: string | null;
	/** From my-progress only — omit when null */
	progressPercent: number | null;
	continuePath: string | null;
};

export default function BookHeroBanner({
	title,
	photo,
	activeUnitName,
	progressPercent,
	continuePath,
}: Props) {
	const { formatMessage } = useIntl();
	const [broken, setBroken] = useState(false);
	const theme = resolveSubjectHeroTheme(title);
	const bannerUrl = subjectHeroBannerUrl(theme);
	const themed = theme === 'math' || theme === 'science';
	const cover = photo && !broken ? photo : COVER_FALLBACK;
	const showProgress = progressPercent != null && Number.isFinite(progressPercent);
	const percentRounded = showProgress ? Math.round(progressPercent as number) : 0;

	return (
		<HeroBanner
			data-testid="book-details-hero"
			data-hero-theme={theme}
			$theme={theme}
			$bannerUrl={bannerUrl}
		>
			{themed ? (
				<HeroArtSpacer aria-hidden />
			) : cover ? (
				<HeroCover
					src={cover}
					alt=""
					onError={() => {
						if (photo && !broken) setBroken(true);
					}}
				/>
			) : (
				<HeroCoverFallback aria-hidden />
			)}
			<HeroCopy $theme={theme}>
				<HeroTitle>{title}</HeroTitle>
				{activeUnitName ? (
					<HeroUnit>
						{formatMessage({ id: 'book-details-active-unit' }, { unit: activeUnitName })}
					</HeroUnit>
				) : null}
				{showProgress ? (
					themed ? (
						<HeroProgressRow $theme={theme}>
							<HeroProgressLabel $theme={theme}>
								{formatMessage(
									{ id: 'book-details-overall-progress' },
									{ percent: percentRounded }
								)}
							</HeroProgressLabel>
							<HeroTrack
								$theme={theme}
								aria-label={formatMessage(
									{ id: 'book-details-overall-progress' },
									{ percent: percentRounded }
								)}
							>
								<HeroFill $percent={progressPercent as number} $theme={theme} />
							</HeroTrack>
						</HeroProgressRow>
					) : (
						<>
							<HeroProgressLabel $theme={theme}>
								{formatMessage(
									{ id: 'book-details-overall-progress' },
									{ percent: percentRounded }
								)}
							</HeroProgressLabel>
							<HeroTrack
								$theme={theme}
								aria-label={formatMessage(
									{ id: 'book-details-overall-progress' },
									{ percent: percentRounded }
								)}
							>
								<HeroFill $percent={progressPercent as number} $theme={theme} />
							</HeroTrack>
						</>
					)
				) : null}
				{continuePath ? (
					<HeroContinue to={continuePath} $theme={theme}>
						{formatMessage({ id: 'my-progress-continue-learning' })}
					</HeroContinue>
				) : null}
			</HeroCopy>
		</HeroBanner>
	);
}
