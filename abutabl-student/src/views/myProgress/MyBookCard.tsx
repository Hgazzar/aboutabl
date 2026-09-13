import { useIntl } from 'react-intl';
import { useState } from 'react';
import { figmaMyProgressAssetUrl } from 'config/figmaAssets';
import type { MyProgressBook } from 'lib/myProgressApi';
import MyNextGoal from './MyNextGoal';
import {
	bookProgressPercent,
	bookStarsFilled,
	bookThemeAtIndex,
	formatAccuracyValue,
	formatActivitiesValue,
	formatUnitsProgress,
	formatUnitsProgressLabel,
	formatWeeklyXpValue,
	shouldShowAccuracy,
	shouldShowActivities,
	type BookCardTheme,
} from './myProgressUtils';
import {
	BookCard,
	BookCover,
	BookCoverFallback,
	BookDescription,
	BookHeader,
	BookHeaderFrame,
	BookMeta,
	BookTitle,
	HexStar,
	MetricChip,
	MetricsRow,
	ProgressLabel,
	ProgressPanel,
	ProgressRow,
	StarsRow,
	UnitsFill,
	UnitsLabel,
	UnitsTrack,
} from './styles';

const HEADER_FRAME = figmaMyProgressAssetUrl('book-header-frame.png');
const CREAM_HEADER_FRAME = figmaMyProgressAssetUrl('cream-book-header-frame.png');
const MINT_HEADER_FRAME = figmaMyProgressAssetUrl('mint-header-parchment.png');
const COVER_FALLBACK = figmaMyProgressAssetUrl('book-cover-boy-bird.svg');
const HEX_STAR_GOLD = figmaMyProgressAssetUrl('hex-star-gold.png');
const XP_BOLT_LAVENDER = figmaMyProgressAssetUrl('xp-bolt-badge.png');
const ACTIVITIES_SHIELD_LAVENDER = figmaMyProgressAssetUrl('activities-shield-badge.png');
const XP_BOLT_CREAM = figmaMyProgressAssetUrl('cream-xp-bolt.svg');
const ACTIVITIES_SHIELD_CREAM = figmaMyProgressAssetUrl('cream-activities-shield.svg');
const ACCURACY_TARGET_CREAM = figmaMyProgressAssetUrl('cream-accuracy-target.svg');
const XP_BOLT_MINT = figmaMyProgressAssetUrl('mint-xp-bolt.svg');
const ACTIVITIES_SHIELD_MINT = figmaMyProgressAssetUrl('mint-activities-shield.svg');
const ACCURACY_TARGET_MINT = figmaMyProgressAssetUrl('mint-accuracy-target.svg');
const BOOK_STAR_SLOTS = 4;

function AccuracyIcon() {
	return (
		<svg viewBox="0 0 20 20" aria-hidden fill="none">
			<circle cx="10" cy="10" r="8" stroke="#fff" strokeWidth="2" />
			<circle cx="10" cy="10" r="4" stroke="#fff" strokeWidth="2" />
			<circle cx="10" cy="10" r="1.5" fill="#fff" />
		</svg>
	);
}

function metricAssets(theme: BookCardTheme) {
	if (theme === 'cream') {
		return {
			xpBolt: XP_BOLT_CREAM,
			activitiesShield: ACTIVITIES_SHIELD_CREAM,
			accuracyBadge: ACCURACY_TARGET_CREAM,
		};
	}
	if (theme === 'mint') {
		return {
			xpBolt: XP_BOLT_MINT,
			activitiesShield: ACTIVITIES_SHIELD_MINT,
			accuracyBadge: ACCURACY_TARGET_MINT,
		};
	}
	return {
		xpBolt: XP_BOLT_LAVENDER,
		activitiesShield: ACTIVITIES_SHIELD_LAVENDER,
		accuracyBadge: null as string | null,
	};
}

type Props = {
	book: MyProgressBook;
	index: number;
};

export default function MyBookCard({ book, index }: Props) {
	const { formatMessage } = useIntl();
	const theme: BookCardTheme = bookThemeAtIndex(index);
	const progress = bookProgressPercent(book);
	const filledStars = bookStarsFilled(book, BOOK_STAR_SLOTS);
	const showAccuracy = shouldShowAccuracy(book);
	const showActivities = shouldShowActivities(book);
	const apiCover = book.photo?.trim() || null;
	const [coverBroken, setCoverBroken] = useState(false);
	const coverSrc = apiCover && !coverBroken ? apiCover : COVER_FALLBACK;
	const icons = metricAssets(theme);

	return (
		<BookCard $theme={theme} data-subject-id={book.subject_id}>
			<BookHeader $theme={theme}>
				{theme === 'lavender' ? (
					<BookHeaderFrame src={HEADER_FRAME} alt="" aria-hidden />
				) : null}
				{theme === 'cream' ? (
					<BookHeaderFrame src={CREAM_HEADER_FRAME} $opacity={0.75} alt="" aria-hidden />
				) : null}
				{theme === 'mint' ? (
					<BookHeaderFrame src={MINT_HEADER_FRAME} $opacity={0.75} alt="" aria-hidden />
				) : null}
				{coverSrc ? (
					<BookCover
						src={coverSrc}
						alt=""
						onError={() => {
							if (apiCover && !coverBroken) setCoverBroken(true);
						}}
					/>
				) : (
					<BookCoverFallback aria-hidden />
				)}
				<BookMeta>
					<BookTitle $theme={theme}>{book.title}</BookTitle>
					{book.description ? (
						<BookDescription $theme={theme}>{book.description}</BookDescription>
					) : null}
				</BookMeta>
				{book.stars.decorative ? (
					<StarsRow
						aria-label={formatMessage(
							{ id: 'my-progress-book-stars' },
							{ filled: filledStars, total: BOOK_STAR_SLOTS }
						)}
					>
						{Array.from({ length: BOOK_STAR_SLOTS }, (_, i) => (
							<HexStar key={i} $filled={i < filledStars}>
								<img src={HEX_STAR_GOLD} alt="" aria-hidden />
							</HexStar>
						))}
					</StarsRow>
				) : null}
			</BookHeader>

			<ProgressPanel $theme={theme}>
				<ProgressRow>
					<ProgressLabel>{formatMessage({ id: 'my-progress-book-progress' })}</ProgressLabel>
					<UnitsLabel $theme={theme}>
						{formatMessage(
							{ id: 'my-progress-units' },
							{ progress: formatUnitsProgress(book.units_completed, book.units_total) }
						)}
					</UnitsLabel>
				</ProgressRow>
				<UnitsTrack
					aria-label={formatUnitsProgressLabel(book.units_completed, book.units_total)}
				>
					<UnitsFill $percent={progress} $theme={theme} />
				</UnitsTrack>
			</ProgressPanel>

			<MetricsRow>
				<MetricChip $theme={theme} data-metric="weekly-xp">
					<div className="top">
						<img className="icon-badge" src={icons.xpBolt} alt="" aria-hidden />
						<span className="value">{formatWeeklyXpValue(book.xp_this_week)}</span>
					</div>
					<span className="divider" aria-hidden />
					<span className="label">{formatMessage({ id: 'my-progress-xp-this-week-label' })}</span>
				</MetricChip>
				{showActivities && book.activities_completed != null ? (
					<MetricChip $theme={theme} data-metric="activities">
						<div className="top">
							<img className="icon-badge" src={icons.activitiesShield} alt="" aria-hidden />
							<span className="value">
								{formatActivitiesValue(book.activities_completed)}
							</span>
						</div>
						<span className="divider" aria-hidden />
						<span className="label">
							{formatMessage({ id: 'my-progress-activities-label' })}
						</span>
					</MetricChip>
				) : null}
				{showAccuracy && book.accuracy_percent != null ? (
					<MetricChip $theme={theme} data-metric="accuracy">
						<div className="top">
							{icons.accuracyBadge ? (
								<img className="icon-badge" src={icons.accuracyBadge} alt="" aria-hidden />
							) : (
								<span className="icon" aria-hidden>
									<AccuracyIcon />
								</span>
							)}
							<span className="value">{formatAccuracyValue(book.accuracy_percent)}</span>
						</div>
						<span className="divider" aria-hidden />
						<span className="label">{formatMessage({ id: 'my-progress-accuracy-label' })}</span>
					</MetricChip>
				) : null}
			</MetricsRow>

			<MyNextGoal nextGoal={book.next_goal} theme={theme} />
		</BookCard>
	);
}
