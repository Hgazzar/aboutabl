import PageHeader from '../../pageHeader';
import Sound from 'assets/images/svg/sound.svg';
import SoundMute from 'assets/images/svg/soundMute.svg';
import Writting from 'assets/images/svg/Skill.svg';
import './index.css';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Box, Button, Container, Flex, Input, Text } from '@mantine/core';
import Reading from '../../../../../assets/images/svg/reading.svg';
import { useEffect, useMemo, useRef, useState } from 'react';
import Progress from 'components/Progress';
import { Insight } from './insight';
import {
	saveQuizRuntimeProgress,
	setAnswerDraft,
	startQuizRuntime,
	submitQuizRuntime,
} from 'redux-toolkit/reducer/QuizReducer';
import LoadingPartially from 'components/loading-partially';
import { AppDispatch } from 'redux-toolkit/store/store';
import {
	listMcqOptions,
	parseQuizStem,
	QuizRuntimePlayQuestion,
} from 'lib/quizRuntime';

/**
 * F-045B — Single Quiz Runtime execution path.
 * Collects answers and submits to Runtime. No client-side scoring.
 */
export default function Quiz() {
	const dispatch = useDispatch<AppDispatch>();
	const navigate = useNavigate();
	const { idQuiz } = useParams();
	const [searchParams] = useSearchParams();
	const assignStudentIdParam = searchParams.get('assign_student_id');
	const assignStudentId = assignStudentIdParam
		? Number(assignStudentIdParam)
		: null;

	const quizState = useSelector((state: any) => state.QuizReducer);
	const questions: QuizRuntimePlayQuestion[] = quizState.questions || [];
	const attempt = quizState.attempt;
	const answersByKey: Record<string, Record<string, unknown>> =
		quizState.answersByKey || {};

	const [indexQuestion, setIndexQuestion] = useState(0);
	const [isActive, setIsActive] = useState<boolean | null>(null);
	const [reason, setReason] = useState('');
	const [answserSHN, setAnswerSHN] = useState('');
	const [selectedItems, setSelectedItems] = useState<number[]>([]);
	const [draggedItem, setDraggedItem] = useState<number | null>(null);
	const [resultMatching, setResultMatching] = useState<string[]>([]);
	const [submitting, setSubmitting] = useState(false);

	const questionActive = questions[indexQuestion] || null;
	const stemLines = useMemo(
		() => parseQuizStem(questionActive?.stem),
		[questionActive?.stem]
	);
	const mcqOptions = useMemo(
		() => listMcqOptions(questionActive?.options),
		[questionActive?.options]
	);

	useEffect(() => {
		if (!idQuiz) {
			return;
		}
		dispatch(
			startQuizRuntime({
				quizId: idQuiz,
				assignStudentId:
					assignStudentId != null && assignStudentId > 0
						? assignStudentId
						: null,
			})
		);
	}, [dispatch, idQuiz, assignStudentId]);

	useEffect(() => {
		if (!questionActive?.snapshot_question_key) {
			return;
		}
		const draft = answersByKey[questionActive.snapshot_question_key];
		setIsActive(null);
		setReason('');
		setAnswerSHN('');
		setSelectedItems([]);
		setResultMatching([]);
		setDraggedItem(null);

		if (!draft) {
			return;
		}
		const type = String(questionActive.type || '').toUpperCase();
		if (type === 'TF') {
			const value = draft.value ?? draft.selected ?? draft.answer;
			if (value === true || value === 'T' || value === 'true' || value === 1) {
				setIsActive(true);
			} else if (
				value === false ||
				value === 'F' ||
				value === 'false' ||
				value === 0
			) {
				setIsActive(false);
			}
			if (typeof draft.reason === 'string') {
				setReason(draft.reason);
			}
		} else if (type === 'SHN' || type === 'ESSAY') {
			const text = draft.value ?? draft.answer ?? draft.text;
			if (text != null) {
				setAnswerSHN(String(text));
			}
		} else if (type === 'MCQ') {
			const raw = draft.selected ?? draft.value ?? draft.answers;
			const arr = Array.isArray(raw) ? raw : raw != null ? [raw] : [];
			setSelectedItems(
				arr
					.map((item) => Number(item))
					.filter((n) => !Number.isNaN(n) && n > 0)
			);
		} else if (type === 'MATCHING') {
			const pairs = draft.pairs ?? draft.matching ?? draft.selected;
			if (Array.isArray(pairs)) {
				setResultMatching(pairs.map(String));
			}
		}
	}, [indexQuestion, questionActive?.snapshot_question_key]);

	const buildCurrentPayload = (): Record<string, unknown> | null => {
		if (!questionActive) {
			return null;
		}
		const type = String(questionActive.type || '').toUpperCase();
		if (type === 'TF') {
			if (isActive === null) {
				return null;
			}
			return { value: isActive, reason };
		}
		if (type === 'SHN' || type === 'ESSAY' || type === 'UPLOAD') {
			if (!answserSHN.trim()) {
				return null;
			}
			return { value: answserSHN };
		}
		if (type === 'MCQ') {
			if (selectedItems.length === 0) {
				return null;
			}
			return { selected: [...selectedItems].sort((a, b) => a - b) };
		}
		if (type === 'MATCHING') {
			if (resultMatching.length === 0) {
				return null;
			}
			return { pairs: [...resultMatching].sort() };
		}
		return null;
	};

	const persistCurrentDraft = () => {
		if (!questionActive?.snapshot_question_key) {
			return;
		}
		const payload = buildCurrentPayload();
		dispatch(
			setAnswerDraft({
				snapshot_question_key: questionActive.snapshot_question_key,
				response_payload: payload,
			})
		);
	};

	const buildAllAnswers = () => {
		const merged = { ...answersByKey };
		if (questionActive?.snapshot_question_key) {
			const current = buildCurrentPayload();
			if (current) {
				merged[questionActive.snapshot_question_key] = current;
			}
		}
		return questions.map((q) => ({
			snapshot_question_key: q.snapshot_question_key,
			question_id: q.question_id,
			response_payload: merged[q.snapshot_question_key] || null,
		}));
	};

	const handleNext = async () => {
		if (!attempt || !questionActive) {
			return;
		}
		persistCurrentDraft();
		const answers = buildAllAnswers();
		const isLast = indexQuestion >= questions.length - 1;

		if (isLast) {
			setSubmitting(true);
			try {
				const result = await dispatch(
					submitQuizRuntime({
						attemptId: attempt.id,
						rowVersion: attempt.row_version,
						answers,
					})
				).unwrap();
				const percent = Math.round(Number(result.percentage ?? result.score ?? 0));
				navigate(`/learn/quiz/${idQuiz}/result/${percent}`, {
					replace: true,
					state: { runtimeResult: result },
				});
			} catch {
				setSubmitting(false);
			}
			return;
		}

		try {
			await dispatch(
				saveQuizRuntimeProgress({
					attemptId: attempt.id,
					rowVersion: attempt.row_version,
					answers,
				})
			);
		} catch {
			/* continue locally even if save fails */
		}
		setIndexQuestion((prev) => prev + 1);
	};

	const handleCheckboxChange = (index: number, checked: boolean) => {
		setSelectedItems((prev) => {
			if (checked) {
				return prev.includes(index) ? prev : [...prev, index];
			}
			return prev.filter((item) => item !== index);
		});
	};

	const handleDragStart = (index: number, e: any) => {
		setDraggedItem(index);
		if (e?.dataTransfer) {
			e.dataTransfer.setData('text/plain', String(index));
			e.dataTransfer.effectAllowed = 'move';
		}
	};

	const handleDrop = (slotIndex: number) => {
		if (draggedItem === null) {
			return;
		}
		const srcIndex = Number(draggedItem);
		const pair = `${slotIndex + 1}|${srcIndex + 1}`;
		setResultMatching((prev) => {
			const filtered = prev.filter((p) => !p.startsWith(`${slotIndex + 1}|`));
			return [...filtered, pair];
		});
		setDraggedItem(null);
	};

	const audioRef = useRef<HTMLAudioElement | null>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const togglePlay = () => {
		if (!audioRef.current) {
			return;
		}
		if (isPlaying) {
			audioRef.current.pause();
		} else {
			audioRef.current.play();
		}
		setIsPlaying(!isPlaying);
	};

	const matchingSlots = Math.max(mcqOptions.length, 1);
	const type = String(questionActive?.type || '').toUpperCase();

	return (
		<>
			<PageHeader title="" route="/learn" />

			{quizState.loading || !questionActive ? (
				<Flex className="bg-white  h-auto p-3">
					<LoadingPartially />
					{quizState.error ? (
						<Text className="text-red-500 p-4">{quizState.error}</Text>
					) : null}
				</Flex>
			) : (
				<>
					<Flex className="bg-PaoloVeroneseGreen  w-[auto]  p-3 h-[800px]">
						<Box className="bg-white flex flex-col p-11 rounded-[15px] border-[1px]  border-Platinum m-2 h-[auto]  w-3/4">
							<Progress number={indexQuestion} length={questions.length} />
							<Box className=" mt-5">
								{type === 'MATCHING' || type === 'MCQ' ? (
									<img src={Reading} alt="" />
								) : (
									<img src={Writting} alt="" />
								)}

								<Text className="font-semibold text-CharlestonGreen mt-2">
									{stemLines.map((a: any, idx: number) => (
										<span key={idx}>
											{a.type === 'file' && a.ext === 'image' && (
												<img src={a.text} className="w-[100px] h-[100px]" alt="" />
											)}
											{a.type === 'text' && <>{a?.text}</>}
											{a.type === 'file' && a.ext === 'audio' && (
												<>
													<audio ref={audioRef} src={a.text} />
													<img
														onClick={togglePlay}
														src={isPlaying ? Sound : SoundMute}
														alt=""
													/>
												</>
											)}
											{a.type === 'file' && a.ext === 'pdf' && (
												<iframe src={a.text} className="h-[200px] w-[500px]" title="pdf" />
											)}
										</span>
									))}
								</Text>
								<Container className="m-5 mx-auto">
									{type === 'TF' ? (
										<>
											<Flex className="align-center justify-around mt-14 mb-14 w-100 gap-2">
												<Text
													className={`border border-Platinum rounded-[18px] p-5 shadow-custom-sm  cursor-pointer inline w-3/4 ${
														isActive === true ? 'bg-blue shadow-custom-sm-blue' : ''
													}`}
													onClick={() => setIsActive(true)}
												>
													True
												</Text>
												<Text
													className={`border border-Platinum rounded-[18px] p-5 shadow-custom-sm  cursor-pointer inline w-3/4 ${
														isActive === false ? 'bg-blue shadow-custom-sm-blue' : ''
													}`}
													onClick={() => setIsActive(false)}
												>
													False
												</Text>
											</Flex>
											<Text>Reason</Text>
											<Box className="border border-Platinum rounded-[18px] p-5 shadow-custom-sm mt-1 bg-white">
												<input
													className="outline-none bg-white w-full"
													name="reason"
													value={reason}
													onChange={(e) => setReason(e.target.value)}
													placeholder="Enter your answer"
												/>
											</Box>
										</>
									) : null}

									{type === 'SHN' || type === 'ESSAY' || type === 'UPLOAD' ? (
										<Box className="border border-Platinum rounded-[18px] p-5 mt-5 shadow-custom-sm">
											<Input
												name="code"
												value={answserSHN}
												onChange={(e) => setAnswerSHN(e.target.value)}
												placeholder="Enter your answer"
											/>
										</Box>
									) : null}

									{type === 'MATCHING' ? (
										<Flex className="flex justify-between">
											<Box className="gap-3">
												{mcqOptions.map((item, index) => (
													<Box
														className="border border-Platinum rounded-[30px] p-5 m-5 shadow-custom-sm hover:bg-Lotion cursor-pointer h-[100px] w-[100px]"
														key={item.key}
														draggable
														onDragStart={(e: any) => handleDragStart(index, e)}
													>
														{String(item.text ?? '')}
													</Box>
												))}
											</Box>
											<Flex className="justify-around gap-8">
												<Box>
													{Array.from({ length: matchingSlots }).map((_, index) => {
														const pair = resultMatching.find((p) =>
															p.startsWith(`${index + 1}|`)
														);
														const src = pair ? Number(pair.split('|')[1]) - 1 : -1;
														const label =
															src >= 0 && mcqOptions[src]
																? String(mcqOptions[src].text ?? '')
																: 'Drag your answer here';
														return (
															<Box
																key={`slot-${index}`}
																onDragOver={(e: any) => e.preventDefault()}
																onDrop={() => handleDrop(index)}
																className={`border-dashed border-2 border-Platinum rounded-[30px] p-5 m-5 cursor-pointer h-[100px] w-[100px] text-xs text-gray ${
																	pair ? 'border-solid shadow-custom-sm' : ''
																}`}
															>
																{label}
															</Box>
														);
													})}
												</Box>
											</Flex>
										</Flex>
									) : null}

									{type === 'MCQ' ? (
										<Flex className="flex-wrap">
											{mcqOptions.map((item) => (
												<Box key={item.key} className="flex items-center">
													<input
														type="checkbox"
														checked={selectedItems.includes(item.index)}
														onChange={(e) =>
															handleCheckboxChange(item.index, e.target.checked)
														}
													/>
													<Box className="border border-Platinum rounded-[30px] p-5 m-5 cursor-pointer shadow-custom-sm h-[100px] w-[100px]">
														{item.image ? (
															<img
																src={String(item.image)}
																className="h-[60px] w-[100px]"
																alt=""
															/>
														) : (
															String(item.text ?? '')
														)}
													</Box>
												</Box>
											))}
										</Flex>
									) : null}
								</Container>
							</Box>

							<Box className="border-t-[1px] border-Platinum flex pt-8 mt-auto">
								<Button
									type="button"
									className="text-EerieBlack bg-Sunglow rounded-[15px] shadow-custom-sm-warning w-[140px] m-auto hover:bg-Warning mb-5"
									disabled={submitting || quizState.submitting}
									onClick={() => {
										void handleNext();
									}}
								>
									{indexQuestion >= questions.length - 1
										? submitting
											? 'Submitting…'
											: 'Submit'
										: 'Next'}
								</Button>
							</Box>
						</Box>
						<Insight
							indexQuestion={indexQuestion + 1}
							questions={questions}
							score={0}
							title={quizState.title}
							remainingSeconds={attempt?.remaining_seconds ?? null}
						/>
					</Flex>
				</>
			)}
		</>
	);
}
