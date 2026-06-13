import { useState, useEffect } from 'react';
import PreviewHeader from '../components/PreviewHeader';
import Classification from '../components/Classification';
import StudyCard from '../components/StudyCard';
import { useIntl } from 'react-intl';
import { getRequest } from 'lib/requests';

export type ProgressClassification = {
	tier: string;
	tier_key?: string;
	description: string;
	next_tier: string | null;
	next_tier_message: string | null;
	progress_percent: number;
	badge_image?: string | null;
};

export type ProgressStats = {
	assessment_finished: number;
	assessment_total: number;
	subjects_finished: number;
	subjects_total: number;
	questions_solved: number;
	questions_total: number;
	homework_finished: number;
	homework_total: number;
};

const defaultClassification: ProgressClassification = {
	tier: 'Silver',
	description: 'Submit on time , complete your task and homework to increase the progress',
	next_tier: 'Golden',
	next_tier_message: 'Next tire is the Golden tire',
	progress_percent: 55,
};

const defaultStats: ProgressStats = {
	assessment_finished: 0,
	assessment_total: 0,
	subjects_finished: 0,
	subjects_total: 0,
	questions_solved: 0,
	questions_total: 0,
	homework_finished: 0,
	homework_total: 0,
};

function percent(current: number, total: number): number {
	if (total <= 0) return 0;
	return Math.round((current / total) * 100);
}

function levelLabel(current: number, total: number): string {
	return `${current}/${total}`;
}

function PreviewStudy() {
	const { formatMessage } = useIntl();
	const [classification, setClassification] = useState<ProgressClassification>(defaultClassification);
	const [stats, setStats] = useState<ProgressStats>(defaultStats);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		getRequest('progress')
			.then((res: { data?: { progress?: { classification?: ProgressClassification; stats?: ProgressStats } }; progress?: { classification?: ProgressClassification; stats?: ProgressStats } }) => {
				const progress = res?.data?.progress ?? res?.progress ?? null;
				if (progress?.classification) setClassification(progress.classification);
				if (progress?.stats) setStats(progress.stats);
			})
			.catch(() => {})
			.finally(() => setLoading(false));
	}, []);

	const assessmentLevel = levelLabel(stats.assessment_finished, stats.assessment_total);
	const assessmentPct = percent(stats.assessment_finished, stats.assessment_total);
	const subjectsLevel = levelLabel(stats.subjects_finished, stats.subjects_total);
	const subjectsPct = percent(stats.subjects_finished, stats.subjects_total);
	const questionsLevel = levelLabel(stats.questions_solved, stats.questions_total);
	const questionsPct = percent(stats.questions_solved, stats.questions_total);
	const homeworkLevel = levelLabel(stats.homework_finished, stats.homework_total);
	const homeworkPct = percent(stats.homework_finished, stats.homework_total);

	return (
		<div>
			<PreviewHeader title={formatMessage({ id: 'My-Progress' })} />
			<div className="p-8 flex flex-col gap-8">
				<Classification
					data={classification}
					loading={loading}
				/>
				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-8">
					<StudyCard
						background="#FAF8F4"
						pieColors={{ background: '#F9EFDC', color: '#E9D5AC' }}
						level={assessmentLevel}
						percentage={assessmentPct}
						title={formatMessage({ id: 'Assessment-Finished' })}
					/>
					<StudyCard
						background="#F0FCF8"
						pieColors={{ background: '#CAEFE7', color: '#9DD1C4' }}
						level={subjectsLevel}
						percentage={subjectsPct}
						title={formatMessage({ id: 'Total-Subjects' })}
					/>
					<StudyCard
						background="#FEF0FE"
						pieColors={{ background: '#F1DDF1', color: '#E6B5E6' }}
						level={questionsLevel}
						percentage={questionsPct}
						title={formatMessage({ id: 'Questions-Solved' })}
					/>
					<StudyCard
						background="#FBF8F0"
						pieColors={{ background: '#F9EFDC', color: '#E9D5AC' }}
						level={homeworkLevel}
						percentage={homeworkPct}
						title={formatMessage({ id: 'Homework-Finished' })}
					/>
				</div>
			</div>
		</div>
	);
}

export default PreviewStudy;
