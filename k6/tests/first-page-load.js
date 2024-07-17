import { browser } from 'k6/browser';
import { check } from 'k6';
import { HomePage } from '../pages/home-page.js';
import { defaultOptions } from '../options/options.js';
import { Counter } from 'k6/metrics';

const errorCounter = new Counter('errors');

export const options = defaultOptions;

export default async function () {
  const context = await browser.newContext();
  const page = await context.newPage();
  const homepage = new HomePage(page);

  try {
    await homepage.goto();

    await page.waitForNavigation();
    const title = await page.title.textContent();
    let success = check(homepage, {
      title: title => title == 'Projects Overview',
    });

    if (!success) {
      errorCounter.add(1);
    }
    await page.screenshot({ path: 'screenshots/homepage.png' });
  } finally {
    await page.close();
  }
}
