import React, { useEffect, useState } from 'react';
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
import { Box, Flex, Text } from '@mantine/core';
import Video from 'assets/images/svg/demand_video.svg';
import Image from 'assets/images/svg/image.svg';
import Zip from 'assets/images/svg/zip.svg';
import Audio from 'assets/images/svg/audio.svg';
import Article from 'assets/images/svg/article.svg';
import Arrow from 'assets/images/svg/arrow.svg';
import Arrow2 from 'assets/images/svg/arrow2.svg';
import ArrowCursor from 'assets/images/svg/arrowCursor.svg';
import { useNavigate } from 'react-router-dom';

import Sheet from 'assets/images/svg/sheets.svg';

import LoadingPartially from 'components/loading-partially';
import './index.css';
import { studentBrandLogoUrl } from 'config/figmaAssets';

import { useParams } from 'react-router-dom';
import { SubjectDetails } from 'redux-toolkit/reducer/SubjectsReducer';
import LessonContentViewer from './LessonContentViewer';

const DetailsUnit = () => {
	const dispatch = useDispatch();
	const nagivate = useNavigate();
	const subjectDetails = useSelector((state: any) => state.SubjectsReducer);
	const { id, idUnit } = useParams();
	const [item, setItem] = useState<any>(null);
	const [contentArr, setContentArr] = useState<any>([]);
	const [activeId, setActiveId] = useState<any>(idUnit || localStorage.getItem('id'));
	const [dataType, setDataType] = useState<any>('');
	const [show, setShow] = useState(false);
	const [loading, setLoading] = useState(true);

	// Enrollment-based: load subject curriculum by subject id (no assignment required).
	useEffect(() => {
		if (!id) return;
		let cancelled = false;
		(async () => {
			setLoading(true);
			try {
				await dispatch(SubjectDetails({ id }));
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [id, dispatch]);

	useEffect(() => {
		if (activeId) localStorage.setItem('id', String(activeId));
	}, [activeId]);

	// Build content list and set selected content from URL (idUnit) or localStorage
	useEffect(() => {
		const units = subjectDetails?.subjectDetailsData?.units;
		if (!units?.length) return;
		const arr: any[] = [];
		let foundContent: any = null;
		units.forEach((unit: { lessons: [] }) => {
			unit?.lessons?.forEach((lesson: { contents: [] }) => {
				lesson?.contents?.forEach((content: any) => {
					arr.push(content);
					// Prefer content id from URL (idUnit), then fall back to localStorage
					const matchByUrl = idUnit != null && String(content?.id) === String(idUnit);
					const matchByStorage = !idUnit && String(content?.id) === String(localStorage.getItem('id'));
					if (matchByUrl || matchByStorage) {
						foundContent = content;
					}
				});
			});
		});
		setContentArr(arr);
		if (foundContent) {
			setItem(foundContent);
			setActiveId(foundContent.id);
			setDataType(foundContent.type);
		}
	}, [subjectDetails?.subjectDetailsData?.units, idUnit]);

	return (
		<>
			<Box className="flex items-center mx-5 w-100 mt-3 mb-3">
				<Box
					className="cursor-pointer mx-5"
					onClick={() => {
						nagivate('/learn');
					}}
				>
					<img src={studentBrandLogoUrl()} alt="ABOUTABL" width={120} height={25} style={{ height: 28, width: 'auto' }} />
				</Box>
				<Text className={`${show ? 'ms-5' : 'ms-48'} text-LightSeaGreen text-l font-semibold`}>{item?.name}</Text>
				<Flex className="justify-between ml-auto">
						<button
							type="button"
							className={`hover:font-semibold hover:text-base transition-all mx-5 ${
								contentArr?.findIndex((c: any) => c.id == activeId) == 0 || activeId == ''
									? 'text-gray'
									: 'text-LightSeaGreen'
							}`}
							disabled={
								contentArr?.findIndex((c: any) => c.id == activeId) == 0 || activeId == ''
							}
							onClick={() => {
								const index = contentArr?.findIndex((c: any) => c.id == activeId);
								if (typeof index === 'number' && index != -1) {
									setDataType(contentArr[index - 1]?.type);
									setActiveId(contentArr[index - 1]?.id);
									setItem(contentArr[index - 1]);
								}
							}}
						>
							<div className="mx-2 flex justify-center">
								<div>Previous</div>
							</div>
						</button>
						<button
							type="button"
							onClick={() => {
								const index = contentArr?.findIndex((c: any) => c.id == activeId);
								if (typeof index === 'number' && index != -1) {
									setDataType(contentArr[index + 1]?.type);
									setActiveId(contentArr[index + 1]?.id);
									setItem(contentArr[index + 1]);
								}
							}}
							className={`hover:font-semibold hover:text-base transition-all ${
								contentArr?.findIndex((c: any) => c.id == activeId) ==
									contentArr?.length - 1 || activeId == ''
									? 'text-gray'
									: 'text-LightSeaGreen'
							} `}
							disabled={
								contentArr?.findIndex((c: any) => c.id == activeId) ==
									contentArr?.length - 1 || activeId == ''
							}
						>
							Next
							<span className="mx-2">{/* <KeyboardBackspaceIcon className="rotate-180" /> */}</span>
						</button>
					</Flex>
			</Box>

			{loading ? (
				<Box className="mt-48">
					<LoadingPartially />
				</Box>
			) : subjectDetails?.subjectDetailsData?.status === false ? (
				<Box className="mt-48 flex justify-center">
					<Text className="text-stone-500">Unable to load this subject.</Text>
				</Box>
			) : (
				<Flex>
					<Box className={`${show && 'hidden'} transition-all`}>
						<Accordion className="accordionLessonContainer" allowZeroExpanded>
							{subjectDetails?.subjectDetailsData?.units?.map(
								(
									unit: { lessons: []; lessons_count: string; name: string; quizes_count: string; id: number },
									index: number
								) => {
									return (
										<AccordionItem className="accordionLesson" key={unit.id}>
											<AccordionItemHeading>
												<AccordionItemButton>
													<Box className="flex justify-between ">
														<Box className="px-5">
															{index + 1} Unit - {unit?.name}
															<Text className="text-stone-400 ">
																{unit?.lessons_count} Lessons - {unit?.quizes_count} Quiz
															</Text>
														</Box>
													</Box>
												</AccordionItemButton>
											</AccordionItemHeading>
											<AccordionItemPanel className="accordionLesson">
												<Box>
													{unit?.lessons?.map((lesson: { name: string; id: number; contents: [] }, index: number) => {
														return (
															<Accordion allowZeroExpanded>
																<AccordionItem key={index}>
																	<AccordionItemHeading>
																		<AccordionItemButton>
																			<Box className="flex justify-between ">
																				{/* {item.heading} */}
																				<Box className="flex items-center " key={index}>
																					<img src={BookMark} alt="Book" className="mr-2 color-#9C9B9B" />
																					<Text className="text-stone-900 mb-2">{lesson?.name}</Text>
																				</Box>
																			</Box>
																		</AccordionItemButton>
																	</AccordionItemHeading>
																	<AccordionItemPanel className="accordionLesson">
																		{lesson?.contents?.map(
																			(content: { name: string; type: string; path: string; id: number }) => {
																				return (
																					<>
																						<Flex
																							className={`cursor-pointer subLesson ${
																								activeId == content?.id && 'activeLesson'
																							}`}
																							onClick={() => {
																								setActiveId(content?.id);
																								setItem({
																									path: content?.path,
																									name: content?.name,
																									type: content?.type,
																								});
																							}}
																						>
																							<img
																								src={
																									content?.type == 'video'
																										? Video
																										: content?.type == 'pdf'
																										? Sheet
																										: content?.type == 'word'
																										? Article
																										: content?.type == 'image'
																										? Image
																										: content?.type == 'audio'
																										? Audio
																										: Zip
																								}
																								alt="Book"
																								className="mr-2 color-#9C9B9B"
																							/>
																							<div className="text-stone-400">
																								{' '}
																								{content?.type} : {content?.name}
																							</div>
																						</Flex>
																					</>
																				);
																			}
																		)}
																	</AccordionItemPanel>
																</AccordionItem>
															</Accordion>
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
					<Box
						className={`${show ? 'absoluteIconAfter' : 'absoluteIcon'} cursor-pointer`}
						onClick={() => {
							setShow(!show);
						}}
					>
						<Box>{show ? <img src={Arrow} alt="" /> : <img src={Arrow2} alt="" />}</Box>
					</Box>
					<Box className={`${show ? 'contentShow' : 'content'} w-full`}>
						{!item || !item?.path ? (
							<Box className="mt-48 flex justify-center items-center">
								<Text className="text-stone-500">
									{loading ? null : contentArr?.length ? 'Select content from the list' : 'No content available'}
								</Text>
							</Box>
						) : (
							<LessonContentViewer item={item} />
						)}
					</Box>
				</Flex>
			)}
		</>
	);
};

export default DetailsUnit;
