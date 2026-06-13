import './index.css';
const CircleProgress = ({ childern }: { childern: string }) => {
	return (
		<div
			className="circleProgress"
			style={{
				background: `radial-gradient(closest-side, white 79%, transparent 80% 100%), conic-gradient(#00907A
                    ${childern}%, #DEDDDD
                    0)`,
			}}
		>
			<span>{childern}%</span>
		</div>
	);
};

export default CircleProgress;
