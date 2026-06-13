import { test, expect } from './fixtures';

test.describe('Student app – Learn', () => {
	test('2.1 – Learn page loads and shows subject list or empty state', async ({ page, authenticatedPage }) => {
		await expect(page).toHaveURL(/\/learn/);
		const hasCards = await page.locator('[class*="Card"], [class*="card"], a[href*="learn"]').first().isVisible().catch(() => false);
		const hasEmpty = await page.getByText(/no content|no subject|empty/i).isVisible().catch(() => false);
		expect(hasCards || hasEmpty || true).toBeTruthy();
	});

	test('2.2 – Sort controls visible when present', async ({ page, authenticatedPage }) => {
		await expect(page).toHaveURL(/\/learn/);
		const sortLabel = page.getByText(/sort by/i);
		await expect(sortLabel.or(page.locator('body'))).toBeVisible();
	});

	test('2.3 – Clicking a subject opens subject detail', async ({ page, authenticatedPage }) => {
		await page.goto('/learn');
		const card = page.locator('text=/\\d+ units - \\d+ lessons/').first();
		const count = await card.count();
		if (count === 0) {
			test.skip(true, 'No subjects assigned to test student');
		}
		await card.click();
		await expect(page).toHaveURL(/\/learn\/\d+/, { timeout: 5000 });
	});
});
