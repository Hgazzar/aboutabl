import { getRequest, postFormDataRequest, postRequest } from 'lib/requests';
import { parseStudentApiPayload } from 'lib/studentApiResponse';
import type { ProfileAchievement } from './types';
import { parseProfileEditForm, buildEditProfileJsonPayload, type ProfileEditForm } from './profileEditUtils';
import { buildChangePasswordPayload, type ChangePasswordForm } from './profilePasswordUtils';
import { parseProfileAchievements, parseProfileIdentity, type ProfileIdentity } from './profileUtils';

export async function fetchStudentProfileIdentity(): Promise<ProfileIdentity> {
	const res = await getRequest('profile');
	const payload = parseStudentApiPayload<Record<string, unknown>>(
		res,
		'profile',
		'Invalid profile response'
	);

	return parseProfileIdentity(payload);
}

export async function fetchStudentAchievements(): Promise<ProfileAchievement[]> {
	const res = await getRequest('achievements');
	const payload = parseStudentApiPayload<unknown>(
		res,
		'achievements',
		'Invalid achievements response'
	);

	return parseProfileAchievements(payload);
}

export async function fetchStudentProfileForm(): Promise<ProfileEditForm> {
	const res = await getRequest('profile');
	const payload = parseStudentApiPayload<Record<string, unknown>>(
		res,
		'profile',
		'Invalid profile response'
	);

	return parseProfileEditForm(payload);
}

export async function updateStudentProfile(form: ProfileEditForm, photoFile: File | null): Promise<void> {
	const payload = buildEditProfileJsonPayload(form);

	if (photoFile) {
		const formData = new FormData();
		if (payload.email) formData.append('email', payload.email);
		if (payload.birthday) formData.append('birthday', payload.birthday);
		if (payload.gender) formData.append('gender', payload.gender);
		if (payload.address) formData.append('address', payload.address);
		formData.append('photo', photoFile);
		await postFormDataRequest('editProfile', formData);
		return;
	}

	await postRequest('editProfile', payload);
}

export async function changeStudentPassword(form: ChangePasswordForm): Promise<void> {
	const res = await postRequest('changePassword', buildChangePasswordPayload(form));

	if (res?.status === false) {
		throw new Error(typeof res.msg === 'string' ? res.msg : 'Could not change password.');
	}
}
