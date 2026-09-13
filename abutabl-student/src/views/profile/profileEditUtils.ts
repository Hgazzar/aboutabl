export type ProfileEditForm = {
	code: string;
	email: string;
	birthday: string;
	gender: string;
	school: string;
	grade: string;
	address: string;
	photo: string | null;
};

export const EMPTY_PROFILE_EDIT_FORM: ProfileEditForm = {
	code: '',
	email: '',
	birthday: '',
	gender: '',
	school: '',
	grade: '',
	address: '',
	photo: null,
};

export function parseProfileEditForm(raw: Record<string, unknown> | null | undefined): ProfileEditForm {
	if (!raw) {
		return { ...EMPTY_PROFILE_EDIT_FORM };
	}

	const birthdayRaw = raw.birthday;
	let birthday = '';
	if (typeof birthdayRaw === 'string' && birthdayRaw.trim()) {
		birthday = birthdayRaw.trim().slice(0, 10);
	}

	const genderRaw = String(raw.gender ?? '').trim();
	const gender = genderRaw ? genderRaw.toLowerCase() : '';

	return {
		code: String(raw.code ?? raw.memberShip ?? raw.username ?? '').trim(),
		email: String(raw.email ?? '').trim(),
		birthday,
		gender,
		school: String(raw.school_name ?? '').trim(),
		grade: String(raw.grade_name ?? '').trim(),
		address: String(raw.address ?? '').trim(),
		photo: typeof raw.photo === 'string' && raw.photo.trim() ? raw.photo.trim() : null,
	};
}

export function cloneProfileEditForm(form: ProfileEditForm): ProfileEditForm {
	return { ...form };
}

export function buildEditProfileJsonPayload(form: ProfileEditForm): Record<string, string | undefined> {
	return {
		email: form.email || undefined,
		birthday: form.birthday || undefined,
		gender: form.gender || undefined,
		address: form.address || undefined,
	};
}

export function isValidProfileEditEmail(email: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function profileEditBirthdayMaxIso(reference = new Date()): string {
	const year = reference.getFullYear();
	const month = String(reference.getMonth() + 1).padStart(2, '0');
	const day = String(reference.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

export function isValidProfileEditBirthday(
	birthday: string,
	reference = new Date()
): boolean {
	const value = birthday.trim();
	if (!value) {
		return true;
	}

	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
		return false;
	}

	const [year, month, day] = value.split('-').map(Number);
	const parsed = new Date(year, month - 1, day);
	if (
		parsed.getFullYear() !== year ||
		parsed.getMonth() !== month - 1 ||
		parsed.getDate() !== day
	) {
		return false;
	}

	const today = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate());
	return parsed.getTime() <= today.getTime();
}
