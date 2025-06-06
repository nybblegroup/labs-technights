import { test, expect } from '@playwright/test';
import { ai } from '@zerostep/playwright';

test.describe('Login saucedemo', () => {
  test('Login Successfully', async ({ page }) => {
    
    await page.goto('https://www.saucedemo.com/');

    // Login usando ZeroStep AI
    await ai('type "standard_user" in textbox "Username"', { page, test });
    await ai('type "secret_sauce" in textbox "Password"', { page, test });
    await ai('click on "Login" button', { page, test });

    // Abrir menú lateral
    await ai('click on menu icon', { page, test });

    // Verificar que el botón Logout esté visible
    await ai('verify that the "Logout" link is visible', { page, test });

    // Validación adicional opcional con Playwright puro
    const logoutLink = page.locator('#logout_sidebar_link');
    await expect(logoutLink).toBeVisible();
  });
});
