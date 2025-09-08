import { browser } from 'k6/browser';
import { ResourcePage } from '../pages/resource-page.js';
import { defaultOptions } from '../options/options.js';
import { expect } from 'https://jslib.k6.io/k6chaijs/4.3.4.0/index.js';

export const options = defaultOptions;

export default async function () {
  const page = await browser.newPage();
  const homepage = new ResourcePage(page);

  try {
    await homepage.goto();
    const resourceLabel = await homepage.resourceLabel();
    expect(resourceLabel, 'resource label should exist').to.not.be.empty;
    console.log(`Resource loaded: ${resourceLabel}`);
    await page.screenshot({ path: 'screenshots/resource-page.png' });
  } finally {
    await page.close();
  }
}
