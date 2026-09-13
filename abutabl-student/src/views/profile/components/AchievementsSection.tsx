import { useIntl } from 'react-intl';
import styled from 'styled-components';
import { theme } from 'global-styles';
import type { ProfileAchievement } from '../types';
import { resolveAchievementIconUrl } from '../profileUtils';
import { EmptyState, PocketCard } from './profileLayout';

const Section = styled.section`
	display: flex;
	flex-direction: column;
	gap: 14px;
	width: 100%;
`;

const Title = styled.h2`
	margin: 0;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 500;
	font-size: 22px;
	line-height: 1.35;
	color: #1f1e1e;
`;

const List = styled.ul`
	list-style: none;
	margin: 0;
	padding: 0;
	display: flex;
	flex-direction: column;
	gap: 20px;
`;

const Row = styled.li`
	display: flex;
	align-items: center;
	gap: 16px;
	min-width: 0;
`;

const BadgeIcon = styled.img<{ $earned: boolean }>`
	width: 72px;
	height: 72px;
	flex-shrink: 0;
	object-fit: contain;
	border-radius: 16px;
	opacity: ${({ $earned }) => ($earned ? 1 : 0.88)};
	filter: ${({ $earned }) => ($earned ? 'none' : 'grayscale(0.2)')};
`;

const RowBody = styled.div`
	flex: 1 1 auto;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 8px;
`;

const RowTitle = styled.span`
	font-family: ${theme.fonts.Nunito};
	font-weight: 800;
	font-size: 16px;
	line-height: 1.3;
	color: #1f1e1e;
`;

const ProgressTrack = styled.div`
	width: 100%;
	height: 10px;
	border-radius: 999px;
	background: #ebe7e1;
	overflow: hidden;
`;

const ProgressFill = styled.div<{ $percent: number }>`
	height: 100%;
	width: ${({ $percent }) => Math.max(0, Math.min(100, $percent))}%;
	border-radius: 999px;
	background: #f5c518;
`;

const RowDescription = styled.span`
	font-family: ${theme.fonts.Nunito};
	font-weight: 600;
	font-size: 14px;
	line-height: 1.35;
	color: #9a9288;
`;

type Props = {
	items?: ProfileAchievement[];
	loading?: boolean;
	error?: string | null;
};

export default function AchievementsSection({ items = [], loading = false, error = null }: Props) {
	const { formatMessage } = useIntl();

	return (
		<Section>
			<Title>{formatMessage({ id: 'profile-achievements' })}</Title>
			<PocketCard>
				{loading ? (
					<EmptyState>{formatMessage({ id: 'profile-achievements-loading' })}</EmptyState>
				) : error ? (
					<EmptyState role="alert">{error}</EmptyState>
				) : items.length === 0 ? (
					<EmptyState>{formatMessage({ id: 'profile-achievements-empty' })}</EmptyState>
				) : (
					<List>
						{items.map((item) => (
							<Row key={item.key} data-earned={item.earned ? 'true' : 'false'}>
								<BadgeIcon
									src={resolveAchievementIconUrl(item.icon)}
									alt=""
									$earned={item.earned}
								/>
								<RowBody>
									<RowTitle>{item.title}</RowTitle>
									<ProgressTrack aria-hidden="true">
										<ProgressFill $percent={item.progress} data-progress={item.progress} />
									</ProgressTrack>
									<RowDescription>{item.description}</RowDescription>
								</RowBody>
							</Row>
						))}
					</List>
				)}
			</PocketCard>
		</Section>
	);
}
