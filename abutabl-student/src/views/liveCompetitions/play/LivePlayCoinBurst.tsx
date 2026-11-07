import { useEffect } from 'react';
import { LIVE_PLAY_ASSET } from './livePlayAssets';
import { useLivePlayRewardFeedback } from './LivePlayRewardFeedbackContext';
import styles from './livePlayExperience.module.css';

const BURST_MS = 2200;

type Props = {
	themeClass?: 'classic' | 'gold_quest' | 'hacking' | 'unknown';
};

/** Prominent +N session-coin toast; optional confetti for Classic correct answers. */
export default function LivePlayCoinBurst({ themeClass = 'classic' }: Props) {
	const { active, clearReward } = useLivePlayRewardFeedback();

	useEffect(() => {
		if (!active) {
			return;
		}
		const timer = window.setTimeout(() => {
			clearReward();
		}, BURST_MS);
		return () => {
			window.clearTimeout(timer);
		};
	}, [active, clearReward]);

	if (!active) {
		return null;
	}

	return (
		<div
			className={`${styles.coinBurstRoot} ${
				themeClass === 'hacking' ? styles.coinBurstHacking : ''
			}`}
			data-testid="live-comp-coin-burst"
			data-amount={active.amount}
			data-celebrate={active.celebrate ? 'true' : 'false'}
			data-reward-key={active.key}
			aria-live="polite"
		>
			{active.celebrate ? (
				<div className={styles.coinBurstConfetti} data-testid="live-comp-coin-burst-confetti">
					{Array.from({ length: 14 }, (_, i) => (
						<span
							key={i}
							className={styles.coinBurstConfettiPiece}
							style={{ ['--i' as string]: String(i) }}
						/>
					))}
				</div>
			) : null}
			<div className={styles.coinBurstBadge} data-testid="live-comp-coin-burst-badge">
				<span className={styles.coinBurstPlus}>+{active.amount}</span>
				<img src={LIVE_PLAY_ASSET.coin} alt="" width={36} height={36} draggable={false} />
			</div>
		</div>
	);
}
