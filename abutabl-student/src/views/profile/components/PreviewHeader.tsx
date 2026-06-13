import { headerProps } from '../types';

function PreviewHeader({ title }: headerProps) {
	return (
		<div className="px-8 py-6 bg-lightGray ">
			<p className="text-lg font-medium">{title}</p>
		</div>
	);
}

export default PreviewHeader;
