import Canvas from './Canvas';
type StudyCardProps = {
	background: string;
	title: string;
	level: string;
	percentage: number;
	pieColors: {
		background: string;
		color: string;
	};
};
function StudyCard({ background, title, level, percentage, pieColors }: StudyCardProps) {
	return (
		<div className={`p-8 flex flex-col gap-8 rounded-[28px]`} style={{ background }}>
			<div className="flex flex-col  gap-4">
				<h4 className="font-medium">{title}</h4>
				<p className="text-Desert-Sand font-medium">{level}</p>
			</div>
			<div>
				<div className="w-[56px] h-[56px] rounded-full" style={{ background: pieColors.background }}>
					<Canvas pieColors={pieColors} angle={percentage} />
				</div>
			</div>
		</div>
	);
}

export default StudyCard;
