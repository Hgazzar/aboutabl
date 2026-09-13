import { useState } from 'react';
import { useIntl } from 'react-intl';
import styled from 'styled-components';
import { figmaProfileAssetUrl } from 'config/figmaAssets';
import eyeIcon from 'assets/images/svg/eye.svg';
import { theme } from 'global-styles';
import { getApiErrorMessage } from 'lib/studentApiResponse';
import { changeStudentPassword } from '../profileApi';
import {
	cloneChangePasswordForm,
	EMPTY_CHANGE_PASSWORD_FORM,
	validateChangePasswordForm,
	type ChangePasswordForm,
	type ChangePasswordValidationError,
} from '../profilePasswordUtils';
import { toast } from 'react-toastify';

const LOCK_ICON = figmaProfileAssetUrl('lock-icon.png');

const Section = styled.section`
	display: flex;
	flex-direction: column;
	gap: 20px;
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

const FormBlock = styled.div`
	display: flex;
	flex-direction: column;
	gap: 14px;
`;

const BlockTitle = styled.h3`
	margin: 0;
	font-family: ${theme.fonts.Nunito};
	font-weight: 800;
	font-size: 15px;
	line-height: 1.3;
	color: #1f1e1e;
`;

const FieldStack = styled.div`
	display: flex;
	flex-direction: column;
	gap: 14px;
`;

const INPUT_HEIGHT = 56;
const INPUT_RADIUS = 15;

const FieldBox = styled.div`
	position: relative;
	box-sizing: border-box;
	min-height: ${INPUT_HEIGHT}px;
	border-radius: ${INPUT_RADIUS}px;
	border: 1px solid #dcdcdc;
	background: #ffffff;
	box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
	padding: 10px 52px 10px 16px;
	display: flex;
	flex-direction: column;
	justify-content: center;
	gap: 2px;
`;

const FieldCaption = styled.span`
	font-family: ${theme.fonts.Nunito};
	font-size: 12px;
	font-weight: 500;
	line-height: 1.2;
	color: #b0b0b0;
`;

const FieldControl = styled.input`
	width: 100%;
	border: none;
	background: transparent;
	padding: 0;
	margin: 0;
	font-family: ${theme.fonts.Nunito};
	font-size: 15px;
	font-weight: 600;
	line-height: 1.25;
	color: #1f1e1e;
	outline: none;

	&::placeholder {
		color: #b0b0b0;
		font-weight: 500;
	}
`;

const VisibilityToggle = styled.button`
	position: absolute;
	top: 50%;
	right: 14px;
	transform: translateY(-50%);
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 28px;
	height: 28px;
	padding: 0;
	border: 0;
	background: transparent;
	cursor: pointer;
	opacity: 0.72;

	img {
		width: 20px;
		height: 20px;
		object-fit: contain;
	}

	&:hover {
		opacity: 1;
	}

	&:focus-visible {
		outline: 2px solid #442817;
		outline-offset: 2px;
		border-radius: 6px;
	}
`;

const FormDivider = styled.hr`
	width: 100%;
	height: 0;
	margin: 8px 0 0;
	border: 0;
	border-top: 1px solid #f0ece6;
`;

const PROFILE_TEAL = '#24b5a0';
const PROFILE_TEAL_DARK = '#1a8878';
const PROFILE_TEAL_OUTLINE = theme.colours.LightSeaGreen;

const profileActionButtonBase = `
	box-sizing: border-box;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	min-width: 188px;
	height: 48px;
	padding: 0 36px;
	border-radius: 16px;
	font-family: ${theme.fonts.Nunito};
	font-weight: 800;
	font-size: 14px;
	line-height: 1;
	letter-spacing: 0.06em;
	text-transform: uppercase;
	white-space: nowrap;
	cursor: pointer;
	transition:
		background-color 0.15s ease,
		color 0.15s ease,
		border-color 0.15s ease,
		box-shadow 0.15s ease;

	&:disabled {
		opacity: 0.65;
		cursor: not-allowed;
	}

	&:focus-visible {
		outline: 2px solid #442817;
		outline-offset: 3px;
	}
`;

const ActionRow = styled.div`
	display: flex;
	flex-wrap: nowrap;
	gap: 16px;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	padding-top: 16px;
`;

const ProfileActionButton = styled.button`
	${profileActionButtonBase}
	border: 2px solid ${PROFILE_TEAL};
	background: ${PROFILE_TEAL};
	color: ${theme.colours.white};
	box-shadow: 0 4px 0 ${PROFILE_TEAL_DARK};

	&:hover:not(:disabled) {
		border-color: ${PROFILE_TEAL_OUTLINE};
		background: ${theme.colours.white};
		color: ${PROFILE_TEAL_OUTLINE};
		box-shadow: 0 4px 0 ${PROFILE_TEAL_OUTLINE};
	}
`;

type Props = {
	onDiscard: () => void;
};

type PasswordFieldKey = keyof ChangePasswordForm;

function validationMessage(
	error: ChangePasswordValidationError,
	formatMessage: (descriptor: { id: string }) => string
): string {
	switch (error) {
		case 'fields_required':
			return formatMessage({ id: 'profile-password-fields-required' });
		case 'new_min_length':
			return formatMessage({ id: 'profile-password-min-length' });
		case 'mismatch':
			return formatMessage({ id: 'PasswordMismatch' });
		default:
			return formatMessage({ id: 'profile-password-error' });
	}
}

export default function ProfileChangePasswordSection({ onDiscard }: Props) {
	const { formatMessage } = useIntl();
	const [form, setForm] = useState<ChangePasswordForm>(EMPTY_CHANGE_PASSWORD_FORM);
	const [snapshot, setSnapshot] = useState<ChangePasswordForm>(EMPTY_CHANGE_PASSWORD_FORM);
	const [saving, setSaving] = useState(false);
	const [visible, setVisible] = useState<Record<PasswordFieldKey, boolean>>({
		currentPassword: false,
		newPassword: false,
		confirmPassword: false,
	});

	const updateField = (key: PasswordFieldKey, value: string) => {
		setForm((prev) => ({ ...prev, [key]: value }));
	};

	const toggleVisibility = (key: PasswordFieldKey) => {
		setVisible((prev) => ({ ...prev, [key]: !prev[key] }));
	};

	const handleDiscard = () => {
		if (saving) return;
		setForm(cloneChangePasswordForm(snapshot));
		onDiscard();
	};

	const handleSave = async () => {
		const validationError = validateChangePasswordForm(form);
		if (validationError) {
			toast.error(validationMessage(validationError, formatMessage));
			return;
		}

		setSaving(true);
		try {
			await changeStudentPassword(form);
			const cleared = cloneChangePasswordForm(EMPTY_CHANGE_PASSWORD_FORM);
			setForm(cleared);
			setSnapshot(cleared);
			toast.success(formatMessage({ id: 'profile-password-success' }));
		} catch (err) {
			toast.error(getApiErrorMessage(err, formatMessage({ id: 'profile-password-error' })));
		} finally {
			setSaving(false);
		}
	};

	const fields: Array<{
		key: PasswordFieldKey;
		labelId: string;
		autoComplete: string;
	}> = [
		{ key: 'currentPassword', labelId: 'CurrentPassword', autoComplete: 'current-password' },
		{ key: 'newPassword', labelId: 'NewPassword', autoComplete: 'new-password' },
		{ key: 'confirmPassword', labelId: 'ConfirmPassword', autoComplete: 'new-password' },
	];

	return (
		<Section>
			<SectionHead>
				<img src={LOCK_ICON} alt="" />
				{formatMessage({ id: 'Change-password' })}
			</SectionHead>

			<FormBlock>
				<BlockTitle>{formatMessage({ id: 'PersonalInfo' })}</BlockTitle>
				<FieldStack>
					{fields.map(({ key, labelId, autoComplete }) => {
						const label = formatMessage({ id: labelId });
						return (
							<FieldBox key={key}>
								<FieldCaption>{label}</FieldCaption>
								<FieldControl
									type={visible[key] ? 'text' : 'password'}
									value={form[key]}
									onChange={(event) => updateField(key, event.target.value)}
									placeholder={label}
									autoComplete={autoComplete}
									aria-label={label}
								/>
								<VisibilityToggle
									type="button"
									onClick={() => toggleVisibility(key)}
									aria-label={formatMessage({ id: 'profile-password-toggle-visibility' })}
									aria-pressed={visible[key]}
								>
									<img src={eyeIcon} alt="" />
								</VisibilityToggle>
							</FieldBox>
						);
					})}
				</FieldStack>
			</FormBlock>

			<FormDivider aria-hidden />

			<ActionRow>
				<ProfileActionButton type="button" onClick={handleSave} disabled={saving}>
					{formatMessage({ id: 'SaveChanges' })}
				</ProfileActionButton>
				<ProfileActionButton type="button" onClick={handleDiscard} disabled={saving}>
					{formatMessage({ id: 'Discard' })}
				</ProfileActionButton>
			</ActionRow>
		</Section>
	);
}
