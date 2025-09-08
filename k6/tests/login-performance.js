import { browser } from 'k6/browser';
import { K6TestBase, createUserServiceMetrics, USER_SERVICE_THRESHOLDS } from '../utils/test-base.js';
import { HomePage } from '../pages/home-page.js';

// Initialize test base and metrics
const testBase = new K6TestBase('login_performance_test', '30s');
const metrics = createUserServiceMetrics();

export const options = {
  ...testBase.getBaseOptions(),
  thresholds: {
    'login_duration': USER_SERVICE_THRESHOLDS['login_duration'],
    'user_menu_appearance': USER_SERVICE_THRESHOLDS['user_menu_appearance'],
    'auth_flow_success': USER_SERVICE_THRESHOLDS['auth_flow_success'],
    'user_state_update': USER_SERVICE_THRESHOLDS['user_state_update']
  }
};

export const setup = () => testBase.setup();

export default async function(data) {
  const page = await browser.newPage();
  const homePage = new HomePage(page);

  await testBase.runTestWithCleanup(page, async () => {
    console.log(`🚀 Testing login performance - Version: ${data.version}`);

    // Step 1: Navigate to homepage
    await homePage.goto();

    // Step 2: Measure login process
    const { duration: loginTime } = await testBase.measureAsync(async () => {
      await homePage.loginButton.click();
      await homePage.usernameInput.fill(__ENV.DSP_APP_USERNAME);
      await homePage.passwordInput.fill(__ENV.DSP_APP_PASSWORD);
      await homePage.submitButton.click();
    });

    // Step 3: Measure user state propagation timing
    const { duration: userStateTime, result: isUserMenuVisible } = await testBase.measureAsync(async () => {
      try {
        await homePage.userMenu.waitFor({ state: 'visible', timeout: 5000 });
        return await homePage.userMenu.isVisible();
      } catch (error) {
        testBase.logResult('Login timeout', 0, false, data.version);
        return false;
      }
    });

    // Record metrics and results
    const totalAuthTime = loginTime + userStateTime;
    const success = isUserMenuVisible;

    metrics.loginDuration.add(loginTime, { version: data.version });
    metrics.userMenuAppearance.add(userStateTime, { version: data.version });
    metrics.userStateUpdate.add(totalAuthTime, { version: data.version });
    metrics.authFlowSuccess.add(success ? 1 : 0, { version: data.version });

    testBase.logResult(`Auth (Total: ${totalAuthTime.toFixed(0)}ms, Login: ${loginTime.toFixed(0)}ms, State: ${userStateTime.toFixed(0)}ms)`, totalAuthTime, success, data.version);

    // Count API requests made during the test
    await testBase.countApiRequests(page, metrics, data.version);

    if (success) {
      await page.waitForTimeout(500); // Allow additional state updates
    }
  });
}

export const teardown = (data) => testBase.teardown(data);
