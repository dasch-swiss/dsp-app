import { BEOL, ENVIRONMENTS } from '../options/constants.js';

export class ResourcePage {
  constructor(page) {
    this.page = page;
  }

  async goto() {
    const url = __ENV.APP_URL || ENVIRONMENTS.DEV;
    await this.page.goto(url + '/project/' + BEOL.id + '/ontology/beol/basicLetter');
  }

  async resourceLabel() {
    return await this.page.locator('.resource-header > .resource-label > h4').textContent();
  }
}
