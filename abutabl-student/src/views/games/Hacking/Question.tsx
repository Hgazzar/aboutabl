import { Button, Stack, Text } from '@mantine/core';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { useNavigate, useParams } from 'react-router-dom';
import { postRequest } from 'lib/requests';
import LoadingPartially from 'components/loading-partially';
import { AnswerCards } from '../components/AnswerCards';
import { useBodyGameMode } from '../hooks/useBodyGameMode';
import { useGameCountdown } from '../hooks/useGameCountdown';
import { useGameMode } from '../hooks/useGameMode';
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

export const hackingQuestionIdxKey = (id: string) => `interactive_game_q_idx_${id}`;

export default function HackingQuestion() {
	const { gameId } = useParams();
	const navigate = useNavigate();
	const { formatMessage } = useIntl();
	const { loading, game, questions } = useGameMode(gameId);
	const [idx, setIdx] = useState(0);
	const [coins, setCoins] = useState(readInitialCoins);
	const [submitting, setSubmitting] = useState(false);

	useBodyGameMode('mode-hacking');

	useEffect(() => {
		if (!gameId) return;
		const raw = sessionStorage.getItem(hackingQuestionIdxKey(gameId));
		setIdx(raw ? parseInt(raw, 10) || 0 : 0);
	}, [gameId]);

	const onExpire = useCallback(() => {
		if (!gameId) return;
		sessionStorage.removeItem(hackingQuestionIdxKey(gameId));
		navigate(`/games/${gameId}/facts`);
	}, [gameId, navigate]);

	const { mm, ss } = useGameCountdown(gameId, game?.time, onExpire);

	const total = questions.length;
	const current = questions[idx];

	const answers = useMemo(() => {
		if (!current) return [];
		return [current.answer1, current.answer2, current.answer3, current.answer4].filter(Boolean) as string[];
	}, [current]);

	const submitAnswer = async (answer: string) => {
		if (!current || !gameId) return { correct: false };
		const res: any = await postRequest('interactive-games/answer', {
			game_id: Number(gameId),
			question_id: current.id,
			answer,
		});
		if (res?.status && res.data) {
			setCoins(res.data.games_coins ?? coins);
			return { correct: !!res.data.correct, games_coins: res.data.games_coins };
		}
		return { correct: false };
	};

	const afterRound = ({ correct }: { correct: boolean }) => {
		if (!gameId) return;
		if (correct) {
			navigate(`/games/${gameId}/hacking/gifts`);
		}
	};

	const playVoice = (url: string) => {
		try {
			void new Audio(url).play();
		} catch {
			/* ignore */
		}
	};

	const logoSrc = gameLogoSrc(game?.logo, '/assets/games/images/hacking_game.png');

	return (
		<>
			<input id="game_id" value={gameId ?? ''} hidden readOnly />
			<input id="game_question_count" value={total} hidden readOnly />
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
					<div className="Questions" id="question_data">
						{loading ? (
							<LoadingPartially />
						) : !current ? (
							<Stack align="center" py={80} spacing="md">
								<Text fw={600}>{formatMessage({ id: 'gamePlayNoQuestions' })}</Text>
								<Button variant="light" onClick={() => navigate(`/games/${gameId}/lobby`)}>
									{formatMessage({ id: 'gamePlayBackLobby' })}
								</Button>
							</Stack>
						) : (
							<>
								<div className="question">
									<div className="questionNumber">
										<span id="question_num">{idx + 1}</span>/<span>{total}</span>
									</div>
									<div className="questionRow">
										{current.voice_url ? (
											<button
												type="button"
												className="musicBtnQuestion"
												onClick={() => playVoice(current.voice_url!)}
											>
												<img src="/assets/games/icons/mic.svg" alt="" width={40} />
											</button>
										) : null}
										{current.question ? <h1>{current.question}</h1> : null}
										{current.image ? (
											<div className="imgQuestion">
												<img src={current.image} alt="question-1" className="questionImg" />
											</div>
										) : null}
									</div>
								</div>
								<AnswerCards
									question={current}
									answers={answers}
									disabled={submitting}
									onSubmitAnswer={async (answer) => {
										setSubmitting(true);
										try {
											return await submitAnswer(answer);
										} finally {
											setSubmitting(false);
										}
									}}
									onAfterRound={afterRound}
									labels={{
										correctTitle: formatMessage({ id: 'gameCorrectAnswerLabel' }),
										explanationTitle: formatMessage({ id: 'gameExplanationLabel' }),
									}}
								/>
							</>
						)}
					</div>
				</div>
			</main>
		</>
	);
}
