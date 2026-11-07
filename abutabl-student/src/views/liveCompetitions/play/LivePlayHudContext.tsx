import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
	type ReactNode,
} from 'react';

type LivePlayHudContextValue = {
	timerSeconds: number | null;
	setTimerSeconds: (value: number | null) => void;
};

const LivePlayHudContext = createContext<LivePlayHudContextValue | null>(null);

const NOOP_SET_TIMER = (_value: number | null) => {};

const FALLBACK_HUD: LivePlayHudContextValue = {
	timerSeconds: null,
	setTimerSeconds: NOOP_SET_TIMER,
};

export function LivePlayHudProvider({ children }: { children: ReactNode }) {
	const [timerSeconds, setTimerSecondsState] = useState<number | null>(null);
	const setTimerSeconds = useCallback((value: number | null) => {
		setTimerSecondsState(value);
	}, []);
	const value = useMemo(
		() => ({ timerSeconds, setTimerSeconds }),
		[timerSeconds, setTimerSeconds]
	);
	return (
		<LivePlayHudContext.Provider value={value}>{children}</LivePlayHudContext.Provider>
	);
}

export function useLivePlayHudTimer(): LivePlayHudContextValue {
	return useContext(LivePlayHudContext) ?? FALLBACK_HUD;
}
