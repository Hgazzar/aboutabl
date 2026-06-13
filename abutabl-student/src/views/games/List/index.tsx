import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { Button, Flex, Grid, Text, Badge, Stack } from '@mantine/core';
import { useRecoilValue } from 'recoil';
import { langState } from 'store';
import { theme } from 'global-styles';
import { getRequest } from 'lib/requests';
import { gameTypeLabel } from '../gameTypeLabel';
import { CardWrapper, Title } from 'views/learn/styles';
import LoadingPartially from 'components/loading-partially';
import ModuleView from 'components/module-view';
import PageHeader from 'views/learn/component/pageHeader';
import { HeaderWrapper } from 'views/learn/component/header/styles';
import { CardsWrapper } from 'views/learn/styles';
import iol from 'assets/images/png/iol.png';

type Game = {
	id: number;
	name: string;
	logo?: string;
	type: string;
};

export default function GamesList() {
	const navigate = useNavigate();
	const { formatMessage } = useIntl();
	const langType = useRecoilValue(langState);
	const [games, setGames] = useState<Game[]>([]);
	const [loading, setLoading] = useState(true);

	const loadGames = useCallback(async () => {
		setLoading(true);
		try {
			const res: any = await getRequest('interactive-games');
			if (res?.status && Array.isArray(res.games)) {
				setGames(res.games);
			} else {
				setGames([]);
			}
		} catch {
			setGames([]);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadGames();
	}, [loadGames]);

	const goPlay = (g: Game) => {
		if (g.type === 'hacking') {
			navigate(`/games/${g.id}/hacking/password`);
		} else if (g.type === 'gold_quest') {
			navigate(`/games/${g.id}/gold-quest/password`);
		} else {
			navigate(`/games/${g.id}/lobby`);
		}
	};

	return (
		<>
			<PageHeader />
			<ModuleView
				header={
					<HeaderWrapper>
						<Grid align="center">
							<Grid.Col xs={12} md={8}>
								<Flex direction="column" gap={6}>
									<Flex align="center" gap={16} className="courses_info" wrap="wrap">
										<h3>{formatMessage({ id: 'liveGames' })}</h3>
										<span className="count">{games.length}</span>
									</Flex>
									<Text size="sm" c="dimmed" maw={520}>
										{formatMessage({ id: 'liveGamesSubtitle' })}
									</Text>
								</Flex>
							</Grid.Col>
						</Grid>
					</HeaderWrapper>
				}
			>
				<CardsWrapper
					style={
						!loading && games.length > 0
							? {
									paddingBottom: 160,
								}
							: undefined
					}
				>
					{loading ? (
						<LoadingPartially />
					) : games.length === 0 ? (
						<Stack align="center" justify="center" py={100} spacing="md">
							<Text size="lg" fw={600} c={theme.colours.EerieBlack}>
								{formatMessage({ id: 'liveGamesEmpty' })}
							</Text>
						</Stack>
					) : (
						<Grid gutter={32} align="stretch">
							{games.map((g) => (
								<Grid.Col key={g.id} sm={6} md={6} lg={4} style={{ display: 'flex' }}>
									<CardWrapper
										style={{
											flex: 1,
											width: '100%',
											display: 'grid',
											gridTemplateRows: 'auto minmax(0, 1fr) auto',
											gap: 16,
											minHeight: 360,
											overflow: 'hidden',
										}}
									>
										<div
											style={{
												height: 132,
												boxSizing: 'border-box',
												padding: 12,
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												background: `linear-gradient(145deg, ${theme.colours.Lotion} 0%, ${theme.colours.AntiFlashWhite} 100%)`,
												borderRadius: 12,
											}}
										>
											{g.logo ? (
												<img
													src={g.logo}
													alt=""
													style={{ maxHeight: 96, maxWidth: '92%', objectFit: 'contain' }}
												/>
											) : (
												<Text size="xl" fw={700} c={theme.colours.LightSeaGreen} style={{ fontFamily: theme.fonts.Bold }}>
													{g.name?.charAt(0)?.toUpperCase() ?? '?'}
												</Text>
											)}
										</div>
										<div
											style={{
												minHeight: 0,
												overflow: 'hidden',
												display: 'flex',
												flexDirection: 'column',
												gap: 8,
											}}
										>
											<Title className="title line-clamp-2 break-words text-left w-full" style={{ margin: 0 }}>
												{g.name}
											</Title>
											<Badge
												variant="light"
												color="teal"
												size="sm"
												radius="md"
												styles={{
													root: {
														backgroundColor: theme.colours.Lotion,
														color: theme.colours.PaoloVeroneseGreen,
														border: `1px solid ${theme.colours.Platinum}`,
														width: 'fit-content',
														textTransform: 'none',
													},
												}}
											>
												{gameTypeLabel(g.type, formatMessage)}
											</Badge>
										</div>
										<Button
											type="button"
											variant="filled"
											fullWidth
											radius="xl"
											onClick={() => goPlay(g)}
											className="games-list-play-btn"
											styles={{
												root: {
													position: 'relative',
													zIndex: 210,
													flexShrink: 0,
													backgroundColor: theme.colours.LightSeaGreen,
													color: theme.colours.white,
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
												label: {
													color: theme.colours.white,
												},
											}}
										>
											{formatMessage({ id: 'liveGamesPlay' })}
										</Button>
									</CardWrapper>
								</Grid.Col>
							))}
						</Grid>
					)}
				</CardsWrapper>
			</ModuleView>
			{!loading && games.length > 0 ? (
				<div style={{ position: 'relative' }}>
					<img
						src={iol}
						alt=""
						width={150}
						style={{
							position: 'fixed',
							bottom: 0,
							zIndex: 200,
							[langType === 'en' ? 'right' : 'left']: '75px',
						}}
					/>
				</div>
			) : null}
		</>
	);
}
