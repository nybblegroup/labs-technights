import { Page } from '@playwright/test';

export class TodoLyLoginPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('https://todo.ly/');
  }

  async openLogin() {
    // Click the login link to open the login form
    await this.page.locator('a[href="javascript:ShowLogin();"]').click();
  }

  async fillEmail(email: string) {
    await this.page.locator('#ctl00_MainContent_LoginControl1_TextBoxEmail').fill(email);
  }

  async fillPassword(password: string) {
    await this.page.locator('#ctl00_MainContent_LoginControl1_TextBoxPassword').fill(password);
  }

  async submitLogin() {
    await this.page.locator('#ctl00_MainContent_LoginControl1_ButtonLogin').click();
  }

  async isLogoutVisible() {
    return this.page.locator('a[href*="Logout"]').isVisible();
  }
}
