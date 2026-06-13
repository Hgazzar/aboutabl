import { CardWrapper, Details, ImgWrapper, Title, Unit, Percentage } from '../styles';
import { Flex, Grid, Progress } from '@mantine/core';
import { theme } from 'global-styles';
import { ISubject } from '../type/subject.type';
const CardItem: React.FC<ISubject> = ({
	image,
	title,
	units,
	lesson,
	progress,
}) => {
	return (
		<CardWrapper className='cursor-pointer'>
			<Flex justify="center" align="center" gap={'xl'} direction={'column'}>
				<ImgWrapper>
					<img src={image} alt="Book" />
				</ImgWrapper>
				<Details>
					<Flex justify="center" align="start" gap={8} direction={'column'}>

						<Title className="title line-clamp-2 break-words text-left w-full">{title}</Title>
						{<Unit>
							{units} units - {lesson} lessons
						</Unit>}

						{typeof progress === 'number' && (
							<Grid align="center" style={{ width: '100%' }}>
								<Grid.Col span={10}>
									<Progress color={theme.colours.Warning} h={4} value={Math.min(100, Math.max(0, progress))} />
								</Grid.Col>
								<Grid.Col span={2}>
									<Percentage>{Math.round(progress)}%</Percentage>
								</Grid.Col>
							</Grid>
						)}
					</Flex>
				</Details>
			</Flex>
		</CardWrapper>
	);
}

export default CardItem