import { useCallback, useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';
import { getRequest } from 'lib/requests';
import LoadingPartially from 'components/loading-partially';
import { useBodyGameMode, type GameBodyMode } from '../hooks/useBodyGameMode';
import { useTypeSpecificLegacyCss } from '../hooks/useTypeSpecificLegacyCss';
import { gameLogoSrc } from '../utils/gameLogo';

type AnswerRow = {
	id: number;
	interactive_game_question_id: number;
	answer: string;
	correct: boolean | number;
	question?: { question?: string };
};

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

export default function AnswerListScreen() {
	const { gameId } = useParams();
	const { formatMessage } = useIntl();
	const [rows, setRows] = useState<AnswerRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [gameName, setGameName] = useState('');
	const [gameType, setGameType] = useState<string>('classic');
	const [gameLogo, setGameLogo] = useState<string | undefined>();
	const [coins] = useState(readInitialCoins);

	const bodyMode: GameBodyMode | null = useMemo(() => {
		if (gameType === 'hacking') return 'mode-hacking';
		if (gameType === 'gold_quest') return 'mode-gold-quest';
		return 'mode-classic';
	}, [gameType]);

	useBodyGameMode(bodyMode);
	useTypeSpecificLegacyCss(gameType);

	const load = useCallback(async () => {
		if (!gameId) return;
		setLoading(true);
		try {
			const res: any = await getRequest(`interactive-games/${gameId}/answer-list`);
			if (res?.status && res.data) {
				setRows(res.data.student_answers || []);
				const g = res.data.game;
				if (g) {
					setGameName(g.name || '');
					setGameType(g.type || 'classic');
					setGameLogo(g.logo);
				}
			} else {
				setRows([]);
			}
		} catch {
			setRows([]);
		} finally {
			setLoading(false);
		}
	}, [gameId]);

	useEffect(() => {
		load();
	}, [load]);

	const logoSrc = gameLogoSrc(
		gameLogo,
		gameType === 'hacking'
			? '/assets/games/images/hacking_game.png'
			: gameType === 'gold_quest'
				? '/assets/games/images/gold_quest.png'
				: '/assets/games/images/animalTestImg.png'
	);

	return (
		<>
			<input id="game_id" value={gameId ?? ''} hidden readOnly />
			<header className="header headerWait headerStatistics">
				<div className="container">
					<div className="logo">
						<img src={logoSrc} alt="logo" />
						<span>{gameName}</span>
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
						<div className="answerList">
							<ul>
								{rows.length === 0 ? (
									<li>
										<span>{formatMessage({ id: 'gameMyAnswersEmpty' })}</span>
									</li>
								) : (
									rows.map((question, index) => {
										const qtext = question.question?.question ?? `Q${question.interactive_game_question_id}`;
										const ok = Number(question.correct) === 1;
										return (
											<li key={question.id}>
												<span>
													{index + 1}. {qtext}
												</span>
												{ok ? (
													<img src="/assets/games/icons/correct.svg" alt="correct" className="correct" />
												) : (
													<img src="/assets/games/icons/wrong.svg" alt="wrong" className="wrong" />
												)}
											</li>
										);
									})
								)}
							</ul>
						</div>
					)}
				</div>
			</main>
		</>
	);
}
