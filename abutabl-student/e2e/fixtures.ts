import { test as base, expect } from '@playwright/test';
export { expect };

const testStudentCode = process.env.PLAYWRIGHT_TEST_STUDENT_CODE ?? '';
const testStudentPassword = process.env.PLAYWRIGHT_TEST_STUDENT_PASSWORD ?? '';

export const test = base.extend<{ authenticatedPage: void }>({
	authenticatedPage: [async ({ page }, use, testInfo) => {
		if (!testStudentCode || !testStudentPassword) {
			testInfo.skip(true, 'Set PLAYWRIGHT_TEST_STUDENT_CODE and PLAYWRIGHT_TEST_STUDENT_PASSWORD to run authenticated tests');
			await use();
			return;
		}
		await page.goto('/login');
		await page.getByLabel(/student code/i).fill(testStudentCode);
		await page.getByLabel(/password/i).fill(testStudentPassword);
		await page.getByRole('button', { name: /login/i }).click();
		await page.waitForURL(/\/learn/, { timeout: 15000 });
		await use();
	}, { scope: 'test' }],
});

export { testStudentCode, testStudentPassword };
