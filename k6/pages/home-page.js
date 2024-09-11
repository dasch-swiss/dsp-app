export class HomePage {
  constructor(page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto(__ENV.APP_URL);
  }

  async title() {
    return await this.page.title();
  }
}
