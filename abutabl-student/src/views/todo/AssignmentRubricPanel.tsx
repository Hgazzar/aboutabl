import { useState } from 'react';
import { useIntl } from 'react-intl';
import { createGlobalStyle } from 'styled-components';
import Modal from 'components/modal';
import { figmaDashboardAssetUrl } from 'config/figmaAssets';
import { theme } from 'global-styles';
import type { AssignmentRubricDefinition } from 'lib/assignmentDetailApi';
import {
	rubricLevelDescriptorVisible,
	sortedRubricCriteria,
	sortedRubricLevels,
} from './assignmentDetailState';
import {
	RubricCard,
	RubricCardLabel,
	RubricCardLead,
	RubricCriterionCard,
	RubricCriterionLabel,
	RubricCriterionTop,
	RubricCriterionWeight,
	RubricGridIcon,
	RubricLevelCheck,
	RubricLevelChip,
	RubricLevelDescriptor,
	RubricLevelName,
	RubricLevelPoints,
	RubricLevelSpacer,
	RubricLevelsRow,
	RubricModalBody,
	RubricModalCloseButton,
	RubricModalCloseX,
	RubricModalFooter,
	RubricModalHeader,
	RubricModalPoints,
	RubricModalShell,
	RubricModalTitle,
	RubricSection,
	RubricViewButton,
	SectionTitle,
} from './assignmentDetailStyles';

const RUBRIC_GRID_ICON = figmaDashboardAssetUrl('todo-rubric-grid-icon.png');

/** Defeat global `.mantine-Modal-body { padding-top: 32px !important }` for this popup only. */
const RubricModalFlushStyles = createGlobalStyle`
	.mantine-Modal-content.assignRubricModalContent {
		padding: 0 !important;
		overflow: hidden !important;
		background: ${theme.colours.PaoloVeroneseGreen} !important;
	}

	.mantine-Modal-body.assignRubricModalBody {
		padding: 0 !important;
		padding-top: 0 !important;
	}
`;

type Props = {
	rubric: AssignmentRubricDefinition;
};

export default function AssignmentRubricPanel({ rubric }: Props) {
	const { formatMessage } = useIntl();
	const [opened, setOpened] = useState(false);
	const criteria = sortedRubricCriteria(rubric);
	const levels = sortedRubricLevels(rubric);

	const close = () => setOpened(false);

	return (
		<>
			<RubricModalFlushStyles />
			<RubricSection aria-labelledby="assign-detail-rubric-heading">
				<SectionTitle id="assign-detail-rubric-heading">
					{formatMessage({ id: 'assign-detail-rubric-title' })}
				</SectionTitle>
				<RubricCard>
					<RubricCardLead>
						<RubricGridIcon
							src={RUBRIC_GRID_ICON}
							alt=""
							aria-hidden
							decoding="async"
						/>
						<RubricCardLabel>
							{formatMessage({ id: 'assign-detail-rubric-assessment-system' })}
						</RubricCardLabel>
					</RubricCardLead>
					<RubricViewButton type="button" onClick={() => setOpened(true)}>
						{formatMessage({ id: 'assign-detail-rubric-view' })}
					</RubricViewButton>
				</RubricCard>
			</RubricSection>

			<Modal
				opened={opened}
				onClose={close}
				withCloseButton={false}
				padding={0}
				radius={20}
				size={920}
				centered
				aria-labelledby="assign-rubric-modal-title"
				classNames={{
					content: 'assignRubricModalContent',
					body: 'assignRubricModalBody',
				}}
				styles={{
					content: {
						padding: 0,
						overflow: 'hidden',
						background: theme.colours.PaoloVeroneseGreen,
						boxShadow: '0 12px 40px rgba(0, 0, 0, 0.22)',
					},
					body: {
						padding: 0,
					},
					header: {
						display: 'none',
						padding: 0,
						minHeight: 0,
						height: 0,
						border: 'none',
					},
				}}
			>
				<RubricModalShell>
					<RubricModalHeader>
						<RubricModalTitle id="assign-rubric-modal-title">
							{rubric.title}
						</RubricModalTitle>
						{rubric.points_possible != null ? (
							<RubricModalPoints>
								{formatMessage(
									{ id: 'assign-detail-rubric-points-possible' },
									{ points: rubric.points_possible }
								)}
							</RubricModalPoints>
						) : null}
						<RubricModalCloseX
							type="button"
							onClick={close}
							aria-label={formatMessage({ id: 'assign-detail-rubric-close' })}
						>
							×
						</RubricModalCloseX>
					</RubricModalHeader>

					<RubricModalBody>
						{criteria.map((criterion) => (
							<RubricCriterionCard key={criterion.id}>
								<RubricCriterionTop>
									<RubricCriterionLabel>{criterion.label}</RubricCriterionLabel>
									<RubricCriterionWeight>
										{formatMessage(
											{ id: 'assign-detail-rubric-weight' },
											{ weight: criterion.weight }
										)}
									</RubricCriterionWeight>
								</RubricCriterionTop>
								<RubricLevelsRow>
									{levels.map((level) => {
										const hasDescriptor = rubricLevelDescriptorVisible(level.descriptor);
										return (
											<RubricLevelChip
												key={`${criterion.id}-${level.key}-${level.points}`}
												$active={hasDescriptor}
											>
												<RubricLevelName>{level.label}</RubricLevelName>
												<RubricLevelPoints>
													{formatMessage(
														{ id: 'assign-detail-rubric-level-points' },
														{ points: level.points }
													)}
												</RubricLevelPoints>
												{hasDescriptor ? (
													<>
														<RubricLevelCheck aria-hidden>✓</RubricLevelCheck>
														<RubricLevelDescriptor>
															{level.descriptor}
														</RubricLevelDescriptor>
													</>
												) : (
													<RubricLevelSpacer aria-hidden />
												)}
											</RubricLevelChip>
										);
									})}
								</RubricLevelsRow>
							</RubricCriterionCard>
						))}
					</RubricModalBody>

					<RubricModalFooter>
						<RubricModalCloseButton type="button" onClick={close}>
							{formatMessage({ id: 'assign-detail-rubric-close' })}
						</RubricModalCloseButton>
					</RubricModalFooter>
				</RubricModalShell>
			</Modal>
		</>
	);
}
