import { useCallback, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { useNavigate, useParams } from 'react-router-dom';
import { getRequest, postRequest } from 'lib/requests';
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

export default function HackScreen() {
	const { gameId } = useParams();
	const navigate = useNavigate();
	const { formatMessage } = useIntl();
	const { loading: gameLoading, game } = useGameMode(gameId);
	const [passwords, setPasswords] = useState<string[]>([]);
	const [targetId, setTargetId] = useState<number | null>(null);
	const [targetName, setTargetName] = useState('');
	const [hLoading, setHLoading] = useState(true);
	const [coins, setCoins] = useState(readInitialCoins);
	const [successBanner, setSuccessBanner] = useState(false);
	const [frozen, setFrozen] = useState(false);

	useBodyGameMode('mode-hacking');

	const onExpire = useCallback(() => {
		if (!gameId) return;
		sessionStorage.removeItem(hackingQuestionIdxKey(gameId));
		navigate(`/games/${gameId}/facts`);
	}, [gameId, navigate]);

	const { mm, ss } = useGameCountdown(gameId, game?.time, onExpire);

	const loadHack = useCallback(async () => {
		if (!gameId) return;
		setHLoading(true);
		try {
			const res: any = await getRequest(`interactive-games/${gameId}/hacking`);
			if (res?.status && res.data) {
				setPasswords(res.data.passwords || []);
				setTargetId(res.data.target_student_id);
				setTargetName(res.data.target_student_name || '');
			} else {
				setPasswords([]);
			}
		} catch {
			setPasswords([]);
		} finally {
			setHLoading(false);
		}
	}, [gameId]);

	useEffect(() => {
		loadHack();
	}, [loadHack]);

	const bumpQuestionIdx = () => {
		if (!gameId) return 0;
		const raw = sessionStorage.getItem(hackingQuestionIdxKey(gameId));
		const cur = raw ? parseInt(raw, 10) || 0 : 0;
		const next = cur + 1;
		sessionStorage.setItem(hackingQuestionIdxKey(gameId), String(next));
		return next;
	};

	const goAfterHackSuccess = async () => {
		if (!gameId) return;
		const nextIdx = bumpQuestionIdx();
		const g: any = await getRequest(`interactive-games/${gameId}`);
		const qTotal = Number(g?.game?.questions_count) || 0;
		if (qTotal > 0 && nextIdx >= qTotal) {
			sessionStorage.removeItem(hackingQuestionIdxKey(gameId));
			navigate(`/games/${gameId}/facts`);
		} else {
			navigate(`/games/${gameId}/hacking/play`);
		}
	};

	const pick = async (pwd: string) => {
		if (!targetId || !gameId || frozen) return;
		setFrozen(true);
		try {
			const res: any = await postRequest('interactive-games/hacking', {
				id: targetId,
				password_guess: pwd,
			});
			if (!res?.status) {
				toast.error(res?.message || formatMessage({ id: 'gameHackWrong' }));
				navigate(`/games/${gameId}/hacking/play`);
				setFrozen(false);
				return;
			}
			const gained = res.data?.coins_gained ?? 0;
			if (gained > 0) {
				toast.success(formatMessage({ id: 'gameHackStoleCoins' }, { n: gained }));
			}
			if (res.data?.games_coins != null) setCoins(Number(res.data.games_coins));
			setSuccessBanner(true);
			window.setTimeout(() => {
				void goAfterHackSuccess();
			}, 1500);
		} catch {
			toast.error(formatMessage({ id: 'gameHackWrong' }));
			navigate(`/games/${gameId}/hacking/play`);
			setFrozen(false);
		}
	};

	const logoSrc = gameLogoSrc(game?.logo, '/assets/games/images/hacking_game.png');
	const loading = gameLoading || hLoading;

	return (
		<>
			<input id="game_id" value={gameId ?? ''} hidden readOnly />
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
						<div className="hackterminal">
							<div className="background" />
							<div className="question" style={{ textAlign: 'center', margin: 'auto', marginBottom: 50 }}>
								<h1>{formatMessage({ id: 'gameGuessPasswordTitle' })}</h1>
							</div>
							<div className="answers" style={{ width: '57%', margin: 'auto' }}>
								{passwords.map((p, index) => (
									<div
										key={`${p}-${index}`}
										className="answerCard passwordAnswerCard"
										id={`passwordAnswerCard${index}`}
										role="button"
										tabIndex={0}
										style={{ height: 70 }}
										onClick={() => pick(p)}
										onKeyDown={(e) => {
											if (e.key === 'Enter' || e.key === ' ') {
												e.preventDefault();
												pick(p);
											}
										}}
									>
										{p}
									</div>
								))}
							</div>
							<div id="show_correct_answer">
								{successBanner ? (
									<div
										className="question"
										style={{
											height: 'auto',
											display: 'grid',
											paddingBottom: 10,
											paddingTop: 10,
											maxWidth: 'max-content',
											alignItems: 'center',
											margin: '50px auto 0',
										}}
									>
										<h1>
											{formatMessage({ id: 'gameHackSuccessBanner' }, { name: targetName || `#${targetId}` })}
										</h1>
									</div>
								) : null}
							</div>
						</div>
					)}
				</div>
			</main>
		</>
	);
}
