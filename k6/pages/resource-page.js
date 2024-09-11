export class ResourcePage {
  constructor(page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto(__ENV.APP_URL + '/project/yTerZGyxjZVqFMNNKXCDPF/ontology/beol/basicLetter');
  }

  async resourceLabel() {
    return await this.page.locator('.resource-header > .resource-label > h4').textContent();
  }
}
