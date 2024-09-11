export class SingleResourcePage {
  constructor(page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto(__ENV.APP_URL + '/resource/0801/-01DyZMkRZO4_YdKtj_Brw');
  }

  async resourceLabel() {
    return await this.page.locator('div.resource-label > h4').textContent();
  }
}
