import { resolveLivePlayMediaUrl } from './livePlayMediaUrl';
import styles from './livePlayExperience.module.css';

type FeedbackTone = 'correct' | 'wrong' | null;

type Props = {
	choices: string[];
	answerType?: string;
	disabled?: boolean;
	selected?: string | null;
	feedbackTone?: FeedbackTone;
	onPick: (choice: string) => void;
	testIdPrefix?: string;
};

export default function LivePlayAnswerCards({
	choices,
	answerType,
	disabled = false,
	selected = null,
	feedbackTone = null,
	onPick,
	testIdPrefix = 'live-comp-question',
}: Props) {
	const isImage = answerType === 'image';

	return (
		<div className={styles.answers} data-testid={`${testIdPrefix}-choices`}>
			{choices.map((choice) => {
				const isSelected = selected === choice;
				const className = [
					styles.answerCard,
					isSelected && feedbackTone === 'correct' ? styles.answerSuccess : '',
					isSelected && feedbackTone === 'wrong' ? styles.answerWrong : '',
				]
					.filter(Boolean)
					.join(' ');
				const imageSrc = isImage ? resolveLivePlayMediaUrl(choice) : null;

				return (
					<button
						key={choice}
						type="button"
						className={className}
						disabled={disabled}
						onClick={() => onPick(choice)}
						data-testid={`${testIdPrefix}-choice`}
						data-choice={choice}
					>
						{isImage && imageSrc ? (
							<img src={imageSrc} alt="" style={{ maxHeight: 96, maxWidth: '100%' }} />
						) : (
							choice
						)}
					</button>
				);
			})}
		</div>
	);
}
