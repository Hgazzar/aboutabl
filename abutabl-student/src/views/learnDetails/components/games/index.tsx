import { Grid } from '@mantine/core';

import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import EmptyComp from 'views/Empty';
import { Link, useParams } from 'react-router-dom';
import LoadingPartially from 'components/loading-partially';
import { gamesList } from 'redux-toolkit/reducer/GamesReducer';
import CardItem from '../cardItem/cardItem';

export default function LearnDetailsGames() {
	const dispatch = useDispatch();
	const { id } = useParams();
	const statusGames = useSelector((state: any) => state.GamesReducer);

	useEffect(() => {
		if (!id) return;
		dispatch(gamesList({ id }));
	}, [id, dispatch]);

	const games = statusGames?.gamesListData?.games ?? [];
	const isLoading = statusGames?.loading;

	return (
		<>
			{isLoading ? (
				<LoadingPartially />
			) : !games.length ? (
				<EmptyComp />
			) : (
				<Grid gutter={32}>
					{games.map((item: { [key: string]: string }) => {
						const progressNumber: number = parseFloat(item?.progress);
						return (
							<Grid.Col sm={6} md={4} lg={3} key={item?.id}>
								<Link to={`/learn/${id}/detailsGame/${item?.id}`} target="_blank">
									<CardItem image={item?.background} title={item?.name} progress={progressNumber} />
								</Link>
							</Grid.Col>
						);
					})}
				</Grid>
			)}
		</>
	);
}
