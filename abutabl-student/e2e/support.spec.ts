import { test, expect } from './fixtures';

test.describe('Student app – Support (Tickets)', () => {
	test('5.1 – Support page loads', async ({ page, authenticatedPage }) => {
		await page.goto('/support');
		await expect(page).toHaveURL(/\/support/);
		await expect(page.getByText('All Tickets')).toBeVisible({ timeout: 5000 });
	});
});
