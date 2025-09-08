import { BEOL, ENVIRONMENTS } from '../options/constants.js';

export class ProjectOverviewPage {
  constructor(page) {
    this.page = page;
  }

  async goto() {
    const url = __ENV.APP_URL || ENVIRONMENTS.DEV;
    await this.page.goto(url + '/project/' + BEOL.id);
  }

  async projectLongname() {
    return await this.page.locator('.project-longname').textContent();
  }
}
