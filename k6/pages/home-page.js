export class HomePage {
  constructor(page) {
    this.page = page;
    this.title = page.locator('html > head > title');
  }

  async goto() {
    await this.page.goto(__ENV.APP_URL);
  }
}
