import { BEOL, ENVIRONMENTS } from '../options/constants.js';

export class SingleResourcePage {
  constructor(page) {
    this.page = page;
  }

  async goto() {
    const url = __ENV.APP_URL || ENVIRONMENTS.DEV;
    await this.page.goto(url + '/resource/' + BEOL.shortcode + '/-01DyZMkRZO4_YdKtj_Brw');
  }

  async resourceLabel() {
    return await this.page.locator('div.resource-label > h4').textContent();
  }
}
