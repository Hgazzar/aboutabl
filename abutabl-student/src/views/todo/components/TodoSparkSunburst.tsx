import styled from 'styled-components';
import { figmaMyProgressAssetUrl } from 'config/figmaAssets';

/** Same sunburst as `/progress` hero (`hero-spark.png`). */
const SPARK = figmaMyProgressAssetUrl('hero-spark.png');

const SparkImg = styled.img`
	position: absolute;
	left: 50%;
	top: 40%;
	width: 150%;
	max-width: none;
	aspect-ratio: 1;
	transform: translate(-50%, -50%);
	object-fit: contain;
	opacity: 0.88;
	mix-blend-mode: screen;
	pointer-events: none;
	user-select: none;
	z-index: 0;
`;

type Props = {
	className?: string;
};

export default function TodoSparkSunburst({ className }: Props) {
	return <SparkImg className={className} src={SPARK} alt="" aria-hidden decoding="async" />;
}
