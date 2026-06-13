import { useState } from 'react';
import { Grid, Flex, Menu } from '@mantine/core';
import { useIntl } from 'react-intl';
import ChevronDown from 'assets/images/svg/arrow-down.svg?react';
import Recent from 'assets/images/svg/clock.svg?react';
import AlphabeticalAsc from 'assets/images/svg/arrow-up.svg?react';
import AlphabeticalDesc from 'assets/images/svg/arrow-down-circle.svg?react';
import { HeaderWrapper } from './styles';
import { useDispatch, useSelector } from 'react-redux';
import { SubjectsList } from 'redux-toolkit/reducer/SubjectsReducer';
export default function Header({ length }: { length?: number }) {
	const { formatMessage } = useIntl();






	return (
		<HeaderWrapper>
			<Grid>
				<Grid.Col xs={6}>
					<Flex align={'center'} gap={16} className="courses_info">
						<h3>{formatMessage({ id: 'Assigments' })}</h3>

					</Flex>
				</Grid.Col>

			</Grid>
		</HeaderWrapper>
	);
}
