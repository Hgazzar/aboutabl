import { test, expect } from './fixtures';

test.describe('Student app – Todo (Assignments)', () => {
	test('3.1 – Todo page loads', async ({ page, authenticatedPage }) => {
		await page.goto('/todo');
		await expect(page).toHaveURL(/\/todo/);
		await expect(page.locator('body')).toBeVisible();
	});
});
