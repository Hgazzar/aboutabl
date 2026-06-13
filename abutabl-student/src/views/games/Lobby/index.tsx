import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { Badge, Button, Flex, Grid, Stack, Text, Title } from '@mantine/core';
import { theme } from 'global-styles';
import { getRequest } from 'lib/requests';
import { CardWrapper } from 'views/learn/styles';
import LoadingPartially from 'components/loading-partially';
import { gameTypeLabel } from '../gameTypeLabel';
import ModuleView from 'components/module-view';
import PageHeader from 'views/learn/component/pageHeader';
import { HeaderWrapper } from 'views/learn/component/header/styles';
import { CardsWrapper } from 'views/learn/styles';
import ArrowBack from 'assets/images/svg/Icon_After.svg?react';

type GameDetail = {
	name?: string;
	type?: string;
	logo?: string;
};

export default function GameLobby() {
	const { gameId } = useParams();
	const navigate = useNavigate();
	const { formatMessage } = useIntl();
	const [game, setGame] = useState<GameDetail | null>(null);
	const [loading, setLoading] = useState(true);

	const load = useCallback(async () => {
		if (!gameId) return;
		setLoading(true);
		try {
			const res: any = await getRequest(`interactive-games/${gameId}`);
			if (res?.status && res.game) {
				setGame({
					name: res.game.name,
					type: res.game.type || 'classic',
					logo: res.game.logo,
				});
			} else {
				setGame(null);
			}
		} catch {
			setGame(null);
		} finally {
			setLoading(false);
		}
	}, [gameId]);

	useEffect(() => {
		load();
	}, [load]);

	const type = game?.type || 'classic';
	const name = game?.name ?? '';

	const startQuestions = () => {
		if (!gameId) return;
		if (type === 'classic') navigate(`/games/${gameId}/play`);
		else if (type === 'hacking') navigate(`/games/${gameId}/hacking/play`);
		else if (type === 'gold_quest') navigate(`/games/${gameId}/gold-quest/play`);
	};

	return (
		<>
			<PageHeader />
			<ModuleView
				header={
					<HeaderWrapper>
						<Grid align="center">
							<Grid.Col span={12}>
								<Flex align="center" justify="space-between" gap="md" wrap="wrap">
									<Flex
										align="center"
										gap={14}
										className="cursor-pointer"
										onClick={() => navigate('/games')}
										style={{ minWidth: 0 }}
										role="button"
										tabIndex={0}
										onKeyDown={(e) => {
											if (e.key === 'Enter' || e.key === ' ') {
												e.preventDefault();
												navigate('/games');
											}
										}}
										aria-label={formatMessage({ id: 'gameLobbyBack' })}
									>
										<Flex
											align="center"
											justify="center"
											className="platinum_shadow"
											style={{
												width: 40,
												height: 40,
												borderRadius: 12,
												flexShrink: 0,
												backgroundColor: theme.colours.white,
											}}
										>
											<ArrowBack />
										</Flex>
										<Flex align="center" gap={10} wrap="wrap" style={{ minWidth: 0 }}>
											<Title order={3} style={{ margin: 0, color: theme.colours.EerieBlack }}>
												{loading ? '…' : name || formatMessage({ id: 'liveGames' })}
											</Title>
											{!loading && name ? (
												<Badge
													variant="light"
													size="md"
													radius="md"
													styles={{
														root: {
															backgroundColor: theme.colours.Lotion,
															color: theme.colours.PaoloVeroneseGreen,
															border: `1px solid ${theme.colours.Platinum}`,
															textTransform: 'none',
														},
													}}
												>
													{gameTypeLabel(type, formatMessage)}
												</Badge>
											) : null}
										</Flex>
									</Flex>
								</Flex>
							</Grid.Col>
						</Grid>
					</HeaderWrapper>
				}
			>
				<CardsWrapper style={{ paddingBottom: 48 }}>
					{loading ? (
				<LoadingPartially />
			) : !game ? (
				<Stack align="center" py={80}>
					<Text fw={600}>{formatMessage({ id: 'gameLobbyLoadError' })}</Text>
					<Button variant="light" onClick={() => navigate('/games')}>
						{formatMessage({ id: 'gameLobbyBack' })}
					</Button>
				</Stack>
			) : (
				<CardWrapper
					style={{
						maxWidth: 560,
						margin: '0 auto',
						display: 'grid',
						gap: 24,
					}}
				>
					{game.logo ? (
						<div
							style={{
								borderRadius: 16,
								padding: 16,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								minHeight: 120,
								background: `linear-gradient(145deg, ${theme.colours.Lotion} 0%, ${theme.colours.AntiFlashWhite} 100%)`,
							}}
						>
							<img src={game.logo} alt="" style={{ maxHeight: 96, maxWidth: '100%', objectFit: 'contain' }} />
						</div>
					) : null}
					<Text size="lg" style={{ color: theme.colours.EerieBlack, lineHeight: 1.5 }}>
						{formatMessage({ id: 'gameLobbyReady' })}
					</Text>
					<Stack spacing="md">
						<Button
							type="button"
							variant="filled"
							fullWidth
							radius="xl"
							size="md"
							className="games-list-play-btn"
							onClick={startQuestions}
							styles={{
								root: {
									fontFamily: theme.fonts.Medium,
									fontWeight: 600,
									border: 'none',
									boxShadow: `0px 4px 0px 0px ${theme.colours.PaoloVeroneseGreen}`,
									'&:hover': {
										backgroundColor: theme.colours.Keppel,
									},
								},
								inner: {
									backgroundColor: theme.colours.LightSeaGreen,
									color: theme.colours.white,
								},
								label: { color: theme.colours.white },
							}}
						>
							{formatMessage({ id: 'gameLobbyStartQuestions' })}
						</Button>
						{(type === 'hacking' || type === 'gold_quest') && (
							<Button
								type="button"
								fullWidth
								radius="xl"
								variant="default"
								onClick={() => navigate(`/games/${gameId}/hacking`)}
								styles={{
									root: {
										fontFamily: theme.fonts.Medium,
										fontWeight: 600,
										border: `2px solid ${theme.colours.Platinum}`,
										backgroundColor: theme.colours.white,
										color: theme.colours.EerieBlack,
										boxShadow: `0px 4px 0px 0px ${theme.colours.Platinum}`,
										'&:hover': {
											backgroundColor: theme.colours.Lotion,
										},
									},
								}}
							>
								{formatMessage({ id: 'gameLobbyHackCoins' })}
							</Button>
						)}
					</Stack>
				</CardWrapper>
			)}
				</CardsWrapper>
			</ModuleView>
		</>
	);
}
