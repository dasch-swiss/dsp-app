import { LOGIN_DATA } from '../options/constants.js';

export class HomePage {
  constructor(page) {
    this.page = page;
    this.loginButton = this.page.locator('[data-cy=login-button]');
    this.usernameInput = this.page.locator('[data-cy=username-input] input');
    this.passwordInput = this.page.locator('[data-cy=password-input] input');
    this.submitButton = this.page.locator('[data-cy=submit-button]');
    this.userMenu = this.page.locator('[data-cy=user-button]');
    this.loggedInUser = this.page.locator('div.menu-title:nth-child(2)');
  }

  async goto() {
    await this.page.goto(__ENV.APP_URL);
  }

  async title() {
    return await this.page.title();
  }

  async login() {
    await this.loginButton.click();
    await this.usernameInput.fill(LOGIN_DATA.username);
    await this.passwordInput.fill(LOGIN_DATA.password);
    await this.submitButton.click();
  }

  async openUserMenu() {
    await this.userMenu.click();
  }
}
