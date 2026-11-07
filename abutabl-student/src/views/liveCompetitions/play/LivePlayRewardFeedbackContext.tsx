import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useRef,
	useState,
	type ReactNode,
} from 'react';
import type { LivePlayRewardBurst } from './livePlayRewardFeedback';
import { livePlayAudio } from './livePlayAudio';

type LivePlayRewardFeedbackValue = {
	active: LivePlayRewardBurst | null;
	showReward: (burst: LivePlayRewardBurst) => void;
	clearReward: () => void;
};

const LivePlayRewardFeedbackContext = createContext<LivePlayRewardFeedbackValue | null>(
	null
);

const NOOP_SHOW = (_burst: LivePlayRewardBurst) => {};
const NOOP_CLEAR = () => {};

const FALLBACK: LivePlayRewardFeedbackValue = {
	active: null,
	showReward: NOOP_SHOW,
	clearReward: NOOP_CLEAR,
};

export function LivePlayRewardFeedbackProvider({ children }: { children: ReactNode }) {
	const seenKeysRef = useRef<Set<string>>(new Set());
	const [active, setActive] = useState<LivePlayRewardBurst | null>(null);

	const clearReward = useCallback(() => {
		setActive(null);
	}, []);

	const showReward = useCallback((burst: LivePlayRewardBurst) => {
		if (!burst.key || burst.amount <= 0) {
			return;
		}
		if (seenKeysRef.current.has(burst.key)) {
			return;
		}
		seenKeysRef.current.add(burst.key);
		setActive(burst);
		livePlayAudio.playCue('reward_coins');
	}, []);

	const value = useMemo(
		() => ({ active, showReward, clearReward }),
		[active, showReward, clearReward]
	);

	return (
		<LivePlayRewardFeedbackContext.Provider value={value}>
			{children}
		</LivePlayRewardFeedbackContext.Provider>
	);
}

export function useLivePlayRewardFeedback(): LivePlayRewardFeedbackValue {
	return useContext(LivePlayRewardFeedbackContext) ?? FALLBACK;
}
