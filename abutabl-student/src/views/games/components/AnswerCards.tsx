import lottie from 'lottie-web';
import { useEffect, useRef, useState } from 'react';
import type { GameQuestion } from '../hooks/useGameMode';

const CONFETTI_URL = 'https://assets8.lottiefiles.com/packages/lf20_touohxv0.json';

type Props = {
	question: GameQuestion;
	answers: string[];
	disabled: boolean;
	onSubmitAnswer: (answer: string) => Promise<{ correct: boolean; games_coins?: number }>;
	onAfterRound: (result: { correct: boolean }) => void;
	labels: {
		correctTitle: string;
		explanationTitle: string;
	};
};

function renderAnswerBody(question: GameQuestion, value: string) {
	if (question.answer_type === 'image' && value) {
		return <img src={value} alt="" />;
	}
	return value;
}

export function AnswerCards({ question, answers, disabled, onSubmitAnswer, onAfterRound, labels }: Props) {
	const [picked, setPicked] = useState<string | null>(null);
	const [phase, setPhase] = useState<'idle' | 'success' | 'explaining'>('idle');
	const lottieRef = useRef<HTMLDivElement | null>(null);
	const lottieInst = useRef<ReturnType<typeof lottie.loadAnimation> | null>(null);

	useEffect(() => {
		setPicked(null);
		setPhase('idle');
	}, [question.id]);

	useEffect(() => {
		return () => {
			lottieInst.current?.destroy();
			lottieInst.current = null;
		};
	}, []);

	const playConfetti = () => {
		if (!lottieRef.current) return;
		lottieInst.current?.destroy();
		lottieInst.current = lottie.loadAnimation({
			container: lottieRef.current,
			renderer: 'svg',
			loop: false,
			autoplay: true,
			path: CONFETTI_URL,
		});
	};

	const pick = async (answer: string) => {
		if (disabled || picked) return;
		setPicked(answer);
		let isCorrect = false;
		try {
			const res = await onSubmitAnswer(answer);
			isCorrect = !!res.correct;
		} catch {
			isCorrect = String(question.correct_answer ?? '').trim() === String(answer).trim();
		}

		if (isCorrect) {
			setPhase('success');
			playConfetti();
			window.setTimeout(() => {
				onAfterRound({ correct: true });
				setPicked(null);
				setPhase('idle');
			}, 4500);
		} else {
			setPhase('explaining');
			window.setTimeout(() => {
				onAfterRound({ correct: false });
				setPicked(null);
				setPhase('idle');
			}, 4500);
		}
	};

	const locked = disabled || !!picked;

	return (
		<>
			<div className="answers">
				{answers.map((a, i) => {
					const isSel = picked === a;
					const cls = [
						'answerCard',
						isSel && phase === 'success' ? 'successAnswer' : '',
						isSel && phase === 'explaining' ? 'wrongAnswer' : '',
					]
						.filter(Boolean)
						.join(' ');
					return (
						<div
							key={`${question.id}-${i}`}
							id={`answerCard${i + 1}`}
							className={cls}
							role="button"
							tabIndex={0}
							onClick={() => !locked && pick(a)}
							onKeyDown={(e) => {
								if ((e.key === 'Enter' || e.key === ' ') && !locked) {
									e.preventDefault();
									pick(a);
								}
							}}
							style={{ position: 'relative', cursor: locked ? 'default' : 'pointer' }}
						>
							{renderAnswerBody(question, a)}
							{phase === 'success' && isSel ? (
								<div
									id="lottieAnimation"
									ref={lottieRef}
									style={{
										width: 150,
										height: 150,
										marginTop: 10,
										position: 'absolute',
										top: '50%',
										left: '50%',
										transform: 'translate(-50%, -50%)',
									}}
									aria-hidden
								/>
							) : null}
						</div>
					);
				})}
			</div>
			<div id="show_correct_answer">
				{phase === 'explaining' && picked ? (
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
						<h1 style={{ fontSize: '1.25rem' }}>
							<strong>{labels.correctTitle}</strong> {question.correct_answer || '—'}
						</h1>
						{question.explanation ? (
							<div style={{ marginTop: 12 }}>
								<strong>{labels.explanationTitle}</strong>
								<div>{question.explanation}</div>
							</div>
						) : null}
					</div>
				) : null}
			</div>
		</>
	);
}
