import { useIntl } from 'react-intl';
import type { ProfileAchievement } from 'views/profile/types';
import { resolveAchievementIconUrl } from 'views/profile/profileUtils';
import {
	AchievementBody,
	AchievementDescription,
	AchievementFill,
	AchievementIcon,
	AchievementRow,
	AchievementsList,
	AchievementTitle,
	AchievementTrack,
	Card,
	EmptyHint,
	Section,
	SectionTitle,
} from './styles';

type Props = {
	items: ProfileAchievement[];
};

export default function MyAchievementsSection({ items }: Props) {
	const { formatMessage } = useIntl();

	return (
		<Section>
			<SectionTitle>{formatMessage({ id: 'profile-achievements' })}</SectionTitle>
			<Card>
				{items.length === 0 ? (
					<EmptyHint>{formatMessage({ id: 'profile-achievements-empty' })}</EmptyHint>
				) : (
					<AchievementsList>
						{items.map((item) => (
							<AchievementRow key={item.key} data-earned={item.earned ? 'true' : 'false'}>
								<AchievementIcon
									src={resolveAchievementIconUrl(item.icon)}
									alt=""
									$earned={item.earned}
								/>
								<AchievementBody>
									<AchievementTitle>{item.title}</AchievementTitle>
									<AchievementTrack aria-hidden>
										<AchievementFill $percent={item.progress} />
									</AchievementTrack>
									<AchievementDescription>{item.description}</AchievementDescription>
								</AchievementBody>
							</AchievementRow>
						))}
					</AchievementsList>
				)}
			</Card>
		</Section>
	);
}
