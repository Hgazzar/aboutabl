import coursePlaceholder from 'assets/images/svg/course-placeholder.svg';
import Article from 'assets/images/svg/article.svg';
import Video from 'assets/images/svg/demand_video.svg';
import Quiz from 'assets/images/svg/quiz.svg';
import Game from 'assets/images/svg/gameColor.svg';
import Sheet from 'assets/images/svg/sheets.svg';
import CertificateIcon from 'assets/images/svg/certificate.svg';
import AccordionComponent from 'views/learnDetails/components/tabs/accordion/accordion';
import { Box, Text, Button } from '@mantine/core';
import { useSelector } from 'react-redux';
import { getRequest } from 'lib/requests';
import { toast } from 'react-toastify';

const Overview = () => {
	const subjectDetails = useSelector((state: any) => state.SubjectsReducer.subjectDetailsData);
	const subjectId = subjectDetails?.basic_info?.id;

	const onCertificateInfo = async () => {
		if (!subjectId) return;
		try {
			const res = await getRequest(`subjects/${subjectId}/certificate`);
			toast.info((res as { message?: string })?.message ?? 'Certificate');
		} catch {
			toast.error('Could not load certificate info');
		}
	};

	const contant = [
		{
			image: Article,
			label: <> {subjectDetails?.basic_info?.lessons_count} Lessons</>,
		},
		{
			image: Quiz,
			label: <> {subjectDetails?.basic_info?.quizes_count} Quizzes </>,
		},
		{
			image: Game,
			label: <>{subjectDetails?.basic_info?.games_count} Games</>,
		},
		{
			image: Sheet,
			label: <>{subjectDetails?.basic_info?.units_count} Units</>,
		},
		{
			image: Sheet,
			label: <>{subjectDetails?.basic_info?.work_sheets_count} Worksheets </>,
		},
		{
			image: CertificateIcon,
			label: (
				<Box className="flex flex-col gap-2 items-start">
					<Text component="span">Certificate on completion</Text>
					<Button size="xs" variant="light" onClick={onCertificateInfo}>
						Certificate info
					</Button>
				</Box>
			),
		},
	];

	return (
		<Box className="flex flex-col lg:flex-row gap-8 m-5 h-full">
			<Box className="w-full lg:w-2/5 flex flex-col gap-6">
				<img
					src={subjectDetails?.basic_info?.photo || coursePlaceholder}
					alt="Subject"
					className="w-full max-h-[420px] object-contain rounded-2xl border border-stone-100"
				/>
				<Box>
					<Text className="mt-2 font-semibold text-lg">This subject includes</Text>
					{contant.map((item: { [key: string]: string | JSX.Element }, idx: number) => {
						return (
							<Box className="flex mt-4 items-center" key={idx}>
								<img src={item.image.toString()} alt="" className="mr-2 w-8 h-8 opacity-70" />
								<Box className="text-stone-500"> {item.label}</Box>
							</Box>
						);
					})}
				</Box>
			</Box>
			<Box className="w-full lg:w-3/5 min-h-[200px]">
				<AccordionComponent />
			</Box>
		</Box>
	);
};

export default Overview;
