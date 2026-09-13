import { useState } from 'react';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';
import { figmaMyProgressAssetUrl } from 'config/figmaAssets';
import type { MyProgressBook } from 'lib/myProgressApi';
import {
	bookProgressPercent,
	formatUnitsProgress,
	formatUnitsProgressLabel,
} from 'views/myProgress/myProgressUtils';
import {
	adventureThemeAtIndex,
	subjectOverviewPath,
} from './myBooksPageState';
import {
	AdventureCard,
	AdventureCardTop,
	AdventureCover,
	AdventureCoverFallback,
	AdventureCta,
	AdventureDescription,
	AdventureFill,
	AdventureMeta,
	AdventureProgressBlock,
	AdventureTitle,
	AdventureTrack,
	AdventureUnits,
} from './myBooksStyles';

const COVER_FALLBACK = figmaMyProgressAssetUrl('book-cover-boy-bird.svg');

type Props = {
	book: MyProgressBook;
	index: number;
};

/**
 * Adventure card — navigates to subject overview (`/learn/{id}`),
 * matching existing BooksCatalog card destination (not lesson deep-link).
 */
export default function MyBooksAdventureCard({ book, index }: Props) {
	const { formatMessage } = useIntl();
	const navigate = useNavigate();
	const theme = adventureThemeAtIndex(index);
	const progress = bookProgressPercent(book);
	const overviewPath = subjectOverviewPath(book.subject_id);
	const apiCover = book.photo?.trim() || null;
	const [coverBroken, setCoverBroken] = useState(false);
	const coverSrc = apiCover && !coverBroken ? apiCover : COVER_FALLBACK;

	const openSubject = () => {
		navigate(overviewPath);
	};

	return (
		<AdventureCard
			$theme={theme}
			data-subject-id={book.subject_id}
			role="link"
			tabIndex={0}
			onClick={openSubject}
			onKeyDown={(event) => {
				if (event.key === 'Enter' || event.key === ' ') {
					event.preventDefault();
					openSubject();
				}
			}}
		>
			<AdventureCardTop>
				{coverSrc ? (
					<AdventureCover
						src={coverSrc}
						alt=""
						onError={() => {
							if (apiCover && !coverBroken) setCoverBroken(true);
						}}
					/>
				) : (
					<AdventureCoverFallback aria-hidden />
				)}
				<AdventureMeta>
					<AdventureTitle>{book.title}</AdventureTitle>
					{book.description ? (
						<AdventureDescription>{book.description}</AdventureDescription>
					) : null}
					<AdventureProgressBlock>
						<AdventureUnits>
							{formatMessage(
								{ id: 'my-progress-units' },
								{ progress: formatUnitsProgress(book.units_completed, book.units_total) }
							)}
						</AdventureUnits>
						<AdventureTrack
							aria-label={formatUnitsProgressLabel(
								book.units_completed,
								book.units_total
							)}
						>
							<AdventureFill $percent={progress} $theme={theme} />
						</AdventureTrack>
					</AdventureProgressBlock>
					{/* Label matches Figma; destination preserves subject overview. */}
					<AdventureCta
						to={overviewPath}
						$theme={theme}
						onClick={(event) => {
							event.stopPropagation();
						}}
					>
						{formatMessage({ id: 'my-progress-continue-learning' })}
					</AdventureCta>
				</AdventureMeta>
			</AdventureCardTop>
		</AdventureCard>
	);
}
