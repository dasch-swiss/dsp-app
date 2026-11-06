import type { TestRunnerConfig } from '@storybook/test-runner';

const config: TestRunnerConfig = {
  // Angular's dev-only checks (ExpressionChangedAfterItHasBeenChecked, full error messages) run
  // only while `ngDevMode` is truthy.
  async postVisit(page) {
    if (!(await page.evaluate(() => Boolean((globalThis as { ngDevMode?: unknown }).ngDevMode)))) {
      throw new Error('Angular runs in production mode; build //:storybook with --enable-prod-mode=false');
    }
  },
};

export default config;
