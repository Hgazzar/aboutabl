import { useIntl } from 'react-intl';
import type { TimelineActivity } from './bookDetailsTypes';
import {
	TimelineCard,
	TimelineCta,
	TimelineCtaExternal,
	TimelineDot,
	TimelineIcon,
	TimelineItem,
	TimelineKind,
	TimelineList,
	TimelineMeta,
	TimelineTitle,
} from './bookDetailsStyles';

const THEMES = [
	{ bg: '#FFF4D6', tone: '#F59E0B' },
	{ bg: '#E6F7F4', tone: '#1EBBA3' },
	{ bg: '#F3F4F6', tone: '#9CA3AF' },
	{ bg: '#EFE8FF', tone: '#7B6CF6' },
];

function kindLabel(
	kind: TimelineActivity['kind'],
	formatMessage: (desc: { id: string }) => string
): string {
	switch (kind) {
		case 'lesson_content':
			return formatMessage({ id: 'book-details-kind-lesson' });
		case 'quiz':
			return formatMessage({ id: 'book-details-kind-quiz' });
		case 'worksheet':
			return formatMessage({ id: 'book-details-kind-worksheet' });
		case 'game':
			return formatMessage({ id: 'book-details-kind-game' });
		default:
			return '';
	}
}

function kindGlyph(kind: TimelineActivity['kind']): string {
	switch (kind) {
		case 'lesson_content':
			return '📘';
		case 'quiz':
			return '?';
		case 'worksheet':
			return '✎';
		case 'game':
			return '◆';
		default:
			return '•';
	}
}

type Props = {
	activities: TimelineActivity[];
};

export default function ActivityTimelineList({ activities }: Props) {
	const { formatMessage } = useIntl();

	if (!activities.length) {
		return <p>{formatMessage({ id: 'book-details-activities-empty' })}</p>;
	}

	return (
		<TimelineList data-testid="book-details-timeline">
			{activities.map((activity) => {
				const theme = THEMES[activity.themeIndex % THEMES.length] ?? THEMES[0];
				const ctaLabel = formatMessage({ id: 'book-details-continue' });
				return (
					<TimelineItem key={activity.key}>
						<TimelineDot $tone={theme.tone} aria-hidden />
						<TimelineCard $bg={theme.bg}>
							<TimelineMeta>
								<TimelineIcon aria-hidden>{kindGlyph(activity.kind)}</TimelineIcon>
								<div>
									<TimelineTitle>{activity.title}</TimelineTitle>
									<TimelineKind>{kindLabel(activity.kind, formatMessage)}</TimelineKind>
								</div>
							</TimelineMeta>
							{activity.external ? (
								<TimelineCtaExternal
									href={activity.href}
									target="_blank"
									rel="noopener noreferrer"
								>
									{ctaLabel}
								</TimelineCtaExternal>
							) : (
								<TimelineCta to={activity.href}>{ctaLabel}</TimelineCta>
							)}
						</TimelineCard>
					</TimelineItem>
				);
			})}
		</TimelineList>
	);
}
