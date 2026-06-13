import { useCallback, useState } from 'react';
import { useIntl } from 'react-intl';
import { useNavigate, useParams } from 'react-router-dom';
import { postRequest } from 'lib/requests';
import LoadingPartially from 'components/loading-partially';
import { useBodyGameMode } from '../hooks/useBodyGameMode';
import { useGameCountdown } from '../hooks/useGameCountdown';
import { useGameMode } from '../hooks/useGameMode';
import { goldQuestionIdxKey } from './Question';
import { toast } from 'react-toastify';
import { gameLogoSrc } from '../utils/gameLogo';

function readInitialCoins(): number {
	try {
		const raw = localStorage.getItem('user_info');
		if (!raw) return 0;
		const u = JSON.parse(raw);
		const n = Number(u?.games_coins);
		return Number.isFinite(n) ? n : 0;
	} catch {
		return 0;
	}
}

const CHESTS = [
	'/assets/games/images/treasure1.png',
	'/assets/games/images/treasure2.png',
	'/assets/games/images/treasure3.png',
];
const OUT: Record<string, string> = {
	gold1: '/assets/games/images/gold1.png',
	gold2: '/assets/games/images/gold2.png',
	gold3: '/assets/games/images/gold3.png',
};

export default function GoldQuestGifts() {
	const { gameId } = useParams();
	const navigate = useNavigate();
	const { formatMessage } = useIntl();
	const { loading, game, questions } = useGameMode(gameId);
	const [coins] = useState(readInitialCoins);
	const [revealed, setRevealed] = useState<(string | null)[]>([null, null, null]);
	const [busySlot, setBusySlot] = useState<number | null>(null);
	const [winBanner, setWinBanner] = useState<string | null>(null);

	useBodyGameMode('mode-gold-quest');

	const onExpire = useCallback(() => {
		if (!gameId) return;
		sessionStorage.removeItem(goldQuestionIdxKey(gameId));
		navigate(`/games/${gameId}/facts`);
	}, [gameId, navigate]);

	const { mm, ss } = useGameCountdown(gameId, game?.time, onExpire);

	const qTotal = questions.length;

	const bumpQuestionIdx = () => {
		if (!gameId) return 0;
		const raw = sessionStorage.getItem(goldQuestionIdxKey(gameId));
		const cur = raw ? parseInt(raw, 10) || 0 : 0;
		const next = cur + 1;
		sessionStorage.setItem(goldQuestionIdxKey(gameId), String(next));
		return next;
	};

	const open = async (slot: number) => {
		if (!gameId || busySlot !== null || revealed[slot]) return;
		setBusySlot(slot);
		try {
			const res: any = await postRequest(`interactive-games/${gameId}/gifts/pull`, { variant: 'gold_quest' });
			if (!res?.status || !res.data) {
				toast.error(res?.message || 'Request failed');
				return;
			}
			const outcome = res.data.outcome as string;
			const delta = Number(res.data.coins_delta) || 0;
			setRevealed((prev) => {
				const n = [...prev];
				n[slot] = outcome;
				return n;
			});
			setWinBanner(outcome);
			toast.success(formatMessage({ id: 'gameGoldWinCoins' }, { n: delta }));
			window.setTimeout(() => {
				if (!gameId) return;
				const nextIdx = bumpQuestionIdx();
				if (qTotal <= 0 || nextIdx >= qTotal) {
					sessionStorage.removeItem(goldQuestionIdxKey(gameId));
					navigate(`/games/${gameId}/facts`);
				} else {
					navigate(`/games/${gameId}/gold-quest/play`);
				}
			}, 800);
		} finally {
			setBusySlot(null);
		}
	};

	const logoSrc = gameLogoSrc(game?.logo, '/assets/games/images/gold_quest.png');

	return (
		<>
			<input id="game_id" value={gameId ?? ''} hidden readOnly />
			<input id="game_question_count" value={qTotal} hidden readOnly />
			<header className="header headerWait headerStatistics">
				<div className="container">
					<div className="logo">
						<img src={logoSrc} alt="logo" />
						<span>{game?.name}</span>
					</div>
					<div className="timer">
						<img src="/assets/games/icons/alarm.svg" alt="alarm" />
						<div className="time">
							<span className="minutes">{mm}</span>:<span className="seconds">{ss}</span>
						</div>
					</div>
					<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
						<span id="student_coins" style={{ fontSize: 25 }}>
							{coins}
						</span>
						<img style={{ width: 25 }} src="/assets/games/icons/coin.png" alt="" />
					</div>
				</div>
			</header>
			<main>
				<div className="container">
					{loading ? (
						<LoadingPartially />
					) : (
						<div className="Questions">
							<div className="question">
								<h1>{formatMessage({ id: 'gameGiftsChooseOutput' })}</h1>
							</div>
							<div className="answers chooseBox">
								{[0, 1, 2].map((slot) => (
									<div
										key={slot}
										className="answerCard chooseBoxcard"
										role="button"
										tabIndex={0}
										onClick={() => open(slot)}
										onKeyDown={(e) => {
											if (e.key === 'Enter' || e.key === ' ') {
												e.preventDefault();
												open(slot);
											}
										}}
										style={{
											pointerEvents: busySlot !== null || revealed[slot] ? 'none' : 'auto',
											opacity: busySlot !== null && busySlot !== slot ? 0.6 : 1,
										}}
									>
										<img
											src={revealed[slot] ? OUT[revealed[slot]!] || CHESTS[slot] : CHESTS[slot]}
											alt=""
											className="answerImage"
										/>
									</div>
								))}
							</div>
							<div id="win_gift">
								{winBanner && OUT[winBanner] ? (
									<img src={OUT[winBanner]} alt="" style={{ maxWidth: 220, marginTop: 24 }} />
								) : null}
							</div>
						</div>
					)}
				</div>
			</main>
		</>
	);
}
