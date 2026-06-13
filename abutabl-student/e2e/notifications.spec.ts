import { test, expect } from './fixtures';

test.describe('Student app – Notifications', () => {
	test('6.1 – Notifications or main layout loads after login', async ({ page, authenticatedPage }) => {
		await expect(page).toHaveURL(/\/learn/);
		await expect(page.locator('body')).toBeVisible();
	});
});
