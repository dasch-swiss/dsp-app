import { browser } from 'k6/experimental/browser';
import { check } from 'k6';
import { ResourcePage } from '../pages/resource-page.js';
import { defaultOptions } from '../options/options.js';
import { Counter } from 'k6/metrics';

export const options = defaultOptions;
export const errorCounter = new Counter('errors');

export default async function () {
  const page = browser.newPage();
  const homepage = new ResourcePage(page);

  try {
    await homepage.goto();
    const success = check(homepage, {
      resourcelabel: p => p.rsourcelabel.textContent() == '1723-02-06_Scheuchzer_Johann_Jakob-Bernoulli_Johann_I',
    });
    if (!success) {
      errorCounter.add(1);
    }
    page.screenshot({ path: 'screenshots/resource-page.png' });
  } finally {
    page.close();
  }
}
