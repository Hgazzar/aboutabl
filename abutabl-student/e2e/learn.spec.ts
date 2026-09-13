import { test, expect } from './fixtures';

test.describe('Student app – Dashboard / Learn', () => {
	test('2.1 – Dashboard loads at /learn', async ({ page, authenticatedPage }) => {
		await expect(page).toHaveURL(/\/learn/);
		await expect(page.getByRole('heading', { name: /hello|مرحب/i })).toBeVisible({ timeout: 15000 });
	});

	test('2.2 – Dashboard shows progress or assignments section', async ({ page, authenticatedPage }) => {
		await expect(page).toHaveURL(/\/learn/);
		const progress = page.getByText(/my progress|تقدمي/i);
		const assignments = page.getByText(/my assignments|واجباتي/i);
		await expect(progress.or(assignments)).toBeVisible({ timeout: 15000 });
	});

	test('2.3 – Quick action navigates to todo or books', async ({ page, authenticatedPage }) => {
		await page.goto('/learn');
		const todoLink = page.getByRole('link', { name: /view assignments|عرض الواجبات/i }).first();
		await expect(todoLink).toBeVisible({ timeout: 15000 });
		await todoLink.click();
		await expect(page).toHaveURL(/\/todo/, { timeout: 5000 });
	});
});
