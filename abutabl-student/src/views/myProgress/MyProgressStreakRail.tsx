import LearningStreakWidget from 'views/dashboard/components/LearningStreakWidget';
import type { MyProgressStreak } from 'lib/myProgressApi';
import { toDashboardStreakShape } from './myProgressRailUtils';

type Props = {
	streak: MyProgressStreak;
};

export default function MyProgressStreakRail({ streak }: Props) {
	return <LearningStreakWidget streak={toDashboardStreakShape(streak)} />;
}
