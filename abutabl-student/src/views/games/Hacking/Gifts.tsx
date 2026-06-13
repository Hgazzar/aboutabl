import { useCallback, useState } from 'react';
import { useIntl } from 'react-intl';
import { useNavigate, useParams } from 'react-router-dom';
import { postRequest } from 'lib/requests';
import LoadingPartially from 'components/loading-partially';
import { useBodyGameMode } from '../hooks/useBodyGameMode';
import { useGameCountdown } from '../hooks/useGameCountdown';
import { useGameMode } from '../hooks/useGameMode';
import { hackingQuestionIdxKey } from './Question';
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

const BOX = '/assets/games/images/hack-box.png';
const OUT: Record<string, string> = {
	hacked: '/assets/games/images/hacked.png',
	luck: '/assets/games/images/luck.png',
	gold: '/assets/games/images/gold.png',
};

export default function HackingGifts() {
	const { gameId } = useParams();
	const navigate = useNavigate();
	const { formatMessage } = useIntl();
	const { loading, game, questions } = useGameMode(gameId);
	const [coins] = useState(readInitialCoins);
	const [revealed, setRevealed] = useState<(string | null)[]>([null, null, null]);
	const [busySlot, setBusySlot] = useState<number | null>(null);

	useBodyGameMode('mode-hacking');

	const onExpire = useCallback(() => {
		if (!gameId) return;
		sessionStorage.removeItem(hackingQuestionIdxKey(gameId));
		navigate(`/games/${gameId}/facts`);
	}, [gameId, navigate]);

	const { mm, ss } = useGameCountdown(gameId, game?.time, onExpire);

	const qTotal = questions.length;

	const bumpQuestionIdx = () => {
		if (!gameId) return 0;
		const raw = sessionStorage.getItem(hackingQuestionIdxKey(gameId));
		const cur = raw ? parseInt(raw, 10) || 0 : 0;
		const next = cur + 1;
		sessionStorage.setItem(hackingQuestionIdxKey(gameId), String(next));
		return next;
	};

	const goNext = (outcome: string) => {
		window.setTimeout(() => {
			if (!gameId) return;
			if (outcome === 'hacked') {
				navigate(`/games/${gameId}/hacking`);
				return;
			}
			const nextIdx = bumpQuestionIdx();
			if (qTotal <= 0 || nextIdx >= qTotal) {
				sessionStorage.removeItem(hackingQuestionIdxKey(gameId));
				navigate(`/games/${gameId}/facts`);
			} else {
				navigate(`/games/${gameId}/hacking/play`);
			}
		}, 500);
	};

	const open = async (slot: number) => {
		if (!gameId || busySlot !== null || revealed[slot]) return;
		setBusySlot(slot);
		try {
			const res: any = await postRequest(`interactive-games/${gameId}/gifts/pull`, { variant: 'hacking' });
			if (!res?.status || !res.data) {
				toast.error(res?.message || 'Request failed');
				return;
			}
			const outcome = res.data.outcome as string;
			setRevealed((prev) => {
				const n = [...prev];
				n[slot] = outcome;
				return n;
			});
			goNext(outcome);
		} finally {
			setBusySlot(null);
		}
	};

	const logoSrc = gameLogoSrc(game?.logo, '/assets/games/images/hacking_game.png');

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
											src={revealed[slot] ? OUT[revealed[slot]!] || BOX : BOX}
											alt=""
											className="answerImage"
										/>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			</main>
		</>
	);
}
