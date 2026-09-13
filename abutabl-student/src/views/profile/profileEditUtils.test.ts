import { describe, expect, it } from 'vitest';
import {
	buildEditProfileJsonPayload,
	isValidProfileEditBirthday,
	isValidProfileEditEmail,
	parseProfileEditForm,
} from './profileEditUtils';

describe('profileEditUtils', () => {
	it('maps GET /profile fields into the edit form shape', () => {
		expect(
			parseProfileEditForm({
				code: '6549874',
				email: 'ahmed@school.com',
				birthday: '2012-05-10',
				gender: 'Male',
				school_name: 'Cairo International School',
				grade_name: 'Grade 5',
				address: '12 Nile Street',
				photo: 'https://cdn.example/photo.png',
			})
		).toEqual({
			code: '6549874',
			email: 'ahmed@school.com',
			birthday: '2012-05-10',
			gender: 'male',
			school: 'Cairo International School',
			grade: 'Grade 5',
			address: '12 Nile Street',
			photo: 'https://cdn.example/photo.png',
		});
	});

	it('builds POST /editProfile payload from editable fields only', () => {
		expect(
			buildEditProfileJsonPayload({
				code: '6549874',
				email: 'ahmed@school.com',
				birthday: '2012-05-10',
				gender: 'male',
				school: 'Cairo International School',
				grade: 'Grade 5',
				address: '12 Nile Street',
				photo: null,
			})
		).toEqual({
			email: 'ahmed@school.com',
			birthday: '2012-05-10',
			gender: 'male',
			address: '12 Nile Street',
		});
	});

	it('does not inject fake school or grade values into the save payload', () => {
		const payload = buildEditProfileJsonPayload({
			code: '6549874',
			email: 'ahmed@school.com',
			birthday: '',
			gender: '',
			school: 'Cairo International School',
			grade: 'Grade 5',
			address: '',
			photo: null,
		});

		expect(payload).not.toHaveProperty('school');
		expect(payload).not.toHaveProperty('grade');
		expect(payload).not.toHaveProperty('code');
		expect(payload.address).toBeUndefined();
	});

	it('validates email before save', () => {
		expect(isValidProfileEditEmail('ahmed@school.com')).toBe(true);
		expect(isValidProfileEditEmail('not-an-email')).toBe(false);
	});

	it('rejects future birthdays and accepts today or past', () => {
		expect(isValidProfileEditBirthday('2026-09-02', new Date('2026-08-30'))).toBe(false);
		expect(isValidProfileEditBirthday('2012-05-10', new Date('2026-08-30'))).toBe(true);
		expect(isValidProfileEditBirthday('2026-08-30', new Date('2026-08-30'))).toBe(true);
		expect(isValidProfileEditBirthday('', new Date('2026-08-30'))).toBe(true);
	});
});
