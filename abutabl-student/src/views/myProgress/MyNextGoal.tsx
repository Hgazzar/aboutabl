import { useIntl } from 'react-intl';
import { figmaMyProgressAssetUrl } from 'config/figmaAssets';
import type { MyProgressNextGoal } from 'lib/myProgressApi';
import type { BookCardTheme } from './myProgressUtils';
import { formatNextGoalTitle, shouldShowContinueCta } from './myProgressUtils';
import { ContinueCta, NextGoalCopy, NextGoalRow } from './styles';

const GOAL_BIRD = figmaMyProgressAssetUrl('goal-bird-archer.svg');
const REWARD_STAR = figmaMyProgressAssetUrl('reward-star.svg');

type Props = {
	nextGoal: MyProgressNextGoal;
	theme: BookCardTheme;
};

/** Figma next-goal strip — real Continue Learning data only (no Figma mock copy). */
export default function MyNextGoal({ nextGoal, theme }: Props) {
	const { formatMessage } = useIntl();
	const showCta = shouldShowContinueCta({ next_goal: nextGoal }) && Boolean(nextGoal.cta_path);
	const goalTitle = formatNextGoalTitle(nextGoal, (lesson, content) =>
		formatMessage({ id: 'my-progress-complete-lesson' }, { lesson, content })
	);
	const showReward = nextGoal.available && nextGoal.reward_xp != null;

	return (
		<NextGoalRow $theme={theme} data-testid="my-next-goal">
			<NextGoalCopy $theme={theme}>
				<img className="bird" src={GOAL_BIRD} alt="" aria-hidden />
				<div className="copy">
					<p className="eyebrow">{formatMessage({ id: 'my-progress-your-next-goal' })}</p>
					{goalTitle ? (
						<p className="title">{goalTitle}</p>
					) : (
						<p className="title">{formatMessage({ id: 'my-progress-next-goal-empty' })}</p>
					)}
					{showReward ? (
						<span className="reward">
							{formatMessage({ id: 'my-progress-reward-xp' }, { xp: nextGoal.reward_xp })}
							<img src={REWARD_STAR} alt="" aria-hidden />
						</span>
					) : null}
				</div>
			</NextGoalCopy>
			{showCta && nextGoal.cta_path ? (
				<ContinueCta to={nextGoal.cta_path} $theme={theme}>
					{formatMessage({ id: 'my-progress-continue-learning' })}
				</ContinueCta>
			) : null}
		</NextGoalRow>
	);
}
