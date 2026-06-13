import ModuleView from 'components/module-view';
import { Grid } from '@mantine/core';
import iol from 'assets/images/png/iol.png';
import { useRecoilValue } from 'recoil';
import { langState } from 'store';

import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import { SubjectsList } from 'redux-toolkit/reducer/SubjectsReducer';
import EmptyComp from 'views/Empty';
import { Link, useNavigate, useParams } from 'react-router-dom';
import LoadingPartially from 'components/loading-partially';
import { gamesList } from 'redux-toolkit/reducer/GamesReducer';
import CardItem from '../cardItem/cardItem';
import { todoList } from 'redux-toolkit/reducer/todoReducer';

export default function LearnDetailsGames() {
	/* ------------------------------- Local State ------------------------------ */
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const { id } = useParams();
	const statusGames = useSelector((state: any) => state.GamesReducer);

	// useEffect(() => {
	// 	dispatch(todoList());
	// }, []);

	const todoListData = useSelector((state: any) => state.todoReducer);
	const allData = todoListData?.todoListData?.allAssigns?.flatMap((assign: any) => assign.data) || [];

	const info = allData?.find((item: any) => item?.subject_id === id);

	// Only fetch when we have assignment info (from todoList)
	useEffect(() => {
		if (!id || !info?.type || info?.type_id == null) return;
		dispatch(gamesList({ id, type: info.type, type_id: info.type_id }));
	}, [id, dispatch, info?.type, info?.type_id]);

	const games = statusGames?.gamesListData?.games ?? [];
	const isLoading = statusGames?.loading;
	const hasNoInfo = todoListData?.todoListData && !info;
	const waitingForInfo = !todoListData?.todoListData || !info;

	return (
		<>
			{hasNoInfo ? (
				<EmptyComp />
			) : waitingForInfo ? (
				<LoadingPartially />
			) : isLoading ? (
				<LoadingPartially />
			) : !games.length ? (
				<EmptyComp />
			) : (
				<Grid gutter={32}>
					{games.map((item: { [key: string]: string }) => {
								const progressNumber: number = parseFloat(item?.progress);
								return (
									<Grid.Col sm={6} md={4} lg={3}>
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
