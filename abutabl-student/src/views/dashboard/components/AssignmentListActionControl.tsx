import { Link } from 'react-router-dom';
import { useIntl } from 'react-intl';
import styled from 'styled-components';
import type { DashboardAssignmentItem } from 'lib/dashboardApi';
import { theme } from 'global-styles';
import { assignmentPath } from './myAssignmentsUtils';

const ACTION_HEIGHT = 32;

const ActionLink = styled(Link)`
	flex-shrink: 0;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 100px;
	height: ${ACTION_HEIGHT}px;
	padding: 0 20px;
	border-radius: 999px;
	background: linear-gradient(90deg, #4fc3f7 0%, #039be5 100%);
	box-shadow: 0 2px 0 rgba(3, 155, 229, 0.35);
	font-family: ${theme.fonts.Nunito};
	font-weight: 700;
	font-size: 14px;
	line-height: 1;
	letter-spacing: 0.04em;
	text-transform: uppercase;
	text-decoration: none;
	color: ${theme.colours.white};
	transition: filter 0.15s ease;

	&:hover {
		filter: brightness(1.03);
	}

	&:focus-visible {
		outline: 2px solid #442817;
		outline-offset: 3px;
	}
`;

type Props = {
	item: DashboardAssignmentItem;
	/** Kept for call-site compatibility; list no longer mutates parent submit. */
	onActionComplete?: () => void;
};

/**
 * List CTA is always View → Assignment Detail.
 * Parent SUBMIT / REDO live on the detail page only.
 */
export default function AssignmentListActionControl({ item }: Props) {
	const { formatMessage } = useIntl();

	return (
		<ActionLink
			to={assignmentPath(item)}
			data-assign-action="view"
			data-assign-id={item.assign_id}
		>
			{formatMessage({ id: 'dashboard-view' })}
		</ActionLink>
	);
}
