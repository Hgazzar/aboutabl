export const MIN_PROFILE_PASSWORD_LENGTH = 8;

export type ChangePasswordForm = {
	currentPassword: string;
	newPassword: string;
	confirmPassword: string;
};

export type ChangePasswordValidationError =
	| 'fields_required'
	| 'new_min_length'
	| 'mismatch';

export const EMPTY_CHANGE_PASSWORD_FORM: ChangePasswordForm = {
	currentPassword: '',
	newPassword: '',
	confirmPassword: '',
};

export function cloneChangePasswordForm(form: ChangePasswordForm): ChangePasswordForm {
	return {
		currentPassword: form.currentPassword,
		newPassword: form.newPassword,
		confirmPassword: form.confirmPassword,
	};
}

export function validateChangePasswordForm(
	form: ChangePasswordForm
): ChangePasswordValidationError | null {
	if (
		!form.currentPassword.trim() ||
		!form.newPassword.trim() ||
		!form.confirmPassword.trim()
	) {
		return 'fields_required';
	}

	if (form.newPassword.length < MIN_PROFILE_PASSWORD_LENGTH) {
		return 'new_min_length';
	}

	if (form.newPassword !== form.confirmPassword) {
		return 'mismatch';
	}

	return null;
}

export function buildChangePasswordPayload(form: ChangePasswordForm) {
	return {
		password: form.currentPassword,
		new_password: form.newPassword,
		confirm_new_password: form.confirmPassword,
	};
}
