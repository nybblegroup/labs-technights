import { test, expect } from '@playwright/test';
import { TodoLyLoginPage } from './todoLyLoginPage';

test('todo.ly login and verify logout', async ({ page }) => {
  const loginPage = new TodoLyLoginPage(page);
  await loginPage.goto();
  await loginPage.openLogin();
  await loginPage.fillEmail('demo@ai.com');
  await loginPage.fillPassword('12345');
  await loginPage.submitLogin();
  await expect(page.locator('a[href*="Logout"]')).toBeVisible();
});
