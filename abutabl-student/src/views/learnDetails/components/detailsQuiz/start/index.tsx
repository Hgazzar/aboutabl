import shapes from 'assets/images/png/shapes.png';
import iol from 'assets/images/svg/Group_quiz.svg';
import quizes from 'assets/images/svg/Background_Complete.svg';
import Quiz from 'assets/images/svg/quiz.svg';
import Star from 'assets/images/svg/star.svg';
import Code from 'assets/images/svg/code.svg';
import Time from 'assets/images/svg/time.svg';
import Date from 'assets/images/svg/date.svg';
import { Box, Button, Flex, Text } from '@mantine/core';
import PageHeader from '../../pageHeader';
import { ReactElement, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { startQuizRuntime } from 'redux-toolkit/reducer/QuizReducer';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import LoadingPartially from 'components/loading-partially';
import { AppDispatch } from 'redux-toolkit/store/store';

/**
 * F-045B — Start screen loads Quiz Runtime attempt (snapshot), not Definition.
 */
export default function QuizDetails() {
	const { idQuiz, id } = useParams();
	const [searchParams] = useSearchParams();
	const assignStudentIdParam = searchParams.get('assign_student_id');
	const assignStudentId =
		assignStudentIdParam && Number(assignStudentIdParam) > 0
			? Number(assignStudentIdParam)
			: null;

	const dispatch = useDispatch<AppDispatch>();
	const nagivate = useNavigate();
	const detailsQuiz = useSelector((state: any) => state.QuizReducer);

	useEffect(() => {
		if (!idQuiz) {
			return;
		}
		dispatch(
			startQuizRuntime({
				quizId: idQuiz,
				assignStudentId,
			})
		);
	}, [dispatch, idQuiz, assignStudentId]);

	const contant = [
		{
			image: Quiz,
			title: detailsQuiz?.title || '—',
			label: <> Title</>,
		},
		{
			image: Star,
			title: `${detailsQuiz?.questions?.length || 0} Questions`,
			label: <> in this attempt</>,
		},
		{
			image: Date,
			title: detailsQuiz?.attempt?.started_at
				? String(detailsQuiz.attempt.started_at).slice(0, 10)
				: '—',
			label: <> Started</>,
		},
		{
			image: Date,
			title: detailsQuiz?.attempt?.ends_at
				? String(detailsQuiz.attempt.ends_at).slice(0, 10)
				: '—',
			label: <> Ends</>,
		},
		{
			image: Time,
			title:
				detailsQuiz?.attempt?.time_limit_seconds != null
					? `${Math.round(Number(detailsQuiz.attempt.time_limit_seconds) / 60)} min`
					: '—',
			label: <> Time limit</>,
		},
		{
			image: Time,
			title:
				detailsQuiz?.attempt?.remaining_seconds != null
					? `${detailsQuiz.attempt.remaining_seconds}s`
					: '—',
			label: <> Remaining</>,
		},
		{
			image: Code,
			title: `Attempt #${detailsQuiz?.attempt?.attempt_no ?? '—'}`,
			label: <> Runtime</>,
		},
	];

	const playPath = (() => {
		const qs =
			assignStudentId != null
				? `?assign_student_id=${assignStudentId}`
				: '';
		if (id) {
			return `/learn/quiz/${idQuiz}${qs}`;
		}
		return `/learn/quiz/${idQuiz}${qs}`;
	})();

	return (
		<>
			<PageHeader title="" route="/learn" />
			{detailsQuiz?.loading ? (
				<Flex className="bg-white h-auto p-3">
					<LoadingPartially />
				</Flex>
			) : (
				<div className="bg-PaoloVeroneseGreen transition-all flex flex-col justify-start items-center relative min-h-[100vh] pb-10">
					<img src={shapes} alt="shapes" />
					<img
						src={iol}
						alt="logo"
						width={250}
						className=" md:block md:absolute bottom-0 right-0"
					/>
					<div className="w-full md:p-0 flex justify-center relative">
						<img src={quizes} className="absolute h-[600px]" alt="" />
						<Box className="flex flex-col justify-center text-center z-10 mt-20">
							<div className="border border-Platinum bg-white w-full md:p-10 flex flex-col justify-start items-center gap-6 rounded-[25px] shadow-custom-sm mx-2">
								<Text className="font-bold text-2xl px-10">
									{detailsQuiz?.title || 'Quiz'}
								</Text>
								{detailsQuiz?.error ? (
									<Text className="text-red-500 px-6">{detailsQuiz.error}</Text>
								) : null}
								<Flex className="flex-wrap justify-center gap-4 px-4">
									{contant.map(
										(item: {
											image: string;
											title: string;
											label: ReactElement;
										}) => (
											<Box
												key={String(item.title) + String(item.label)}
												className="border border-Platinum rounded-[15px] p-4 w-[140px]"
											>
												<img src={item.image} className="mx-auto h-[28px]" alt="" />
												<Text className="text-sm font-semibold mt-2">{item.title}</Text>
												<Text className="text-xs text-gray">{item.label}</Text>
											</Box>
										)
									)}
								</Flex>
								<Button
									type="button"
									className="bg-Sunglow rounded-[15px] shadow-custom-sm-warning hover:bg-Warning text-black mt-2"
									disabled={!!detailsQuiz?.error || !detailsQuiz?.attempt}
									onClick={() => nagivate(playPath)}
								>
									Start Quiz
								</Button>
							</div>
						</Box>
					</div>
				</div>
			)}
		</>
	);
}
