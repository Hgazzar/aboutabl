import { Grid } from '@mantine/core';

import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import EmptyComp from 'views/Empty';
import { Link, useParams } from 'react-router-dom';
import LoadingPartially from 'components/loading-partially';

import CardItem from '../cardItem/cardItem';
import { quizesList } from 'redux-toolkit/reducer/QuizzesReducer';

export default function LearnDetailsQuiz() {
	const dispatch = useDispatch();

	const { id } = useParams();
	const statusQuizzes = useSelector((state: any) => state.QuizzesReducer);

	useEffect(() => {
		if (!id) return;
		dispatch(quizesList({ id }));
	}, [id, dispatch]);

	const quizes = statusQuizzes?.quizesListData?.quizes ?? [];
	const isLoading = statusQuizzes?.loading;

	return (
		<>
			{isLoading ? (
				<LoadingPartially />
			) : !quizes.length ? (
				<EmptyComp />
			) : (
				<Grid gutter={32} className="mt-3">
					{quizes.map((item: { [key: string]: string }) => {
						return (
							<Grid.Col sm={6} md={4} lg={3} key={item?.id}>
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
