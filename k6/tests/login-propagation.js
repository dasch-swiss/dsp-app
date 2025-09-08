import { browser } from 'k6/browser';
import { K6TestBase, createUserServiceMetrics, USER_SERVICE_THRESHOLDS } from '../utils/test-base.js';
import { HomePage } from '../pages/home-page.js';
import { ProjectOverviewPage } from '../pages/project-overview-page.js';

// Initialize test base and metrics
const testBase = new K6TestBase('user_state_propagation', '45s');
const metrics = createUserServiceMetrics();

export const options = {
  ...testBase.getBaseOptions(),
  thresholds: {
    'state_propagation_duration': USER_SERVICE_THRESHOLDS['state_propagation_duration'],
    'project_navigation_time': USER_SERVICE_THRESHOLDS['project_navigation_time'],
    'user_menu_persistence': USER_SERVICE_THRESHOLDS['user_menu_persistence'],
    'page_transition_success': USER_SERVICE_THRESHOLDS['page_transition_success']
  }
};

export const setup = () => testBase.setup();

export default async function(data) {
  const page = await browser.newPage();
  const homePage = new HomePage(page);
  const projectPage = new ProjectOverviewPage(page);

  try {
    console.log(`🚀 Testing user state propagation - Version: ${data.version}`);

    // Step 1: Login and establish user state
    await homePage.goto();
    await homePage.login();
    await homePage.userMenu.waitFor({ state: 'visible', timeout: 5000 });

    console.log(`✅ Initial login successful - Version: ${data.version}`);

    // Step 2: Test user state propagation across different pages
    const propagationTests = [
      {
        name: 'project_overview',
        action: async () => {
          const navStart = Date.now();
          await projectPage.goto();

          // Wait for page to load and user state to be available
          await page.waitForLoadState('networkidle');

          // Check if user menu persists (indicates user state propagated)
          const userMenuStart = Date.now();
          const userMenuVisible = await page.locator('[data-cy=user-button]').isVisible();
          const userMenuEnd = Date.now();

          const navEnd = Date.now();

          return {
            navigationTime: navEnd - navStart,
            userMenuTime: userMenuEnd - userMenuStart,
            success: userMenuVisible
          };
        }
      },
      {
        name: 'user_settings_navigation',
        action: async () => {
          const navStart = Date.now();

          // Navigate to user settings (highly user-state dependent)
          await page.locator('[data-cy=user-button]').click();

          // Look for user menu options that depend on user state
          const userMenuOptions = page.locator('[data-cy=user-menu] a');
          await userMenuOptions.first().waitFor({ state: 'visible', timeout: 3000 });

          const navEnd = Date.now();
          const menuItemCount = await userMenuOptions.count();

          return {
            navigationTime: navEnd - navStart,
            success: menuItemCount > 0
          };
        }
      },
      {
        name: 'home_navigation_return',
        action: async () => {
          const navStart = Date.now();

          // Return to home and check if user state is still consistent
          await homePage.goto();
          await page.waitForLoadState('networkidle');

          // Verify user menu is still visible and responsive
          const userMenuVisible = await homePage.userMenu.isVisible();
          const userMenuEnd = Date.now();

          return {
            navigationTime: userMenuEnd - navStart,
            success: userMenuVisible
          };
        }
      }
    ];

    // Execute all propagation tests
    let allTestsSuccessful = true;
    const totalPropagationStart = Date.now();

    for (const test of propagationTests) {
      try {
        console.log(`🔄 Running ${test.name} test - Version: ${data.version}`);

        const result = await test.action();

        // Record metrics
        if (test.name === 'project_overview') {
          metrics.projectNavigationTime.add(result.navigationTime, { version: data.version });
          metrics.userMenuPersistence.add(result.userMenuTime, { version: data.version });
        } else {
          metrics.statePropagationDuration.add(result.navigationTime, { version: data.version });
        }

        if (!result.success) {
          allTestsSuccessful = false;
          console.log(`❌ ${test.name} failed - Version: ${data.version}`);
        } else {
          console.log(`✅ ${test.name} success (${result.navigationTime.toFixed(0)}ms) - Version: ${data.version}`);
        }

        // Small pause between tests to let state settle
        await page.waitForTimeout(200);

      } catch (error) {
        console.log(`❌ ${test.name} error - Version: ${data.version}, Error: ${error.message}`);
        allTestsSuccessful = false;
      }
    }

    const totalPropagationEnd = Date.now();
    const totalPropagationTime = totalPropagationEnd - totalPropagationStart;

    // Record overall success rate
    metrics.pageTransitionSuccess.add(allTestsSuccessful ? 1 : 0, { version: data.version });

    // Count API requests made during the test
    await testBase.countApiRequests(page, metrics, data.version);

    console.log(`🏁 State propagation complete - Version: ${data.version}, Total: ${totalPropagationTime.toFixed(0)}ms, Success: ${allTestsSuccessful}`);

  } catch (error) {
    console.log(`❌ Test suite failed - Version: ${data.version}, Error: ${error.message}`);
    metrics.pageTransitionSuccess.add(0, { version: data.version });
  } finally {
    await page.screenshot({ path: `k6/screenshots/state-propagation-${data.version}-${Date.now()}.png` });
    await page.close();
  }
}

export const teardown = (data) => testBase.teardown(data);
