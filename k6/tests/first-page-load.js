import { browser } from 'k6/browser';
import { HomePage } from '../pages/home-page.js';
import { defaultOptions } from '../options/options.js';
import { expect } from 'https://jslib.k6.io/k6chaijs/4.3.4.0/index.js';

export const options = defaultOptions;

export default async function () {
  const page = await browser.newPage();
  const homepage = new HomePage(page);

  try {
    await homepage.goto();
    expect(await homepage.title()).to.equal('Projects Overview');
    await page.screenshot({ path: 'screenshots/homepage.png' });
  } finally {
    await page.close();
  }
}
