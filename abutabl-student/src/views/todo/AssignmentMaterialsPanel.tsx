import { useIntl } from 'react-intl';
import { useState } from 'react';
import Modal from 'components/modal';
import type { AssignmentMaterialItem } from 'lib/assignmentDetailApi';
import {
	materialIconSrc,
	materialTypeLabelId,
	teacherMaterialVisualKind,
	type MaterialVisualKind,
} from './assignmentMaterialIcons';
import {
	assignmentAssetOpenMode,
	openAssignmentAsset,
	resolveAssignmentAssetUrl,
} from './assignmentWorkAssetUrl';
import {
	MaterialsAudio,
	MaterialsCard,
	MaterialsCardButton,
	MaterialsCardGrid,
	MaterialsCardIcon,
	MaterialsCardName,
	MaterialsCardSurface,
	MaterialsCardTop,
	MaterialsCardType,
	MaterialsEmpty,
	MaterialsHeader,
	MaterialsHeaderTitle,
	MaterialsImagePreviewFrame,
	MaterialsImagePreviewImg,
	MaterialsSection,
} from './assignmentDetailStyles';

type Props = {
	items: AssignmentMaterialItem[];
};

type ImagePreviewState = {
	url: string;
	name: string;
};

function sortedMaterials(items: AssignmentMaterialItem[]): AssignmentMaterialItem[] {
	return [...items].sort((a, b) => {
		if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
		return a.id - b.id;
	});
}

function canActivateCard(visual: MaterialVisualKind, assetUrl: string | null): boolean {
	if (!assetUrl) return false;
	return assignmentAssetOpenMode(visual) !== 'none';
}

export default function AssignmentMaterialsPanel({ items }: Props) {
	const { formatMessage } = useIntl();
	const ordered = sortedMaterials(items);
	const [imagePreview, setImagePreview] = useState<ImagePreviewState | null>(null);

	const handleOpen = (
		visual: MaterialVisualKind,
		url: string | null,
		filename: string | null,
		displayName: string
	) => {
		void openAssignmentAsset({ visual, url, filename }).then((result) => {
			if (result.mode === 'preview-image') {
				setImagePreview({ url: result.url, name: displayName });
			}
		});
	};

	return (
		<>
			<MaterialsSection aria-labelledby="assign-detail-materials-teacher-heading">
				<MaterialsHeader>
					<MaterialsHeaderTitle id="assign-detail-materials-teacher-heading">
						{formatMessage({ id: 'assign-detail-materials-title' })}
					</MaterialsHeaderTitle>
				</MaterialsHeader>

				{ordered.length === 0 ? (
					<MaterialsEmpty>
						{formatMessage({ id: 'assign-detail-materials-empty' })}
					</MaterialsEmpty>
				) : (
					<MaterialsCardGrid>
						{ordered.map((item) => {
							const visual = teacherMaterialVisualKind(
								item.kind,
								item.mime_type,
								item.original_filename
							);
							const name =
								item.label?.trim() ||
								item.original_filename ||
								formatMessage({ id: materialTypeLabelId(visual) });
							const assetUrl = resolveAssignmentAssetUrl(item.url);
							const isVoice = visual === 'voice';
							const canOpen = canActivateCard(visual, assetUrl);

							return (
								<MaterialsCard key={item.id}>
									<MaterialsCardSurface>
										<MaterialsCardButton
											type="button"
											disabled={!canOpen && !isVoice}
											onClick={() => {
												if (canOpen) {
													handleOpen(
														visual,
														item.url,
														item.original_filename,
														name
													);
												}
											}}
										>
											<MaterialsCardIcon
												src={materialIconSrc(visual)}
												alt=""
												aria-hidden
												decoding="async"
											/>
											<MaterialsCardTop>
												<MaterialsCardType>
													{formatMessage({ id: materialTypeLabelId(visual) })}
												</MaterialsCardType>
												<MaterialsCardName title={name}>{name}</MaterialsCardName>
											</MaterialsCardTop>
										</MaterialsCardButton>
										{isVoice && assetUrl ? (
											<MaterialsAudio controls preload="none" src={assetUrl} />
										) : null}
									</MaterialsCardSurface>
								</MaterialsCard>
							);
						})}
					</MaterialsCardGrid>
				)}
			</MaterialsSection>

			<Modal
				opened={imagePreview != null}
				onClose={() => setImagePreview(null)}
				title={
					imagePreview?.name ||
					formatMessage({ id: 'assign-detail-asset-image-preview-title' })
				}
				centered
				size="auto"
			>
				{imagePreview ? (
					<MaterialsImagePreviewFrame>
						<MaterialsImagePreviewImg
							src={imagePreview.url}
							alt={imagePreview.name}
						/>
					</MaterialsImagePreviewFrame>
				) : null}
			</Modal>
		</>
	);
}
