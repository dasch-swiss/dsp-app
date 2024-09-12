import { browser } from 'k6/browser';
import { expect } from 'https://jslib.k6.io/k6chaijs/4.3.4.0/index.js';
import { defaultOptions } from '../options/options.js';
import { SingleResourcePage } from '../pages/single-resource-page.js';

export const options = defaultOptions;

export default async function () {
  const page = await browser.newPage();
  const resourcePage = new SingleResourcePage(page);

  try {
    await resourcePage.goto();
    expect(await resourcePage.resourceLabel(), 'resource label').to.equal('transcription of M219-06-T');
    await page.screenshot({ path: 'screenshots/single-resource-page.png' });
  } finally {
    await page.close();
  }
}
