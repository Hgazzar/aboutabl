import VectorOne from 'assets/images/svg/Vector1.svg?react';
import VectorTwo from 'assets/images/svg/Vector2.svg?react';
import VectorThree from 'assets/images/svg/Vector3.svg?react';
import VectorFour from 'assets/images/svg/Vector4.svg?react';
import VectorFife from 'assets/images/svg/Vector5.svg?react';
import GroupOne from 'assets/images/svg/Group1.svg?react';
import GroupTwo from 'assets/images/svg/Group2.svg?react';
import GroupThree from 'assets/images/svg/Group3.svg?react';
import { VectorWrapper } from './styles';

export default function VectorImage() {
	return (
		<VectorWrapper>
			<VectorOne className="vector_one" />
			<VectorTwo className="vector_two" />
			<VectorThree className="vector_three" />
			<VectorFour className="vector_four" />
			<VectorFife className="vector_fife" />
			<GroupOne className="group_one" />
			<GroupTwo className="group_two" />
			<GroupThree className="group_three" />
		</VectorWrapper>
	);
}
