import Modal from 'components/modal';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { useIntl } from 'react-intl';
import { Button, Divider, Flex, Grid, FileInput } from '@mantine/core';
import DatePickerInput from 'components/date-picker';
import Input from 'components/input';
import Select from 'components/select';
import { FORM_REGEX_VALIDATORS } from 'app-constants/form-validations';
import avatar from 'assets/images/png/avatar.png';
import { useState, useEffect } from 'react';
import { getRequest, postRequest, postFormDataRequest } from 'lib/requests';
import { toast } from 'react-toastify';
import CameraIcon from 'assets/images/svg/camera.svg?react';
import ProfileIcon from 'assets/images/svg/profileIcon.svg?react';
import EmailIcon from 'assets/images/svg/sms.svg?react';
import BirthDayIcon from 'assets/images/svg/cake.svg?react';
import GenderIcon from 'assets/images/svg/user-octagon.svg?react';
import SchoolIcon from 'assets/images/svg/courthouse.svg?react';
import GradeIcon from 'assets/images/svg/teacher.svg?react';
import AddressIcon from 'assets/images/svg/location.svg?react';
import { EditContainer } from './../styles';

const AVATAR_PRESETS = [
	{ id: 'a1', url: 'https://api.dicebear.com/7.x/personas/svg?seed=Nour' },
	{ id: 'a2', url: 'https://api.dicebear.com/7.x/personas/svg?seed=Omar' },
	{ id: 'a3', url: 'https://api.dicebear.com/7.x/personas/svg?seed=Lina' },
	{ id: 'a4', url: 'https://api.dicebear.com/7.x/personas/svg?seed=Kareem' },
];

type EditProfileProps = {
	opened: boolean;
	close: () => void;
};

const emptyProfile = {
	logo: null,
	user_name: '',
	Email: '',
	MobileNumber: '',
	Birthday: null as Date | null,
	Gender: '',
	School: '',
	Governorate: '',
	Grade: '',
	City: '',
	Address: '',
};

function EditProfile({ opened, close }: EditProfileProps) {
	const { formatMessage } = useIntl();
	const [uploadedLogoImage, setUploadedLogoImage] = useState<string | null>(null);
	const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
	const [photoFile, setPhotoFile] = useState<File | null>(null);
	const [saving, setSaving] = useState(false);

	const handleImageLogoUpload = (e: File | null) => {
		if (e) {
			setUploadedLogoImage(URL.createObjectURL(e));
			setPhotoFile(e);
		} else {
			setUploadedLogoImage(null);
			setPhotoFile(null);
		}
	};

	const methods = useForm({
		defaultValues: emptyProfile,
	});
	const { handleSubmit, control, reset } = methods;

	// Load current user profile when modal opens
	useEffect(() => {
		if (!opened) return;

		const userInfo = (() => {
			try {
				const raw = localStorage.getItem('user_info');
				return raw ? JSON.parse(raw) : null;
			} catch {
				return null;
			}
		})();

		// Reset form with localStorage data immediately so the modal shows correct name/school/grade
		reset({
			...emptyProfile,
			user_name: userInfo?.name ?? '',
			School: userInfo?.school_name ?? '',
			Grade: userInfo?.grade_name ?? '',
		});
		if (userInfo?.avatar_preset) {
			setProfilePhoto(String(userInfo.avatar_preset));
		}

		// Fetch full profile from API and merge into form
		getRequest('profile')
			.then((res: { data?: { profile?: Record<string, unknown> }; profile?: Record<string, unknown> }) => {
				const profile = res?.data?.profile ?? res?.profile ?? null;
				if (!profile) return;
				const p = profile as Record<string, unknown>;
				const birthday = p.birthday
					? (typeof p.birthday === 'string' ? new Date(p.birthday as string) : null)
					: null;
				reset({
					...emptyProfile,
					user_name: (p.name as string) ?? userInfo?.name ?? '',
					Email: (p.email as string) ?? '',
					MobileNumber: (p.phone as string) ?? '',
					Birthday: birthday,
					Gender: (p.gender as string) ?? '',
					School: (p.school_name as string) ?? userInfo?.school_name ?? '',
					Grade: (p.grade_name as string) ?? userInfo?.grade_name ?? '',
					Governorate: '',
					City: '',
					Address: (p.address as string) ?? '',
				});
				if (p.photo) setProfilePhoto(String(p.photo));
				setPhotoFile(null);
				setUploadedLogoImage(null);
			})
			.catch(() => {
				// Keep form with user_info-based values if API fails
			});
		if (opened) {
			setPhotoFile(null);
			setUploadedLogoImage(null);
		}
	}, [opened, reset]);

	const onSubmit = async (data: typeof emptyProfile) => {
		setSaving(true);
		try {
			const birthday =
				data.Birthday instanceof Date && !isNaN(data.Birthday.getTime())
					? data.Birthday.toISOString().slice(0, 10)
					: null;

			if (photoFile) {
				const formData = new FormData();
				formData.append('name', data.user_name ?? '');
				formData.append('email', data.Email ?? '');
				formData.append('phone', data.MobileNumber ?? '');
				formData.append('birthday', birthday ?? '');
				formData.append('gender', data.Gender ?? '');
				formData.append('address', data.Address ?? '');
				formData.append('photo', photoFile);
				await postFormDataRequest('editProfile', formData);
			} else {
				await postRequest('editProfile', {
					name: data.user_name || undefined,
					email: data.Email || undefined,
					phone: data.MobileNumber || undefined,
					birthday: birthday || undefined,
					gender: data.Gender || undefined,
					address: data.Address || undefined,
				});
			}
			// Update sidebar name in localStorage
			try {
				const raw = localStorage.getItem('user_info');
				if (raw) {
					const userInfo = JSON.parse(raw);
					userInfo.name = data.user_name || userInfo.name;
					if (profilePhoto && String(profilePhoto).startsWith('http')) {
						userInfo.avatar_preset = profilePhoto;
					}
					localStorage.setItem('user_info', JSON.stringify(userInfo));
				}
			} catch {
				// ignore
			}
			toast.success(formatMessage({ id: 'ProfileSavedSuccess' }));
			close();
		} catch {
			// Error toast is shown by axios interceptor
		} finally {
			setSaving(false);
		}
	};

	return (
		<div>
			<Modal radius="8px" opened={opened} onClose={close} title="Edit profile" size="xl" padding={32}>
				<EditContainer>
					<FormProvider {...methods}>
						<form onSubmit={handleSubmit(onSubmit)}>
							<Flex direction={'column'} className="change_image" align={'center'} justify={'center'} gap={16} mb={24}>
								<div className="upload_container">
									{uploadedLogoImage ? (
										<img className="uploadded_image" src={uploadedLogoImage} alt="UploadedLogo" />
									) : profilePhoto ? (
										<img className="uploadded_image w-[120]" src={profilePhoto} alt="Profile" />
									) : (
										<img src={avatar} alt="avatar" className="w-[120]" />
									)}
								</div>
								<div className="file_input_container">
									<Controller
										control={control}
										name="logo"
										render={({ field: { value } }) => (
											<FileInput
												label={
													<Flex gap={8} align={'center'}>
														<CameraIcon /> <p>{formatMessage({ id: 'ChangePicture' })}</p>
													</Flex>
												}
												accept="image/png,image/jpeg"
												onChange={(e) => handleImageLogoUpload(e)}
												value={value}
											/>
										)}
									/>
								</div>
								<Flex gap={8} wrap="wrap" justify="center" mt={8}>
									{AVATAR_PRESETS.map((p) => (
										<button
											type="button"
											key={p.id}
											onClick={() => {
												setProfilePhoto(p.url);
												setPhotoFile(null);
												setUploadedLogoImage(null);
											}}
											className="border border-Platinum rounded-full p-0 overflow-hidden w-14 h-14 bg-white cursor-pointer hover:ring-2 ring-LightSeaGreen"
										>
											<img src={p.url} alt="" className="w-full h-full object-cover" />
										</button>
									))}
								</Flex>
							</Flex>
							<Grid gutter={32}>
								<Grid.Col m={0} py={0} xs={12}>
									<h4>1. {formatMessage({ id: 'PersonalInfo' })}</h4>
								</Grid.Col>
								<Grid.Col xs={12} md={6}>
									<Input
										icon={<ProfileIcon />}
										name="user_name"
										label={formatMessage({ id: 'StudentName' })}
										placeholder={formatMessage({ id: 'StudentName' })}
										registerOptions={{
											required: {
												value: true,
												message: 'requiredField',
											},
											pattern: {
												value: FORM_REGEX_VALIDATORS.textOnly,
												message: formatMessage({ id: 'textOnly' }),
											},
										}}
									/>
								</Grid.Col>
								<Grid.Col xs={12} md={6}>
									<Input
										icon={<EmailIcon />}
										name="Email"
										label={formatMessage({ id: 'Email' })}
										placeholder={formatMessage({ id: 'Email' })}
										registerOptions={{
											required: {
												value: true,
												message: 'requiredField',
											},
											pattern: {
												value: FORM_REGEX_VALIDATORS.email,
												message: formatMessage({ id: 'emailOnly' }),
											},
										}}
									/>
								</Grid.Col>
								<Grid.Col xs={12} md={6}>
									<DatePickerInput icon={<BirthDayIcon />} name="Birthday" label={formatMessage({ id: 'Birthday' })} />
								</Grid.Col>{' '}
								<Grid.Col xs={12} md={6}>
									<Controller
										control={control}
										name="Gender"
										render={({ field: { onChange, value } }) => (
											<Select
												icon={<GenderIcon />}
												name="Gender"
												label={formatMessage({ id: 'Gender' })}
												placeholder={formatMessage({ id: 'Gender' })}
												data={[
													{ value: 'male', label: 'Male' },
													{ value: 'female', label: 'Female' },
												]}
												onChange={onChange}
												value={value as string}
											/>
										)}
									/>
								</Grid.Col>
							</Grid>
							<Grid gutter={32}>
								<Grid.Col m={0} pt={24} xs={12}>
									<h4>2. {formatMessage({ id: 'Education' })}</h4>
								</Grid.Col>
								<Grid.Col xs={12} md={6}>
									<Input
										disabled
										icon={<SchoolIcon />}
										name="School"
										label={formatMessage({ id: 'School' })}
										placeholder={formatMessage({ id: 'School' })}
										registerOptions={{
											required: {
												value: true,
												message: 'requiredField',
											},
											pattern: {
												value: FORM_REGEX_VALIDATORS.textOnly,
												message: formatMessage({ id: 'textOnly' }),
											},
										}}
									/>
								</Grid.Col>
								<Grid.Col xs={12} md={6}>
									<Controller
										control={control}
										name="Grade"
										render={({ field: { onChange, value } }) => (
											<Select
												disabled
												icon={<GradeIcon />}
												name="Grade"
												label={formatMessage({ id: 'Grade' })}
												placeholder={formatMessage({ id: 'Grade' })}
												data={[
													{ value: 'KG1', label: 'KG1' },
													{ value: 'KG2', label: 'KG2' },
												]}
												onChange={onChange}
												value={value as string}
											/>
										)}
									/>
								</Grid.Col>
							</Grid>
							<Grid gutter={32}>
								<Grid.Col m={0} pt={24} xs={12}>
									<h4>3. {formatMessage({ id: 'Address' })}</h4>
								</Grid.Col>
								<Grid.Col xs={12} md={6}>
									<Input
										icon={<AddressIcon />}
										name="Address"
										label={formatMessage({ id: 'Address' })}
										placeholder={formatMessage({ id: 'Address' })}
										registerOptions={{
											required: {
												value: true,
												message: 'requiredField',
											},
											pattern: {
												value: FORM_REGEX_VALIDATORS.textOnly,
												message: formatMessage({ id: 'textOnly' }),
											},
										}}
									/>
								</Grid.Col>
							</Grid>
							<Divider mt={32} size="xs" />
							<Flex
								className="action_container"
								direction={{ base: 'column', sm: 'row' }}
								gap={22}
								justify={'space-between'}
								align={'center'}
							>
								<Button type="submit" loading={saving} disabled={saving}>
									{formatMessage({ id: 'SaveChanges' })}
								</Button>
								<Button onClick={close} disabled={saving}>
									{formatMessage({ id: 'Discard' })}
								</Button>
							</Flex>
						</form>
					</FormProvider>
				</EditContainer>
			</Modal>
		</div>
	);
}

export default EditProfile;
