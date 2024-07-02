export class ResourcePage {
  constructor(page) {
    this.page = page;
    this.rsourcelabel = page.locator('.resource-header > .resource-label > h4');
  }
  async goto() {
    await this.page.goto(__ENV.APP_URL + '/project/yTerZGyxjZVqFMNNKXCDPF/ontology/beol/basicLetter');
  }
}
