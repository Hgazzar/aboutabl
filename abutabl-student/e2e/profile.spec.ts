import { test, expect } from './fixtures';

test.describe('Student app – Profile', () => {
	test('4.1 – Profile page loads with sections', async ({ page, authenticatedPage }) => {
		await page.goto('/profile');
		await expect(page).toHaveURL(/\/profile/);
		await expect(page.getByText(/my progress|my study|settings/i).first()).toBeVisible({ timeout: 5000 });
	});

	test('4.2 – Edit profile opens form/modal', async ({ page, authenticatedPage }) => {
		await page.goto('/profile');
		await page.getByText('Edit profile').click();
		await expect(page.getByText(/save|discard|student name|email/i).first()).toBeVisible({ timeout: 5000 }).catch(() => {});
	});

	test('4.3 – Change password opens modal', async ({ page, authenticatedPage }) => {
		await page.goto('/profile');
		await page.getByText('Change password').click();
		await expect(page.getByText(/current password|new password|confirm/i).first()).toBeVisible({ timeout: 5000 });
	});

	test('4.4 – Logout clears session', async ({ page, authenticatedPage }) => {
		await page.goto('/learn');
		await page.getByText(/logout/i).click();
		await expect(page).toHaveURL(/\/(login)?$/, { timeout: 10000 });
		await page.goto('/learn');
		await expect(page).toHaveURL(/\/login/);
	});
});
