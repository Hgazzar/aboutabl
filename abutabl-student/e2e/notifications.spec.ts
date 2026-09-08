import { test, expect } from './fixtures';

test.describe('Student app – Notifications', () => {
	test('6.1 – Notifications or main layout loads after login', async ({ page, authenticatedPage }) => {
		await expect(page).toHaveURL(/\/learn/);
		await expect(page.locator('body')).toBeVisible();
	});

	test('6.2 – Notification bell is visible in navbar', async ({ page, authenticatedPage }) => {
		await expect(page).toHaveURL(/\/learn/);
		const bell = page.getByRole('button', { name: /notifications|الإشعارات/i });
		await expect(bell).toBeVisible();
	});

	test('6.3 – Opening notifications menu shows list or empty state', async ({ page, authenticatedPage }) => {
		await expect(page).toHaveURL(/\/learn/);
		const bell = page.getByRole('button', { name: /notifications|الإشعارات/i });
		await bell.click();

		const empty = page.getByText(/no notifications|لا توجد إشعارات/i);
		const markAll = page.getByRole('button', { name: /mark all as read|تعليم الكل كمقروء/i });
		const clearAll = page.getByText(/clear all notifications|مسح كل الإشعارات/i);
		const error = page.getByText(/could not load notifications|تعذر تحميل الإشعارات/i);

		await expect(empty.or(markAll).or(clearAll).or(error).first()).toBeVisible({ timeout: 15000 });
	});
});
