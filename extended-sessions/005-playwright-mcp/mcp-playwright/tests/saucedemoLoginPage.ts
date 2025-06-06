import { Page } from '@playwright/test';

export class SauceDemoLoginPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('https://www.saucedemo.com/');
  }

  async login(username: string, password: string) {
    await this.page.getByPlaceholder('Username').fill(username);
    await this.page.getByPlaceholder('Password').fill(password);
    await this.page.getByRole('button', { name: 'Login' }).click();
  }

  async openMenu() {
    await this.page.getByRole('button', { name: 'Open Menu' }).click();
  }

  async isLogoutVisible() {
    return this.page.getByText('Logout').isVisible();
  }
}
