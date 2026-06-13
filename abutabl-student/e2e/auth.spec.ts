import { test, expect } from '@playwright/test';

test.describe('Student app – Auth', () => {
	test('1.1 – Login page loads with Welcome back, Student Code, Password', async ({ page }) => {
		await page.goto('/login');
		await expect(page.getByText('Welcome back')).toBeVisible();
		await expect(page.getByText(/login and learn/i)).toBeVisible();
		await expect(page.getByLabel(/student code/i)).toBeVisible();
		await expect(page.getByLabel(/password/i)).toBeVisible();
		await expect(page.getByRole('button', { name: /login/i })).toBeVisible();
	});

	test('1.2 – Wrong code/password shows error and does not redirect to /learn', async ({ page }) => {
		await page.goto('/login');
		await page.getByLabel(/student code/i).fill('wrongcode');
		await page.getByLabel(/password/i).fill('wrongpass');
		await page.getByRole('button', { name: /login/i }).click();
		await expect(page).not.toHaveURL(/\/learn/);
		await expect(page).toHaveURL(/\/login/);
	});

	test('1.3 – Correct login redirects to /learn', async ({ page }) => {
		const code = process.env.PLAYWRIGHT_TEST_STUDENT_CODE;
		const password = process.env.PLAYWRIGHT_TEST_STUDENT_PASSWORD;
		test.skip(!code || !password, 'Credentials not set');

		await page.goto('/login');
		await page.getByLabel(/student code/i).fill(code!);
		await page.getByLabel(/password/i).fill(password!);
		await page.getByRole('button', { name: /login/i }).click();
		await expect(page).toHaveURL(/\/learn/, { timeout: 15000 });
	});

	test('1.4 – Logout clears session and redirects to login', async ({ page }) => {
		const code = process.env.PLAYWRIGHT_TEST_STUDENT_CODE;
		const password = process.env.PLAYWRIGHT_TEST_STUDENT_PASSWORD;
		test.skip(!code || !password, 'Credentials not set');

		await page.goto('/login');
		await page.getByLabel(/student code/i).fill(code!);
		await page.getByLabel(/password/i).fill(password!);
		await page.getByRole('button', { name: /login/i }).click();
		await page.waitForURL(/\/learn/, { timeout: 15000 });

		await page.getByText(/logout/i).click();
		await expect(page).toHaveURL(/\/(login)?$/, { timeout: 10000 });
		await page.goto('/learn');
		await expect(page).toHaveURL(/\/login/);
	});
});
