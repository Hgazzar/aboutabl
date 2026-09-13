import { describe, expect, it } from 'vitest';
import {
	buildChangePasswordPayload,
	EMPTY_CHANGE_PASSWORD_FORM,
	validateChangePasswordForm,
} from './profilePasswordUtils';

describe('profilePasswordUtils', () => {
	it('builds POST /changePassword payload from form fields', () => {
		expect(
			buildChangePasswordPayload({
				currentPassword: 'old-pass-123',
				newPassword: 'new-pass-456',
				confirmPassword: 'new-pass-456',
			})
		).toEqual({
			password: 'old-pass-123',
			new_password: 'new-pass-456',
			confirm_new_password: 'new-pass-456',
		});
	});

	it('rejects empty fields', () => {
		expect(validateChangePasswordForm(EMPTY_CHANGE_PASSWORD_FORM)).toBe('fields_required');
		expect(
			validateChangePasswordForm({
				currentPassword: 'old-pass',
				newPassword: '',
				confirmPassword: '',
			})
		).toBe('fields_required');
	});

	it('requires new password to meet backend minimum length', () => {
		expect(
			validateChangePasswordForm({
				currentPassword: 'old-pass-123',
				newPassword: 'short',
				confirmPassword: 'short',
			})
		).toBe('new_min_length');
	});

	it('requires confirm password to match new password', () => {
		expect(
			validateChangePasswordForm({
				currentPassword: 'old-pass-123',
				newPassword: 'new-pass-456',
				confirmPassword: 'different-pass',
			})
		).toBe('mismatch');
	});

	it('accepts a valid change-password form', () => {
		expect(
			validateChangePasswordForm({
				currentPassword: 'old-pass-123',
				newPassword: 'new-pass-456',
				confirmPassword: 'new-pass-456',
			})
		).toBeNull();
	});
});
