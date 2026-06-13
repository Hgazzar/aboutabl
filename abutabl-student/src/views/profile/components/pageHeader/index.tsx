import { Grid } from '@mantine/core';
import VectorImage from 'components/vectorImage';
import { useIntl } from 'react-intl';
import { HeaderWrapper } from './styles';

export default function PageHeader() {
	const { formatMessage } = useIntl();
	return (
		<HeaderWrapper>
			<Grid mr={0} align={'center'} justify={'space-between'}>
				<Grid.Col xs={12} md={6}>
                    <h1>{formatMessage({id:"Profile"})}</h1>
                </Grid.Col>
			</Grid>

			<VectorImage />
		</HeaderWrapper>
	);
}
