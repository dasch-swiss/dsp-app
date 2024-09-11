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
    expect(await homepage.resourceLabel()).to.equal('1723-02-06_Scheuchzer_Johann_Jakob-Bernoulli_Johann_I');
    await page.screenshot({ path: 'screenshots/resource-page.png' });
  } finally {
    await page.close();
  }
}
