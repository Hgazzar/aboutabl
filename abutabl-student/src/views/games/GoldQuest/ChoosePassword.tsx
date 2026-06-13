import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { postRequest } from 'lib/requests';
import { Terminal } from '../components/Terminal';
import { useBodyGameMode } from '../hooks/useBodyGameMode';
import { countdownStorageKey } from '../hooks/useGameCountdown';
import { generateUniquePasswords } from '../utils/generateGamePassword';

const GOLD_LINES = [
	'> new user connected...',
	'> welcome to Gold Quest...',
	'> please choose password...',
	'> Vault unlocked. Access Granted!',
];

export default function GoldQuestChoosePassword() {
	const { gameId } = useParams();
	const navigate = useNavigate();
	const [passwords] = useState(() => generateUniquePasswords(5, 6));
	const [busy, setBusy] = useState<string | null>(null);

	useBodyGameMode('mode-hacking');

	useEffect(() => {
		if (gameId) localStorage.removeItem(countdownStorageKey(gameId));
	}, [gameId]);

	const choose = async (password: string) => {
		if (!gameId || busy) return;
		setBusy(password);
		try {
			await postRequest(`interactive-games/${gameId}/password`, { password });
			navigate(`/games/${gameId}/lobby`);
		} finally {
			setBusy(null);
		}
	};

	return (
		<Terminal lines={GOLD_LINES} finalExtra="">
			{passwords.map((p) => (
				<a key={p} href="#" onClick={(e) => (e.preventDefault(), void choose(p))}>
					{busy === p ? '…' : p}
				</a>
			))}
		</Terminal>
	);
}
