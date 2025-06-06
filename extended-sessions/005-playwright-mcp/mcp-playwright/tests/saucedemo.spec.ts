import { test, expect } from '@playwright/test';
import { SauceDemoLoginPage } from './saucedemoLoginPage';

test('saucedemo login and verify logout', async ({ page }) => {
  const loginPage = new SauceDemoLoginPage(page);
  await loginPage.goto();
  await loginPage.login('standard_user', 'secret_sauce');
  await loginPage.openMenu();
  await expect(page.getByText('Logout')).toBeVisible();
});
