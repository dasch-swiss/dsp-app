import { browser } from 'k6/browser';
import { check } from 'k6';
import { defaultOptions } from '../options/options.js';
import { Counter } from 'k6/metrics';
import { SingleResourcePage } from '../pages/single-resource-page.js';

export const options = defaultOptions;
export const errorCounter = new Counter('errors');

export default async function () {
  const context = await browser.newContext();
  const page = await context.newPage();
  const homepage = new SingleResourcePage(page);

  try {
    await homepage.goto();

    await page.waitForNavigation();
    const resourceLabel = await page.resourcelabel.textContent();
    const success = check(homepage, {
      resourceLabel: resourceLabel => resourceLabel == 'transcription of M087-10-TN',
    });
    if (!success) {
      errorCounter.add(1);
    }
    await page.screenshot({ path: 'screenshots/single-resource-page.png' });
  } finally {
    await page.close();
  }
}
