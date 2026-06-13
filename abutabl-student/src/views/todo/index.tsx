import { Box, Flex, Text, Button } from '@mantine/core';
import ModuleView from 'components/module-view';
import { useEffect } from 'react';
import PageHeader from 'views/learn/component/pageHeader';
import Assign from 'assets/images/svg/assign.svg?react';
import Man from 'assets/images/svg/man.svg';

import { useDispatch, useSelector } from 'react-redux';
import { markTodoAssignOpened, todoList } from 'redux-toolkit/reducer/todoReducer';
import { useNavigate } from 'react-router-dom';

const ASSIGNMENT_TYPE_LABELS: Record<string, string> = {
	subjects: 'Subject',
	units: 'Unit',
	lessons: 'Lesson',
	lessons_contents: 'Lesson content',
	quizes: 'Quiz',
	games: 'Game',
	worksheets: 'Worksheet',
	assigments: 'Assignment',
};

function assignmentNavigatePath(item: {
	type: string;
	subject_id: string;
	type_id?: string;
	path?: string;
}): string | null {
	const sid = item.subject_id;
	if (!sid) return null;
	switch (item.type) {
		case 'subjects':
			return `/learn/${sid}`;
		case 'units':
			return item.type_id != null && String(item.type_id) !== ''
				? `/learn/${sid}?focusUnit=${encodeURIComponent(String(item.type_id))}`
				: `/learn/${sid}`;
		case 'lessons':
			return item.type_id != null && String(item.type_id) !== ''
				? `/learn/${sid}?focusLesson=${encodeURIComponent(String(item.type_id))}`
				: `/learn/${sid}`;
		case 'lessons_contents':
			return item.type_id ? `/learn/${sid}/details/${item.type_id}` : `/learn/${sid}`;
		case 'quizes':
			return item.type_id ? `/learn/${sid}/quiz/${item.type_id}` : `/learn/${sid}`;
		case 'games':
			return item.type_id ? `/learn/${sid}/detailsGame/${item.type_id}` : `/learn/${sid}`;
		case 'worksheets':
		case 'assigments':
			return `/learn/${sid}`;
		default:
			if (item.path && item.path.startsWith('/')) return item.path;
			return `/learn/${sid}`;
	}
}
import EmptyComp from 'views/Empty';
import LoadingPartially from 'components/loading-partially';
import { CardsWrapper } from 'views/learn/styles';
import Header from './header/header';

export default function Todo() {
	const todoListData = useSelector((state: any) => state.todoReducer);
	const dispatch = useDispatch();
	const navigate = useNavigate();
	useEffect(() => {
		dispatch(todoList());
	}, []);

	return (
		<>
			<PageHeader />

			<ModuleView header={<Header />}>
				<>
					{todoListData?.loading && (
						<CardsWrapper>
							<LoadingPartially />
						</CardsWrapper>
					)}
					{todoListData?.todoListData?.allAssigns?.length == 0 ? (
						<EmptyComp />
					) : (
						<>
							{' '}
							{todoListData?.todoListData?.allAssigns?.map((item: { data: []; date: string }) => {
								return (
									<>
										{item?.data?.length !== 0 && (
											<Flex className="align-center flex-wrap ">
												<Text className="mb-3 font-bold">{item?.date}</Text>
												{item?.data?.map(
													(item: {
														assign_id?: number;
														by: string;
														status: string;
														subject_name: string;
														course_name?: string | null;
														assignment_title?: string | null;
														type: string;
														type_id?: string;
														date: string;
														due_date?: string | null;
														path: string;
														subject_id: string;
														unit_id: string;
													}) => {
														return (
															<Box className="border border-Platinum rounded-xl w-[100%] p-5 flex  justify-between mb-5">
																<Flex>
																	<Box className="bg-Cultured p-10 rounded-xl">
																		{item?.status === 'New' ? (
																			<Text className="bg-New absolute top-3 right-3 text-sm px-3 text-TextNew">
																				New
																			</Text>
																		) : null}
																		<Assign />
																	</Box>
																	<Box className="mx-5 gap-4 flex flex-col ">
																		<Box>
																			<Text className="text-LightSeaGreen">
																				{ASSIGNMENT_TYPE_LABELS[item?.type] ?? item?.type?.replace(/_/g, ' ')}
																			</Text>
																			<Text>
																				{item?.assignment_title ?? item?.subject_name}
																			</Text>
																			{item?.course_name &&
																			(item?.assignment_title ?? item?.subject_name) !== item?.course_name ? (
																				<Text className="text-gray text-sm mt-1">
																					{item.course_name}
																				</Text>
																			) : null}
																		</Box>

																		<Box>
																			<Text className="text-gray text-sm pl-1">Assigned by:</Text>
																			<Text className="flex pt-3">
																				{' '}
																				<img src={Man} width={30} className="pr-1" />
																				{item?.by || '—'}
																			</Text>
																		</Box>
																	</Box>
																</Flex>
																<Box className="mt-3">
																	<Text className="text-xs">
																		<span className="text-gray">Due: </span>
																		{item?.due_date ?? '—'}
																	</Text>
																	<Text className="text-xs mt-1">
																		<span className="text-gray">Assigned: </span>
																		{item?.date}
																	</Text>
																	<Button
																		type="submit"
																		className=" bg-Sunglow  rounded-[15px] shadow-custom-sm-warning  hover:bg-Warning text-black mt-5"
																		onClick={async () => {
																			const path = assignmentNavigatePath(item);
																			if (!path) return;
																			if (item.assign_id != null) {
																				try {
																					await dispatch(markTodoAssignOpened(item.assign_id)).unwrap();
																				} catch {
																					/* still navigate if mark fails */
																				}
																			}
																			navigate(path);
																		}}
																	>
																		View Assignment
																	</Button>{' '}
																</Box>
															</Box>
														);
													}
												)}
											</Flex>
										)}
									</>
								);
							})}
						</>
					)}
				</>
			</ModuleView>
		</>
	);
}
