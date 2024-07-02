import { browser } from 'k6/experimental/browser';
import { check } from 'k6';
import { HomePage } from '../pages/home-page.js';
import { defaultOptions } from '../options/options.js';
import { Counter } from 'k6/metrics';

const errorCounter = new Counter('errors');

export const options = defaultOptions;

export default async function () {
  const page = browser.newPage();
  const homepage = new HomePage(page);

  try {
    await homepage.goto();
    page.screenshot({ path: 'screenshots/homepage.png' });
    let success = check(homepage, {
      title: p => p.title.textContent() == 'Projects Overview',
    });

    if (!success) {
      errorCounter.add(1);
    }
  } finally {
    page.close();
  }
}
