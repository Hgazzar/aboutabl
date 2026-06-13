import { Grid, Text, Box } from '@mantine/core';
import { useSelector } from 'react-redux';
import EmptyComp from 'views/Empty';
import Sheet from 'assets/images/svg/sheets.svg';

export default function LearnDetailsWorksheets() {
	const subjectDetails = useSelector((state: any) => state.SubjectsReducer.subjectDetailsData);
	const sheets = subjectDetails?.worksheetsSubject ?? [];

	if (!sheets.length) {
		return <EmptyComp />;
	}

	return (
		<Grid gutter={32} className="mt-3">
			{sheets.map((item: { id: number; title: string; file_url: string }) => (
				<Grid.Col key={item.id} sm={6} md={4} lg={3}>
					<a href={item.file_url} target="_blank" rel="noopener noreferrer" className="no-underline text-inherit">
						<Box className="border border-Platinum rounded-2xl p-4 shadow-sm hover:bg-stone-50 h-full">
							<img src={Sheet} alt="" className="w-10 h-10 mb-2 opacity-60" />
							<Text className="font-medium line-clamp-2">{item.title}</Text>
							<Text size="xs" c="dimmed" mt={8}>
								Open worksheet
							</Text>
						</Box>
					</a>
				</Grid.Col>
			))}
		</Grid>
	);
}
