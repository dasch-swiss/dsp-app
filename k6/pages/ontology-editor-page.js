import { BEOL } from '../options/constants.js';

export class OntologyEditorPage {
  constructor(page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto(__ENV.APP_URL + '/project/' + BEOL.id + '/ontology/beol/editor/classes');
  }

  async projectLongname() {
    return await this.page.locator('project-longname').textContent();
  }
}
