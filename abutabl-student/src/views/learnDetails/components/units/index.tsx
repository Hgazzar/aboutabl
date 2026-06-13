import React, { useEffect, useRef, useState } from 'react';
import {
	Accordion,
	AccordionItem,
	AccordionItemHeading,
	AccordionItemButton,
	AccordionItemPanel,
} from 'react-accessible-accordion';
import 'react-accessible-accordion/dist/fancy-example.css';
import BookMark from 'assets/images/svg/bookmark.svg';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Text } from '@mantine/core';
import Video from 'assets/images/svg/demand_video.svg';
import Image from 'assets/images/svg/image.svg';
import Zip from 'assets/images/svg/zip.svg';
import Audio from 'assets/images/svg/audio.svg';
import Sheet from 'assets/images/svg/sheets.svg';
import Quiz from 'assets/images/svg/quiz.svg';

import LoadingPartially from 'components/loading-partially';
import './index.css';
import CircleProgress from 'components/CircleProgress';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { lessonContent } from 'redux-toolkit/reducer/LessonReducer';
import EmptyComp from 'views/Empty';
const Units = () => {
	const dispatch = useDispatch();
	const navigate = useNavigate();

	const { id } = useParams();
	const subjectDetails = useSelector((state: any) => state.SubjectsReducer);
	const lesson = useSelector((state: any) => state.LessonReducer);
	const [idData, setIdData] = useState<string>();
	const [loading, setLoading] = useState(false);
	const [data, setData] = useState<any>({});
	const location = useLocation();
	const [searchParams] = useSearchParams();
	const focusLesson = searchParams.get('focusLesson');
	const autoOpenedLessonKey = useRef<string | null>(null);

	const todoListData = useSelector((state: any) => state.todoReducer);
	const allData = todoListData?.todoListData?.allAssigns?.flatMap((assign: any) => assign.data) || [];

	const focusUnit = searchParams.get('focusUnit');
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
	useEffect(() => {
		setData(lesson?.lessonContentData);
	}, [lesson]);

	useEffect(() => {
		if (!focusLesson || !info || !subjectDetails?.subjectDetailsData?.units?.length) {
			return;
		}
		const cacheKey = `${id}-${focusLesson}`;
		if (autoOpenedLessonKey.current === cacheKey) {
			return;
		}
		const lid = Number(focusLesson);
		if (Number.isNaN(lid)) {
			return;
		}
		const units = subjectDetails.subjectDetailsData.units;
		for (const unit of units) {
			const found = unit.lessons?.find((l: { id: number }) => Number(l.id) === lid);
			if (found) {
				autoOpenedLessonKey.current = cacheKey;
				setIdData(found.name);
				(async () => {
					setLoading(true);
					await dispatch(
						lessonContent({ id: lid, type: info.type, type_id: info.type_id })
					);
					setLoading(false);
				})();
				break;
			}
		}
	}, [focusLesson, id, info, subjectDetails?.subjectDetailsData, dispatch]);

	useEffect(() => {
		// console.log("lllllllllllllllllllllll");
		setData({});
	}, [location]);
	return (
		<>
			<Box className="flex justify-between unitsAccordion h-full">
				<>
					<Box className="w-2/5 mr-5 ">
						<Box className="contentCourse">
							Course content
							<Text className="text-stone-400">{subjectDetails?.subjectDetailsData?.units?.length} units</Text>
						</Box>
						<Accordion allowZeroExpanded>
							{subjectDetails?.subjectDetailsData?.units?.map(
								(
									unit: {
										lessons: [];
										lessons_count: string;
										name: string;
										quizes_count: string;
										id: number;
										quizesUnit: [];
									},
									index: number
								) => {
									return (
										<AccordionItem key={id}>
											<AccordionItemHeading>
												<AccordionItemButton>
													<Box className="flex justify-between mx-5">
														<Box className="px-5">
															{index + 1} Unit - {unit?.name}
															<Text className="text-stone-400 ">
																{unit?.lessons_count} Lessons - {unit?.quizes_count} Quiz
															</Text>
														</Box>
														<CircleProgress
															childern={String(
																Math.min(
																	100,
																	Math.round(
																		Number(unit?.lessons_count) > 0
																			? ((unit?.lessons?.length ?? 0) / Number(unit?.lessons_count)) * 100
																			: 0
																	)
																)
															)}
														/>
													</Box>
												</AccordionItemButton>
											</AccordionItemHeading>
											<AccordionItemPanel>
												<Box>
													{unit?.lessons?.map((lesson: { name: string; id: number }, index: number) => {
														return (
															<Box
																className={`flex  mt-1 px-5 ${idData === lesson?.name && 'activeLesson'}`}
																onClick={async (event: any) => {
																	setIdData(event.target.innerText);
																	setLoading(true);
																	await dispatch(
																		lessonContent({ id: lesson?.id, type: info.type, type_id: info.type_id })
																	);

																	setLoading(false);
																}}
															>
																<Box className="flex items-center p-4 cursor-pointer" key={index}>
																	<img src={BookMark} alt="Book" className="mr-2 color-#9C9B9B" />
																	<Text className="text-stone-900 mb-2"> {lesson?.name}</Text>
																</Box>
															</Box>
														);
													})}
												</Box>
												{/* ------------------ */}
												{unit?.quizesUnit?.length != 0 && (
													<Text className="text-gray2-900  line">
														<span className="text-gray2-900  lineChildren">Quizzes</span>
													</Text>
												)}
												<Box>
													{unit?.quizesUnit?.map((quiz: { title: string; id: number }) => {
														return (
															<Box
																className={`flex px-5 ${idData === lesson?.title && 'activeLesson'}`}
																onClick={async (event: any) => {
																	navigate(`/learn/${id}/quiz/${quiz?.id}`);
																}}
															>
																<Box className="flex items-center p-4 cursor-pointer" key={index}>
																	<img src={Quiz} alt="Book" className="mr-2 color-#9C9B9B" />
																	<Text className="text-stone-900 mb-2"> {quiz?.title}</Text>
																</Box>
															</Box>
														);
													})}
												</Box>
											</AccordionItemPanel>
										</AccordionItem>
									);
								}
							)}
						</Accordion>
					</Box>
					<Box className="w-3/5 ">
						{loading ? (
							<Box style={{ marginTop: '120px' }}>
								<LoadingPartially />
							</Box>
						) : (
							<>
								{data?.contents == undefined || data?.contents?.length == 0 ? (
									<>
										{data?.lesson?.name}
										<EmptyComp />
									</>
								) : (
									<>
										<Text className="headerLesson p-2">
											{data?.lesson?.name}
											{/* Lesson 2 content */}
										</Text>
										<Box className="flex w-200 flex-wrap">
											{data?.contents?.map((lesson: any) => {
												return (
													<Link
														to={`details/${lesson?.id}`}
														target="_blank"
														onClick={() => {
															localStorage.setItem('id', lesson?.id);
														}}
													>
														<Box className="contentLesson">
															<Box className="contentIcons">
																{lesson?.type == 'video' ? (
																	<img src={Video} alt="imag" />
																) : lesson?.type == 'scrom' || lesson?.type == 'scorm' ? (
																	<img src={Zip} alt="imag" />
																) : lesson?.type == 'word' || lesson?.type == 'pdf' ? (
																	<img src={Sheet} alt="imag" />
																) : lesson?.type == 'audio' ? (
																	<img src={Audio} alt="imag" />
																) : lesson?.type == 'image' ? (
																	<img src={Image} alt="imag" />
																) : (
																	<img src={Sheet} alt="imag" />
																)}
															</Box>
															<Text>{lesson?.name}</Text>
															<Text className="text-stone-400">{lesson?.period}</Text>
														</Box>
													</Link>
												);
											})}
										</Box>
										{data?.quizes?.length !== 0 && (
											<>
												<Text className="text-stone-900 m-5 line">
													<span className="text-stone-900  lineChildren">Quizzes</span>
												</Text>

												<Box className="flex w-200 flex-wrap">
													{data?.quizes?.map((quiz: { title: string; id: number }) => {
														return (
															<Link to={`/learn/${id}/quiz/${quiz?.id}`} target="_blank">
																<Box className="contentLesson">
																	<Box className="contentIcons">
																		<img src={Quiz} alt="imag" />
																	</Box>
																	<Text>{quiz?.title}</Text>
																</Box>
															</Link>
														);
													})}
												</Box>
											</>
										)}
									</>
								)}
							</>
						)}
					</Box>
				</>
			</Box>
		</>
	);
};

export default Units;
