import { useIntl } from 'react-intl';
import styled from 'styled-components';
import { theme } from 'global-styles';
import type { DashboardAssignmentItem } from 'lib/dashboardApi';
import AssignmentListActionControl from './AssignmentListActionControl';
import {
	getSubjectIndicatorColor,
	type AssignTab,
} from './myAssignmentsUtils';

/** Figma `1stColumn` / `assCards` (`1767:1922` → `1767:1924`) inside `gridFrame`. */
const WIDGET_PADDING_X = 32;
const WIDGET_PADDING_Y = 24;
const PANEL_RADIUS = 16;


const WidgetCard = styled.section`
	background: ${theme.colours.white};
	border-radius: 20px;
	box-shadow: 0 1px 10px rgba(0, 0, 0, 0.06);
	padding: ${WIDGET_PADDING_Y}px ${WIDGET_PADDING_X}px;
	box-sizing: border-box;
`;

const Title = styled.h2`
	margin: 0 0 16px;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 500;
	font-size: 20px;
	line-height: 1.35;
	color: #442817;
`;

/** ~3 assignment rows visible before internal scroll. */
const ASSIGNMENT_ROW_MIN_HEIGHT = 52;
const ASSIGNMENT_ROW_GAP = 20;
const VISIBLE_ASSIGNMENT_ROWS = 3;
const LIST_SCROLL_MAX_HEIGHT =
	VISIBLE_ASSIGNMENT_ROWS * ASSIGNMENT_ROW_MIN_HEIGHT +
	(VISIBLE_ASSIGNMENT_ROWS - 1) * ASSIGNMENT_ROW_GAP;

const Panel = styled.div<{ $embedded?: boolean }>`
	background: ${({ $embedded }) => ($embedded ? 'transparent' : '#eef7fc')};
	border-radius: ${({ $embedded }) => ($embedded ? 0 : `${PANEL_RADIUS}px`)};
	padding: ${({ $embedded }) => ($embedded ? '0' : '20px 24px 16px')};
	box-sizing: border-box;
`;

const TabPanelBody = styled.div`
	margin-top: 0;
`;

const FullListWrap = styled.div`
	margin-top: 16px;
`;

const ListScroll = styled.div`
	margin-top: 16px;
	max-height: ${LIST_SCROLL_MAX_HEIGHT}px;
	overflow-y: auto;
	overflow-x: hidden;
	overscroll-behavior: contain;
	padding-inline-end: 4px;

	&::-webkit-scrollbar {
		width: 6px;
	}

	&::-webkit-scrollbar-thumb {
		border-radius: 999px;
		background: rgba(3, 155, 229, 0.35);
	}
`;

const List = styled.ul`
	list-style: none;
	margin: 0;
	padding: 0;
	display: flex;
	flex-direction: column;
	gap: ${ASSIGNMENT_ROW_GAP}px;
`;

const TabRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 24px;
	margin-bottom: 0;
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

const AssignmentRow = styled.li`
	display: flex;
	align-items: center;
	gap: 16px;
	min-height: ${ASSIGNMENT_ROW_MIN_HEIGHT}px;
`;

const SubjectStripe = styled.span<{ $color: string }>`
	flex-shrink: 0;
	width: 8px;
	height: 40px;
	border-radius: 999px;
	background: ${({ $color }) => $color};
`;

const AssignmentCopy = styled.div`
	flex: 1 1 auto;
	min-width: 0;
`;

const AssignmentTitle = styled.strong`
	display: block;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 500;
	font-size: 18px;
	line-height: 1.3;
	color: #442817;
`;

const DueLabel = styled.span`
	display: block;
	margin-top: 2px;
	font-family: ${theme.fonts.Nunito};
	font-weight: 600;
	font-size: 14px;
	line-height: 1.35;
	color: #937c61;
`;

const EmptyHint = styled.p`
	margin: 20px 0 4px;
	font-family: ${theme.fonts.Nunito};
	font-size: 15px;
	line-height: 1.4;
	color: #937c61;
	text-align: center;
`;

type Props = {
	activeTab: AssignTab;
	items: DashboardAssignmentItem[];
	onTabChange: (tab: AssignTab) => void;
	showTitle?: boolean;
	listMode?: 'scroll' | 'full';
	idPrefix?: string;
	embedded?: boolean;
	/** Called after Parent Submit / Assignment REDO so the list can refresh. */
	onActionComplete?: () => void;
};

const TABS: AssignTab[] = ['todo', 'past_due', 'completed'];

export default function MyAssignmentsWidget({
	activeTab,
	items,
	onTabChange,
	showTitle = true,
	listMode = 'scroll',
	idPrefix = 'dashboard',
	embedded = false,
	onActionComplete,
}: Props) {
	const { formatMessage } = useIntl();
	const renderRow = (item: DashboardAssignmentItem) => (
		<AssignmentRow key={`${item.assign_id}-${item.assign_student_id}`}>
			<SubjectStripe
				$color={getSubjectIndicatorColor(item.subject_id)}
				aria-hidden
			/>
			<AssignmentCopy>
				<AssignmentTitle>{item.title}</AssignmentTitle>
				{item.due_label ? <DueLabel>{item.due_label}</DueLabel> : null}
			</AssignmentCopy>
			<AssignmentListActionControl
				item={item}
				onActionComplete={onActionComplete}
			/>
		</AssignmentRow>
	);
	const listContent =
		items.length === 0 ? (
			<EmptyHint>{formatMessage({ id: 'dashboard-no-assignments' })}</EmptyHint>
		) : listMode === 'full' ? (
			<FullListWrap>
				<List>{items.map(renderRow)}</List>
			</FullListWrap>
		) : (
			<ListScroll>
				<List>{items.map(renderRow)}</List>
			</ListScroll>
		);

	const panel = (
		<Panel $embedded={embedded}>
			<TabRow role="tablist" aria-label={formatMessage({ id: 'dashboard-my-assignments' })}>
				{TABS.map((tab) => (
					<TabButton
						key={tab}
						type="button"
						role="tab"
						id={`${idPrefix}-assign-tab-${tab}`}
						aria-selected={activeTab === tab}
						aria-controls={`${idPrefix}-assign-panel-${tab}`}
						$active={activeTab === tab}
						onClick={() => onTabChange(tab)}
					>
						{formatMessage({ id: `dashboard-tab-${tab}` })}
					</TabButton>
				))}
			</TabRow>

			<TabPanelBody
				role="tabpanel"
				id={`${idPrefix}-assign-panel-${activeTab}`}
				aria-labelledby={`${idPrefix}-assign-tab-${activeTab}`}
			>
				{listContent}
			</TabPanelBody>
		</Panel>
	);

	if (embedded) {
		return panel;
	}

	return (
		<WidgetCard aria-labelledby={showTitle ? `${idPrefix}-my-assignments-title` : undefined}>
			{showTitle ? (
				<Title id={`${idPrefix}-my-assignments-title`}>
					{formatMessage({ id: 'dashboard-my-assignments' })}
				</Title>
			) : null}
			{panel}
		</WidgetCard>
	);
}
