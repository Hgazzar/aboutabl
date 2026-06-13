/** Mirrors legacy PHP `generatePassword` (upper + lower + digit + shuffle). */
export function generateGamePassword(length = 6): string {
	const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	const lowercase = 'abcdefghijklmnopqrstuvwxyz';
	const numbers = '0123456789';
	const allChars = uppercase + lowercase + numbers;

	let password =
		uppercase[Math.floor(Math.random() * uppercase.length)] +
		lowercase[Math.floor(Math.random() * lowercase.length)] +
		numbers[Math.floor(Math.random() * numbers.length)];

	for (let i = 0; i < length - 3; i++) {
		password += allChars[Math.floor(Math.random() * allChars.length)];
	}

	return password
		.split('')
		.sort(() => Math.random() - 0.5)
		.join('');
}

export function generateUniquePasswords(count: number, length = 6): string[] {
	const set = new Set<string>();
	while (set.size < count) {
		set.add(generateGamePassword(length));
	}
	return Array.from(set);
}
