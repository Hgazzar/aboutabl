// import ModuleView from 'components/module-view';
// import { Grid } from '@mantine/core';
// import iol from 'assets/images/png/iol.png';
// import { useRecoilValue } from 'recoil';
// import { langState } from 'store';
// import Header from 'layout/header';
// import { CardsWrapper } from 'views/learn/styles';
import PageHeader from './components/pageHeader';

import TabsComponent from './components/tabs/tabs';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useParams, useSearchParams } from 'react-router-dom';
import { SubjectDetails } from 'redux-toolkit/reducer/SubjectsReducer';
import { todoList } from 'redux-toolkit/reducer/todoReducer';

export default function LearnDetails() {
	/* ------------------------------- Local State ------------------------------ */

	const dispatch = useDispatch();
	const { id } = useParams();
	const [searchParams] = useSearchParams();
	const focusLesson = searchParams.get('focusLesson');
	const focusUnit = searchParams.get('focusUnit');
	const [loading, setLoading] = useState<boolean>(false);

	useEffect(() => {
		dispatch(todoList());
	}, [dispatch]);

	const todoListData = useSelector((state: any) => state.todoReducer);
	const allData = todoListData?.todoListData?.allAssigns?.flatMap((assign: any) => assign.data) || [];

	const info = focusLesson
		? allData?.find(
				(item: any) =>
					String(item?.subject_id) === String(id) &&
					item?.type === 'lessons' &&
					String(item?.type_id) === String(focusLesson)
			) ?? allData?.find((item: any) => String(item?.subject_id) === String(id))
		: focusUnit
			? allData?.find(
					(item: any) =>
						String(item?.subject_id) === String(id) &&
						item?.type === 'units' &&
						String(item?.type_id) === String(focusUnit)
				) ?? allData?.find((item: any) => String(item?.subject_id) === String(id))
			: allData?.find((item: any) => String(item?.subject_id) === String(id));

	const subjectDetails = useSelector((state: any) => state.SubjectsReducer);

	// useEffect(() => {
	// 	(async () => {
	// 		setLoading(true);
	// 		await dispatch(SubjectDetails(id));
	// 		setLoading(false);
	// 	})();
	// }, [dispatch]);

	useEffect(() => {
		if (info) {
			(async () => {
				setLoading(true);
				await dispatch(
					SubjectDetails({
						id,
						type: info.type,
						type_id: info.type_id,
					})
				);
				setLoading(false);
			})();
		}
	}, [dispatch, id, info]);

	return (
		<>
			<PageHeader title={subjectDetails?.subjectDetailsData?.basic_info?.name} route="/learn" />
			<TabsComponent loading={loading} />
		</>
	);
}
