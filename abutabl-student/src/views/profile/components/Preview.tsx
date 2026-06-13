import React from 'react';
import PreviewStudy from '../views/PreviewStudy';
import { types } from '../types';
import Assignments from '../views/Assignments';
import Certificates from '../views/Certificates';

type PreviewProps = {
	setActive: React.Dispatch<React.SetStateAction<types>>;
	active: types;
};

function preview({ active, setActive }: PreviewProps) {
	return (
		<div className="w-full lg:w-2/3">
			{active === 'progress' ? <PreviewStudy /> : active === 'certificates' ? <Certificates /> : <Assignments />}
		</div>
	);
}

export default preview;
