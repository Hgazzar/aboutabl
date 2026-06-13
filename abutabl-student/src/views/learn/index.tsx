import ModuleView from 'components/module-view';
import { Grid } from '@mantine/core';
import iol from 'assets/images/png/iol.png';
import { useRecoilValue } from 'recoil';
import { langState } from 'store';
import Header from './component/header/header';
import CardItem from './component/cardItem';
import PageHeader from './component/pageHeader';
import { CardsWrapper } from './styles';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import { SubjectsList } from 'redux-toolkit/reducer/SubjectsReducer';
import EmptyComp from 'views/Empty';
import { useNavigate } from 'react-router-dom';
import LoadingPartially from 'components/loading-partially';

export default function Learn() {
	/* ------------------------------- Local State ------------------------------ */
	const langType = useRecoilValue(langState);
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const statusSubjects = useSelector((state: any) => state.SubjectsReducer);

	useEffect(() => {
		dispatch(SubjectsList());
	}, [dispatch]);
	const handleDetails = (item: { [key: string]: string }) => {
		navigate(`${item?.id}`)
	}

	return (
		<>

			<PageHeader />
			<ModuleView header={<Header />}>
				<CardsWrapper>
					{statusSubjects?.loading ? <LoadingPartially /> : <>
						{statusSubjects?.subjectsListData?.subjects?.length == 0 ? <><EmptyComp /></> : <Grid gutter={32}>
							{statusSubjects?.subjectsListData?.subjects?.map((item: { [key: string]: string }) => {
								const progressNumber: number = parseFloat(item?.progress);
								return (
									<Grid.Col sm={6} md={4} lg={3} onClick={() => handleDetails(item)} >
										<CardItem
											image={item?.photo}
											title={item?.name}
											units={item?.units}
											lesson={item?.lessons}
											progress={progressNumber}
										/>
									</Grid.Col>
								);
							})}
						</Grid>}
					</>}

				</CardsWrapper>
			</ModuleView>
			{statusSubjects?.subjectsListData?.subjects?.length !== 0 && <div style={{ position: 'relative' }}>
				<img
					className=""
					src={iol}
					alt="logo"
					width={150}
					style={{ position: 'fixed', bottom: '0px', zIndex: 200, [langType === 'en' ? 'right' : 'left']: '75px' }}
				/>
			</div>}

		</>
	);
}
