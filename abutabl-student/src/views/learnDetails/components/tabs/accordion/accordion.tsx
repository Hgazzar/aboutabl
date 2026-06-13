import React, { useEffect, useMemo, useState } from 'react';
import {
	Accordion,
	AccordionItem,
	AccordionItemHeading,
	AccordionItemButton,
	AccordionItemPanel,
} from 'react-accessible-accordion';
import 'react-accessible-accordion/dist/fancy-example.css';
import './index.css';
import Article from 'assets/images/svg/article.svg';
import Video from 'assets/images/svg/demand_video.svg';
import Image from 'assets/images/svg/image.svg';
import Zip from 'assets/images/svg/zip.svg';

import Sheet from 'assets/images/svg/sheets.svg';
import { useSelector } from 'react-redux';
import { Box } from '@mantine/core';
import { Link } from 'react-router-dom';

const SYLLABUS_ITEM_UUID = 'syllabus';

function syllabusCollapsedStorageKey(subjectId: string | number) {
	return `student-syllabus-collapsed:${subjectId}`;
}

const AccordionComponent = () => {
	const subjectDetails = useSelector((state: any) => state.SubjectsReducer.subjectDetailsData);
	const subjectId = subjectDetails?.basic_info?.id as string | number | undefined;
	const [htmlSyllabusIntro, setHTMLSyllabusIntro] = useState({ __html: '' });

	const preExpanded = useMemo(() => {
		if (subjectId == null) return [SYLLABUS_ITEM_UUID];
		if (typeof window === 'undefined') return [SYLLABUS_ITEM_UUID];
		return localStorage.getItem(syllabusCollapsedStorageKey(subjectId)) === '1'
			? []
			: [SYLLABUS_ITEM_UUID];
	}, [subjectId]);

	useEffect(() => {
		setHTMLSyllabusIntro({ __html: subjectDetails?.basic_info?.des ?? '' });
	}, [subjectDetails]);

	const onAccordionChange = (expandedUuids: (string | number)[]) => {
		if (subjectId == null) return;
		const collapsed = !expandedUuids.map(String).includes(SYLLABUS_ITEM_UUID);
		const key = syllabusCollapsedStorageKey(subjectId);
		if (collapsed) {
			localStorage.setItem(key, '1');
		} else {
			localStorage.removeItem(key);
		}
	};

	return (
		<Box className="overviewAccordion">
			<Accordion
				key={subjectId ?? 'syllabus-accordion'}
				allowZeroExpanded
				preExpanded={preExpanded}
				onChange={onAccordionChange}
			>
				<AccordionItem uuid={SYLLABUS_ITEM_UUID}>
					<AccordionItemHeading>
						<AccordionItemButton style={{ borderRadius: '20px' }}>Syllabus</AccordionItemButton>
					</AccordionItemHeading>
					<AccordionItemPanel>
						{htmlSyllabusIntro.__html ? (
							<div className="mb-4 text-stone-600" dangerouslySetInnerHTML={htmlSyllabusIntro} />
						) : null}
						{subjectDetails?.units?.map(
							(
								unit: { lessons: []; lessons_count: string; name: string; quizes_count: string },
								index: number
							) => {
								return (
									<div className="detailsUnit mt-2" key={unit?.name ?? index}>
										<div className="flex justify-between items-center border-b-2 border-slate-200 p-6">
											<h3 className="text-black font-bold">
												Unit {index + 1}- {unit?.name}
											</h3>
											<div>
												{unit?.lessons_count} lessons - {unit?.quizes_count} Quizzes
											</div>
										</div>
										<div className="pb-5">
											{unit?.lessons?.map(
												(lesson: {
													id: number;
													contents: { lessons_count: string; name: string; quizes_count: string }[];
												}) => {
													return lesson?.contents.map((content: any) => {
														return (
															<Link
																to={`details/${lesson?.id}`}
																target="_blank"
																rel="noopener noreferrer"
																className="cursor-pointer"
																onClick={() => {
																	localStorage.setItem('id', content?.id);
																}}
																key={content?.id}
															>
																<div className="flex justify-between items-center pb-0.5 px-5 pr-5  mt-5 ">
																	<div className="flex items-center justify-center">
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
																					: Zip
																			}
																			alt="Book"
																			className="mr-2 color-#9C9B9B"
																		/>
																		<div className="text-stone-400">
																			{content?.type} : {content?.name}
																		</div>
																	</div>
																	<div>{content?.period} </div>
																</div>
															</Link>
														);
													});
												}
											)}
										</div>
									</div>
								);
							}
						)}
					</AccordionItemPanel>
				</AccordionItem>
			</Accordion>
		</Box>
	);
};

export default AccordionComponent;
