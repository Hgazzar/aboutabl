import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import Modal from 'components/modal';
import styled from 'styled-components';
import { theme } from 'global-styles';
import {
	DEFAULT_AVATAR_PRESET_ID,
	isStudentAvatarPresetId,
	persistStudentAvatarPreset,
	readStoredAvatarPresetId,
	STUDENT_AVATAR_PRESETS,
} from 'lib/studentAvatar';

const Grid = styled.div`
	display: grid;
	grid-template-columns: 1fr;
	gap: 12px;
	padding: 4px 0 8px;

	@media (min-width: 560px) {
		grid-template-columns: 1fr 1fr 1fr;
	}
`;

const Card = styled.div<{ $selected: boolean }>`
	display: flex;
	align-items: center;
	gap: 8px;
	min-height: 72px;
	padding: 6px;
	border-radius: 16px;
	background: ${({ $selected }) => ($selected ? '#4A4A4A' : theme.colours.white)};
	box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
`;

const Face = styled.img<{ $selected: boolean }>`
	width: 60px;
	height: 60px;
	border-radius: 12px;
	object-fit: cover;
	flex-shrink: 0;
	filter: ${({ $selected }) => ($selected ? 'grayscale(1)' : 'none')};
`;

const SelectBtn = styled.button<{ $selected: boolean }>`
	flex: 1;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	height: 48px;
	padding: 0 12px;
	border-radius: 10px;
	border: 1.5px solid ${theme.colours.LightSeaGreen};
	background: ${theme.colours.white};
	color: ${({ $selected }) => ($selected ? '#6B6B6B' : theme.colours.LightSeaGreen)};
	font-family: ${theme.fonts.Nunito};
	font-size: 14px;
	font-weight: 700;
	line-height: 1;
	text-align: center;
	cursor: pointer;
`;

type Props = {
	opened: boolean;
	onClose: () => void;
	initialPresetId?: string | null;
	persistOnSelect?: boolean;
	onPresetSelect?: (presetId: string) => void;
};

export default function AvatarPickerModal({
	opened,
	onClose,
	initialPresetId = null,
	persistOnSelect = true,
	onPresetSelect,
}: Props) {
	const { formatMessage } = useIntl();
	const [selectedId, setSelectedId] = useState<string | null>(null);

	useEffect(() => {
		if (!opened) return;
		const nextId = isStudentAvatarPresetId(initialPresetId)
			? initialPresetId
			: readStoredAvatarPresetId() ?? DEFAULT_AVATAR_PRESET_ID;
		setSelectedId(nextId);
	}, [opened, initialPresetId]);

	const onSelect = (id: string) => {
		setSelectedId(id);
		if (persistOnSelect) {
			persistStudentAvatarPreset(id);
		}
		onPresetSelect?.(id);
		onClose();
	};

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title={formatMessage({ id: 'navbar-choose-avatar' })}
			size="lg"
			padding={24}
			radius="16px"
		>
			<Grid>
				{STUDENT_AVATAR_PRESETS.map((preset) => {
					const selected = selectedId === preset.id;
					return (
						<Card key={preset.id} $selected={selected}>
							<Face src={preset.url} alt="" $selected={selected} />
							<SelectBtn type="button" $selected={selected} onClick={() => onSelect(preset.id)}>
								{formatMessage({ id: 'navbar-select-avatar' })}
							</SelectBtn>
						</Card>
					);
				})}
			</Grid>
		</Modal>
	);
}
