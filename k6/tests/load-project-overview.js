import { browser } from 'k6/browser';
import { defaultOptions } from '../options/options.js';
import { ProjectOverviewPage } from '../pages/project-overview-page.js';
import { expect } from 'https://jslib.k6.io/k6chaijs/4.3.4.0/index.js';

export const options = defaultOptions;

export default async function () {
  const page = await browser.newPage();
  const projectOverviewPage = new ProjectOverviewPage(page);

  try {
    await projectOverviewPage.goto();
    expect(await projectOverviewPage.projectLongname(), 'project name').to.equal('Bernoulli-Euler Online');
    await page.screenshot({ path: 'screenshots/project-overview-page.png' });
  } finally {
    await page.close();
  }
}
