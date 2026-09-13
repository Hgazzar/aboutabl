import { useState } from 'react';
import { useIntl } from 'react-intl';
import styled from 'styled-components';
import { figmaProfileAssetUrl } from 'config/figmaAssets';
import { theme } from 'global-styles';
import type { DashboardPayload } from 'lib/dashboardApi';
import AssignmentListActionControl from 'views/dashboard/components/AssignmentListActionControl';
import {
	getSubjectIndicatorColor,
	type AssignTab,
} from 'views/dashboard/components/myAssignmentsUtils';
import {
	assignmentsForTab,
	formatProfileAssignmentLabel,
	hasProfileAssignments,
} from '../profileAssignmentsUtils';
import { EmptyState } from './profileLayout';

const PROGRESS_ICON = figmaProfileAssetUrl('progress-icon.png');

const Section = styled.section`
	display: flex;
	flex-direction: column;
	gap: 14px;
	width: 100%;
	max-width: 720px;
`;

const SectionHead = styled.h2`
	display: flex;
	align-items: center;
	gap: 10px;
	margin: 0;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 500;
	font-size: 22px;
	line-height: 1.35;
	color: #1f1e1e;

	img {
		width: 28px;
		height: 28px;
		object-fit: contain;
	}
`;

const Panel = styled.div`
	background: #eef7fc;
	border-radius: 16px;
	padding: 20px 24px 16px;
	box-sizing: border-box;
	box-shadow:
		0 2px 4px rgba(0, 0, 0, 0.1),
		0 4px 8px rgba(0, 0, 0, 0.14);
`;

const TabRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 24px;
	padding-bottom: 12px;
	border-bottom: 1px solid #cfe8f5;
`;

const TabButton = styled.button<{ $active: boolean }>`
	position: relative;
	border: none;
	background: transparent;
	padding: 0 0 10px;
	font-family: ${theme.fonts.Nunito};
	font-weight: 700;
	font-size: 16px;
	line-height: 1.25;
	color: #442817;
	cursor: pointer;

	&::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		height: 3px;
		border-radius: 999px;
		background: ${({ $active }) => ($active ? '#039BE5' : 'transparent')};
	}

	&:hover {
		color: #1ebba3;
	}

	&:focus-visible {
		outline: 2px solid #442817;
		outline-offset: 4px;
	}
`;

const List = styled.ul`
	list-style: none;
	margin: 16px 0 0;
	padding: 0;
	display: flex;
	flex-direction: column;
	gap: 20px;
`;

const AssignmentRow = styled.li`
	display: flex;
	align-items: center;
	gap: 16px;
	min-height: 52px;
`;

const SubjectStripe = styled.span<{ $color: string }>`
	flex-shrink: 0;
	width: 8px;
	height: 40px;
	border-radius: 999px;
	background: ${({ $color }) => $color};
`;

const AssignmentTitle = styled.strong`
	flex: 1 1 auto;
	min-width: 0;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 500;
	font-size: 18px;
	line-height: 1.3;
	color: #442817;
`;

const TabEmptyHint = styled.p`
	margin: 16px 0 0;
	font-family: ${theme.fonts.Nunito};
	font-size: 15px;
	line-height: 1.4;
	color: #937c61;
	text-align: center;
`;

const TABS: AssignTab[] = ['todo', 'past_due', 'completed'];

type Props = {
	assignments?: DashboardPayload['assignments'];
	loading?: boolean;
	error?: string | null;
	onActionComplete?: () => void;
};

export default function ProfileAssignmentsSection({
	assignments,
	loading = false,
	error = null,
	onActionComplete,
}: Props) {
	const { formatMessage } = useIntl();
	const [activeTab, setActiveTab] = useState<AssignTab>('todo');
	const items = assignmentsForTab(assignments?.tabs, activeTab);

	return (
		<Section>
			<SectionHead>
				<img src={PROGRESS_ICON} alt="" />
				{formatMessage({ id: 'My-assignments' })}
			</SectionHead>

			{loading ? (
				<EmptyState>{formatMessage({ id: 'profile-assignments-loading' })}</EmptyState>
			) : error ? (
				<EmptyState role="alert">{error}</EmptyState>
			) : !hasProfileAssignments(assignments?.tabs) ? (
				<EmptyState>{formatMessage({ id: 'profile-assignments-empty' })}</EmptyState>
			) : (
				<Panel>
					<TabRow role="tablist" aria-label={formatMessage({ id: 'My-assignments' })}>
						{TABS.map((tab) => (
							<TabButton
								key={tab}
								type="button"
								role="tab"
								id={`profile-assign-tab-${tab}`}
								aria-selected={activeTab === tab}
								aria-controls={`profile-assign-panel-${tab}`}
								$active={activeTab === tab}
								onClick={() => setActiveTab(tab)}
							>
								{formatMessage({ id: `dashboard-tab-${tab}` })}
							</TabButton>
						))}
					</TabRow>

					<div
						role="tabpanel"
						id={`profile-assign-panel-${activeTab}`}
						aria-labelledby={`profile-assign-tab-${activeTab}`}
					>
						{items.length === 0 ? (
							<TabEmptyHint>{formatMessage({ id: 'dashboard-no-assignments' })}</TabEmptyHint>
						) : (
							<List>
								{items.map((item) => (
									<AssignmentRow key={`${item.assign_id}-${item.assign_student_id}`}>
										<SubjectStripe
											$color={getSubjectIndicatorColor(item.subject_id)}
											aria-hidden
										/>
										<AssignmentTitle>{formatProfileAssignmentLabel(item)}</AssignmentTitle>
										<AssignmentListActionControl
											item={item}
											onActionComplete={onActionComplete}
										/>
									</AssignmentRow>
								))}
							</List>
						)}
					</div>
				</Panel>
			)}
		</Section>
	);
}
