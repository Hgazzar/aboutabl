import React from 'react';
import PreviewHeader from '../components/PreviewHeader';
import { useIntl } from 'react-intl';

function Assignments() {
	const { formatMessage } = useIntl();
	return (
		<div>
			<PreviewHeader title={formatMessage({ id: 'My-assignments' })} />
		</div>
	);
}

export default Assignments;
