import { useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import styled from 'styled-components';
import { figmaProfileAssetUrl } from 'config/figmaAssets';
import CameraIcon from 'assets/images/svg/camera.svg?react';
import { theme } from 'global-styles';
import { getApiErrorMessage } from 'lib/studentApiResponse';
import {
	isStudentAvatarPresetId,
	resolveStudentAvatarSrc,
} from 'lib/studentAvatar';
import AvatarPickerModal from 'layout/nav-bar/AvatarPickerModal';
import { fetchStudentProfileForm, fetchStudentProfileIdentity, updateStudentProfile } from '../profileApi';
import {
	cloneProfileEditForm,
	EMPTY_PROFILE_EDIT_FORM,
	isValidProfileEditBirthday,
	isValidProfileEditEmail,
	profileEditBirthdayMaxIso,
	type ProfileEditForm,
} from '../profileEditUtils';
import type { ProfileIdentity } from '../profileUtils';
import { EmptyState } from './profileLayout';
import { toast } from 'react-toastify';

const EDIT_ICON = figmaProfileAssetUrl('edit-icon.png');

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

const AvatarBlock = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12px;
	padding: 8px 0 4px;
`;

const AvatarCircle = styled.img`
	width: 120px;
	height: 120px;
	border-radius: 50%;
	object-fit: cover;
	border: 5px solid #1ebba3;
	display: block;
`;

const ChangeAvatarButton = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	border: none;
	background: transparent;
	padding: 0;
	cursor: pointer;
	font-family: ${theme.fonts.Nunito};
	font-weight: 700;
	font-size: 15px;
	color: ${theme.colours.LightSeaGreen};

	svg {
		width: 18px;
		height: 18px;
	}

	&:hover {
		filter: brightness(1.05);
	}

	&:focus-visible {
		outline: 2px solid #442817;
		outline-offset: 4px;
		border-radius: 6px;
	}
`;

const HiddenFileInput = styled.input`
	display: none;
`;

const INPUT_HEIGHT = 56;
const INPUT_RADIUS = 15;

type FieldVariant = 'editable' | 'whiteLocked' | 'darkLocked';

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

const FieldGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 14px;

	@media (max-width: 640px) {
		grid-template-columns: 1fr;
	}
`;

const FieldBox = styled.div<{ $variant: FieldVariant; $fullWidth?: boolean }>`
	position: relative;
	box-sizing: border-box;
	min-height: ${INPUT_HEIGHT}px;
	border-radius: ${INPUT_RADIUS}px;
	border: 1px solid
		${({ $variant }) => ($variant === 'darkLocked' ? 'transparent' : '#dcdcdc')};
	background: ${({ $variant }) => ($variant === 'darkLocked' ? '#666666' : '#ffffff')};
	box-shadow: ${({ $variant }) =>
		$variant === 'darkLocked' ? 'none' : '0 2px 6px rgba(0, 0, 0, 0.08)'};
	padding: 10px 16px;
	display: flex;
	flex-direction: column;
	justify-content: center;
	gap: 2px;
	grid-column: ${({ $fullWidth }) => ($fullWidth ? '1 / -1' : 'auto')};
`;

const FieldCaption = styled.span<{ $variant: FieldVariant }>`
	font-family: ${theme.fonts.Nunito};
	font-size: 12px;
	font-weight: 500;
	line-height: 1.2;
	color: ${({ $variant }) => ($variant === 'darkLocked' ? '#b3b3b3' : '#b0b0b0')};
`;

const FieldValue = styled.span<{ $variant: FieldVariant }>`
	font-family: ${theme.fonts.Nunito};
	font-size: 15px;
	font-weight: 600;
	line-height: 1.25;
	color: ${({ $variant }) => ($variant === 'darkLocked' ? '#e8e8e8' : '#1f1e1e')};
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

	&:disabled {
		cursor: not-allowed;
		color: #1f1e1e;
		opacity: 1;
	}

	&::-webkit-calendar-picker-indicator {
		cursor: pointer;
		opacity: 0.65;
	}
`;

const FieldSelectControl = styled.select`
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
	appearance: none;
	cursor: pointer;
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
	identity: ProfileIdentity;
	onIdentityUpdated: (identity: ProfileIdentity) => void;
	onDiscard: () => void;
};

function syncUserInfoAfterSave(form: ProfileEditForm, photoFile: File | null, avatarPreset: string | null) {
	try {
		const raw = localStorage.getItem('user_info');
		if (!raw) return;
		const userInfo = JSON.parse(raw) as Record<string, unknown>;
		if (photoFile) {
			delete userInfo.avatar_preset;
		} else if (avatarPreset && isStudentAvatarPresetId(avatarPreset)) {
			userInfo.avatar_preset = avatarPreset;
		}
		localStorage.setItem('user_info', JSON.stringify(userInfo));
		window.dispatchEvent(new CustomEvent('student-avatar-updated'));
	} catch {
		// ignore storage errors
	}
}

export default function ProfileEditSection({ identity, onIdentityUpdated, onDiscard }: Props) {
	const { formatMessage } = useIntl();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [form, setForm] = useState<ProfileEditForm>(EMPTY_PROFILE_EDIT_FORM);
	const [snapshot, setSnapshot] = useState<ProfileEditForm>(EMPTY_PROFILE_EDIT_FORM);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const [photoPreview, setPhotoPreview] = useState<string | null>(null);
	const [photoFile, setPhotoFile] = useState<File | null>(null);
	const [avatarPreset, setAvatarPreset] = useState<string | null>(null);
	const [savedAvatarPreset, setSavedAvatarPreset] = useState<string | null>(null);
	const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);

	useEffect(() => {
		let cancelled = false;

		setLoading(true);
		setError(null);

		fetchStudentProfileForm()
			.then((nextForm) => {
				if (cancelled) return;
				const loaded = cloneProfileEditForm(nextForm);
				setForm(loaded);
				setSnapshot(cloneProfileEditForm(loaded));
				setPhotoFile(null);
				setPhotoPreview(null);

				try {
					const raw = localStorage.getItem('user_info');
					const userInfo = raw ? (JSON.parse(raw) as { avatar_preset?: string }) : null;
					const preset =
						userInfo?.avatar_preset && isStudentAvatarPresetId(userInfo.avatar_preset)
							? userInfo.avatar_preset
							: null;
					setAvatarPreset(preset);
					setSavedAvatarPreset(preset);
				} catch {
					setAvatarPreset(null);
					setSavedAvatarPreset(null);
				}
			})
			.catch((err) => {
				if (cancelled) return;
				setError(getApiErrorMessage(err, formatMessage({ id: 'profile-edit-error' })));
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [formatMessage]);

	const avatarSrc = resolveStudentAvatarSrc({
		photoUrl: photoPreview ?? (isStudentAvatarPresetId(avatarPreset) ? null : form.photo ?? identity.photo),
		avatarPreset: isStudentAvatarPresetId(avatarPreset) ? avatarPreset : null,
	});

	const updateField = <K extends keyof ProfileEditForm>(key: K, value: ProfileEditForm[K]) => {
		setForm((prev) => ({ ...prev, [key]: value }));
	};

	const handlePresetSelect = (presetId: string) => {
		setAvatarPreset(presetId);
		setPhotoFile(null);
		setPhotoPreview(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	};

	const handlePhotoPick = (file: File | null) => {
		if (!file) {
			setPhotoFile(null);
			setPhotoPreview(null);
			return;
		}
		setPhotoFile(file);
		setPhotoPreview(URL.createObjectURL(file));
		setAvatarPreset(null);
	};

	const handleDiscard = () => {
		if (saving) return;

		setForm(cloneProfileEditForm(snapshot));
		setPhotoFile(null);
		setPhotoPreview(null);
		setAvatarPreset(savedAvatarPreset);

		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}

		onDiscard();
	};

	const handleSave = async () => {
		if (!isValidProfileEditEmail(form.email)) {
			toast.error(formatMessage({ id: 'emailOnly' }));
			return;
		}

		if (!isValidProfileEditBirthday(form.birthday)) {
			toast.error(formatMessage({ id: 'profile-birthday-future-error' }));
			return;
		}

		setSaving(true);
		try {
			await updateStudentProfile(form, photoFile);
			syncUserInfoAfterSave(form, photoFile, avatarPreset);

			const refreshed = await fetchStudentProfileForm();
			const saved = cloneProfileEditForm(refreshed);
			setForm(saved);
			setSnapshot(cloneProfileEditForm(saved));
			setPhotoFile(null);
			setPhotoPreview(null);

			if (photoFile) {
				setSavedAvatarPreset(null);
				setAvatarPreset(null);
			}

			const nextIdentity = await fetchStudentProfileIdentity();
			onIdentityUpdated(nextIdentity);

			toast.success(formatMessage({ id: 'ProfileSavedSuccess' }));
		} catch (err) {
			toast.error(getApiErrorMessage(err, formatMessage({ id: 'profile-edit-error' })));
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<Section>
				<SectionHead>
					<img src={EDIT_ICON} alt="" />
					{formatMessage({ id: 'Edit-profile' })}
				</SectionHead>
				<EmptyState>{formatMessage({ id: 'profile-edit-loading' })}</EmptyState>
			</Section>
		);
	}

	if (error) {
		return (
			<Section>
				<SectionHead>
					<img src={EDIT_ICON} alt="" />
					{formatMessage({ id: 'Edit-profile' })}
				</SectionHead>
				<EmptyState role="alert">{error}</EmptyState>
			</Section>
		);
	}

	return (
		<Section>
			<SectionHead>
				<img src={EDIT_ICON} alt="" />
				{formatMessage({ id: 'Edit-profile' })}
			</SectionHead>

			<AvatarBlock>
				<AvatarCircle src={avatarSrc} alt="" />
				<ChangeAvatarButton type="button" onClick={() => setAvatarPickerOpen(true)}>
					<CameraIcon aria-hidden />
					{formatMessage({ id: 'ChangeAvatar' })}
				</ChangeAvatarButton>
				<HiddenFileInput
					ref={fileInputRef}
					type="file"
					accept="image/png,image/jpeg"
					onChange={(event) => handlePhotoPick(event.target.files?.[0] ?? null)}
				/>
			</AvatarBlock>

			<AvatarPickerModal
				opened={avatarPickerOpen}
				onClose={() => setAvatarPickerOpen(false)}
				initialPresetId={avatarPreset}
				persistOnSelect={false}
				onPresetSelect={handlePresetSelect}
			/>

			<FormBlock>
				<BlockTitle>{formatMessage({ id: 'PersonalInfo' })}</BlockTitle>
				<FieldGrid>
					<FieldBox $variant="whiteLocked">
						<FieldCaption $variant="whiteLocked">
							{formatMessage({ id: 'Student-Code' })}
						</FieldCaption>
						{form.code || identity.code ? (
							<FieldValue $variant="whiteLocked">
								{form.code || identity.code}
							</FieldValue>
						) : null}
					</FieldBox>

					<FieldBox $variant="editable">
						<FieldCaption $variant="editable">{formatMessage({ id: 'Email' })}</FieldCaption>
						<FieldControl
							type="email"
							value={form.email}
							onChange={(event) => updateField('email', event.target.value)}
							autoComplete="email"
							aria-label={formatMessage({ id: 'Email' })}
						/>
					</FieldBox>

					<FieldBox $variant="editable">
						<FieldCaption $variant="editable">{formatMessage({ id: 'Birthday' })}</FieldCaption>
						<FieldControl
							type="date"
							value={form.birthday}
							max={profileEditBirthdayMaxIso()}
							onChange={(event) => updateField('birthday', event.target.value)}
							aria-label={formatMessage({ id: 'Birthday' })}
						/>
					</FieldBox>

					<FieldBox $variant="editable">
						<FieldCaption $variant="editable">{formatMessage({ id: 'Gender' })}</FieldCaption>
						<FieldSelectControl
							value={form.gender}
							onChange={(event) => updateField('gender', event.target.value)}
							aria-label={formatMessage({ id: 'Gender' })}
						>
							<option value="">{formatMessage({ id: 'Gender' })}</option>
							<option value="male">{formatMessage({ id: 'gender-male' })}</option>
							<option value="female">{formatMessage({ id: 'gender-female' })}</option>
						</FieldSelectControl>
					</FieldBox>
				</FieldGrid>
			</FormBlock>

			<FormBlock>
				<BlockTitle>{formatMessage({ id: 'Education' })}</BlockTitle>
				<FieldGrid>
					<FieldBox $variant="darkLocked">
						<FieldCaption $variant="darkLocked">{formatMessage({ id: 'School' })}</FieldCaption>
						{form.school ? (
							<FieldValue $variant="darkLocked">{form.school}</FieldValue>
						) : null}
					</FieldBox>
					<FieldBox $variant="darkLocked">
						<FieldCaption $variant="darkLocked">{formatMessage({ id: 'Grade' })}</FieldCaption>
						{form.grade ? <FieldValue $variant="darkLocked">{form.grade}</FieldValue> : null}
					</FieldBox>
				</FieldGrid>
			</FormBlock>

			<FormBlock>
				<BlockTitle>{formatMessage({ id: 'Address' })}</BlockTitle>
				<FieldGrid>
					<FieldBox $variant="editable" $fullWidth>
						<FieldCaption $variant="editable">{formatMessage({ id: 'Address' })}</FieldCaption>
						<FieldControl
							value={form.address}
							onChange={(event) => updateField('address', event.target.value)}
							aria-label={formatMessage({ id: 'Address' })}
						/>
					</FieldBox>
				</FieldGrid>
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
