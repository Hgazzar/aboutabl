import { useCallback, useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { useNavigate, useParams } from 'react-router-dom';
import { getRequest } from 'lib/requests';
import LoadingPartially from 'components/loading-partially';
import { useBodyGameMode, type GameBodyMode } from '../hooks/useBodyGameMode';
import { useTypeSpecificLegacyCss } from '../hooks/useTypeSpecificLegacyCss';
import { gameLogoSrc } from '../utils/gameLogo';

type TopRow = { student_id: number; total_answer: number; name?: string };

function readLocalName(): string {
	try {
		const raw = localStorage.getItem('user_info');
		if (!raw) return '';
		const u = JSON.parse(raw);
		return String(u?.name ?? u?.name_ar ?? '');
	} catch {
		return '';
	}
}

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

export default function FactsScreen() {
	const { gameId } = useParams();
	const navigate = useNavigate();
	const { formatMessage } = useIntl();
	const [top, setTop] = useState<TopRow[]>([]);
	const [gameName, setGameName] = useState('');
	const [gameType, setGameType] = useState<string>('classic');
	const [gameLogo, setGameLogo] = useState<string | undefined>();
	const [loading, setLoading] = useState(true);
	const [isFirst, setIsFirst] = useState(false);
	const [myCorrect, setMyCorrect] = useState(0);
	const [qTotal, setQTotal] = useState(1);
	const [coins] = useState(readInitialCoins);

	const bodyMode: GameBodyMode | null = useMemo(() => {
		if (gameType === 'hacking') return 'mode-hacking';
		if (gameType === 'gold_quest') return 'mode-gold-quest';
		return 'mode-classic';
	}, [gameType]);

	useBodyGameMode(bodyMode);
	useTypeSpecificLegacyCss(gameType);

	const myName = useMemo(() => readLocalName(), []);

	const load = useCallback(async () => {
		if (!gameId) return;
		setLoading(true);
		try {
			const factsRes: any = await getRequest(`interactive-games/${gameId}/facts`);
			if (factsRes?.status && factsRes.data) {
				setTop(factsRes.data.top_students || []);
				setIsFirst(!!factsRes.data.is_first_place);
				setMyCorrect(Number(factsRes.data.my_correct_count) || 0);
				setQTotal(Math.max(1, Number(factsRes.data.questions_total) || 1));
				const g = factsRes.data.game;
				if (g) {
					setGameName(g.name || '');
					setGameType(g.type || 'classic');
					setGameLogo(g.logo);
				}
			} else {
				setTop([]);
			}
		} catch {
			setTop([]);
		} finally {
			setLoading(false);
		}
	}, [gameId]);

	useEffect(() => {
		load();
	}, [load]);

	const accuracyPct = Math.round((myCorrect / qTotal) * 1000) / 10;
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
			<input id="game_question_count" value={qTotal} hidden readOnly />
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
				{loading ? (
					<LoadingPartially />
				) : (
					<div className="container">
						<div className="winnerStudent">
							{isFirst ? <h1>{formatMessage({ id: 'gameFactsFirstPlace' })}</h1> : null}
							<div className="studentInfo">
								{isFirst ? (
									<div className="stTag">
										<img src="/assets/games/images/king.gif" alt="" />
									</div>
								) : null}
								<img src="/assets/games/icons/person.svg" alt="student-img" className="person-facts-icon" />
								<h2>{myName || formatMessage({ id: 'gameFactsYou' })}</h2>
							</div>
						</div>
						<div className="listpracticipants mainWaiting mainWaiting_student">
							<div className="numpracticipants numpracticipants_student">
								<img src="/assets/games/icons/people.svg" alt="groupPeople" />
								<span>Top 3</span>
							</div>
							<div className="ListStudents">
								<table>
									<thead>
										<tr>
											<td>Rank</td>
											<td>Name</td>
											<td>Score</td>
										</tr>
									</thead>
									<tbody>
										{top.length === 0 ? (
											<tr>
												<td colSpan={3} style={{ textAlign: 'center', padding: 16 }}>
													{formatMessage({ id: 'gameResultsEmpty' })}
												</td>
											</tr>
										) : (
											top.map((student, index) => (
												<tr key={student.student_id}>
													<td>{index + 1}</td>
													<td className="personData">
														<img src="/assets/games/icons/person.svg" alt="person-icon" className="person-icon" />
														<span>{student.name || `#${student.student_id}`}</span>
													</td>
													<td className="personScore">
														<span>{student.total_answer}</span>/<span>{qTotal}</span>
													</td>
												</tr>
											))
										)}
									</tbody>
								</table>
							</div>
						</div>
						<div className="ACCURACY">
							<div className="accuracyTitle">
								<h3>ACCURACY :</h3>
								<span>
									{myCorrect} / {qTotal}
								</span>
							</div>
							<div className="accuracyPercentage">{accuracyPct}%</div>
						</div>
						<button type="button" className="Viewdetails" onClick={() => navigate(`/games/${gameId}/answer-list`)}>
							{formatMessage({ id: 'gameFactsViewDetails' })}
						</button>
					</div>
				)}
			</main>
		</>
	);
}
