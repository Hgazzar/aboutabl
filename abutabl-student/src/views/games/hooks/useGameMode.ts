import { useCallback, useEffect, useState } from 'react';
import { getRequest } from 'lib/requests';

export type GameQuestion = {
	id: number;
	question?: string;
	answer1?: string;
	answer2?: string;
	answer3?: string;
	answer4?: string;
	correct_answer?: string;
	explanation?: string | null;
	image?: string;
	voice_url?: string;
	answer_type?: string;
	sort_order?: number;
};

export type GameMeta = {
	id: number;
	name?: string;
	logo?: string;
	time?: string;
	type?: string;
};

export function useGameMode(gameId: string | undefined) {
	const [loading, setLoading] = useState(true);
	const [game, setGame] = useState<GameMeta | null>(null);
	const [questions, setQuestions] = useState<GameQuestion[]>([]);

	const load = useCallback(async () => {
		if (!gameId) {
			setLoading(false);
			return;
		}
		setLoading(true);
		try {
			const res: any = await getRequest(`interactive-games/${gameId}/questions`);
			if (res?.status && res.data) {
				setGame(res.data.game || null);
				const qs = [...(res.data.questions || [])] as GameQuestion[];
				qs.sort((a, b) => (a.sort_order ?? a.id) - (b.sort_order ?? b.id));
				setQuestions(qs);
			} else {
				setGame(null);
				setQuestions([]);
			}
		} catch {
			setGame(null);
			setQuestions([]);
		} finally {
			setLoading(false);
		}
	}, [gameId]);

	useEffect(() => {
		load();
	}, [load]);

	return { loading, game, questions, reload: load };
}
