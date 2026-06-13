import ModuleView from 'components/module-view';
import { Grid } from '@mantine/core';

import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import EmptyComp from 'views/Empty';
import { Link, useParams } from 'react-router-dom';
import LoadingPartially from 'components/loading-partially';

import CardItem from '../cardItem/cardItem';
import { quizesList } from 'redux-toolkit/reducer/QuizzesReducer';

export default function LearnDetailsQuiz() {
	/* ------------------------------- Local State ------------------------------ */
	const dispatch = useDispatch();

	const { id } = useParams();
	const statusQuizzes = useSelector((state: any) => state.QuizzesReducer);
	const todoListData = useSelector((state: any) => state.todoReducer);
	const allData = todoListData?.todoListData?.allAssigns?.flatMap((assign: any) => assign.data) || [];

	const info = allData?.find((item: any) => item?.subject_id === id);

	// Only fetch when we have assignment info (from todoList)
	useEffect(() => {
		if (!id || !info?.type || info?.type_id == null) return;
		dispatch(quizesList({ id, type: info.type, type_id: info.type_id }));
	}, [id, dispatch, info?.type, info?.type_id]);

	const quizes = statusQuizzes?.quizesListData?.quizes ?? [];
	const isLoading = statusQuizzes?.loading;
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
			) : !quizes.length ? (
				<EmptyComp />
			) : (
				<Grid gutter={32} className="mt-3">
					{quizes.map((item: { [key: string]: string }) => {
								return (
									<Grid.Col sm={6} md={4} lg={3}>
										<Link to={`/learn/${id}/quiz/${item?.id}`} target="_blank">
											<CardItem title={item?.title} />
										</Link>
									</Grid.Col>
								);
					})}
				</Grid>
			)}
		</>
	);
}
