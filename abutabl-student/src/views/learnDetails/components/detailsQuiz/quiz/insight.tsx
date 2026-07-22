import { Box, Flex, Text } from '@mantine/core';
import QuizIcon from '../../../../../assets/images/svg/quiz.svg';
import Star from '../../../../../assets/images/svg/star.svg';
import Clock from '../../../../../assets/images/svg/clock_color.svg';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

interface IInsight {
	indexQuestion: number;
	questions: any[];
	score: number;
	title?: string;
	remainingSeconds?: number | null;
}

const formatSeconds = (total: number | null | undefined): string => {
	if (total == null || total < 0 || Number.isNaN(total)) {
		return '—';
	}
	const h = Math.floor(total / 3600);
	const m = Math.floor((total % 3600) / 60);
	const s = Math.floor(total % 60);
	return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
};

export const Insight = ({
	indexQuestion,
	questions,
	score,
	title,
	remainingSeconds,
}: IInsight) => {
	const quizState = useSelector((state: any) => state.QuizReducer);
	const [timer, setTimer] = useState(formatSeconds(remainingSeconds));

	useEffect(() => {
		setTimer(formatSeconds(remainingSeconds));
		if (remainingSeconds == null || remainingSeconds <= 0) {
			return;
		}
		let left = remainingSeconds;
		const id = window.setInterval(() => {
			left -= 1;
			setTimer(formatSeconds(Math.max(0, left)));
			if (left <= 0) {
				window.clearInterval(id);
			}
		}, 1000);
		return () => window.clearInterval(id);
	}, [remainingSeconds]);

	const maxScore = (questions || []).reduce(
		(sum: number, q: { max_score?: number }) => sum + Number(q?.max_score ?? 0),
		0
	);
	const displayTitle = title || quizState?.title || '';

	return (
		<>
			<Box className="border-[1px] border-Platinum mr-2 mt-2 mb-2  rounded-[15px] w-1/4 gap-5 bg-white">
				<Box
					className="font-semibold border-b-2 border-Platinum p-5"
					style={{ textAlign: 'center' }}
				>
					{displayTitle || 'Your insights'}
				</Box>
				<Flex className=" flex flex-col justify-center mt-20 items-center">
					<Box className="border border-Platinum rounded-[15px] p-5 w-[150px] mb-5  mx-8 flex flex-col justify-center">
						<img src={QuizIcon} className="h-[30px] " alt="" />
						<Text className="text-bold m-auto">
							{indexQuestion} / {questions?.length}
						</Text>
						<Text className="text-xs text-gray m-auto">Question answered</Text>
					</Box>

					<Box className="border border-Platinum rounded-[15px] p-5 w-[150px] mb-5 mx-8 flex flex-col justify-center">
						<img src={Clock} className="h-[30px] " alt="" />
						<Text className="text-bold m-auto">{timer}</Text>
						<Text className="text-xs text-gray m-auto">Time remaining</Text>
					</Box>

					<Box className="border border-Platinum rounded-[15px] p-5 w-[150px] mb-5 mx-8 flex flex-col justify-center">
						<img src={Star} className="h-[30px] " alt="" />
						<Text className="text-bold m-auto">
							{quizState?.result?.percentage != null
								? Math.round(Number(quizState.result.percentage))
								: score}{' '}
							Points
						</Text>
						<Text className="text-xs text-gray m-auto">
							Out of {maxScore || '—'}
						</Text>
					</Box>
				</Flex>
			</Box>
		</>
	);
};
