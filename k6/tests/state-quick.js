import { browser } from 'k6/browser';
import { HomePage } from '../pages/home-page.js';
import { check } from 'k6';
import { StorePerformanceTestBase, createStatePerformanceMetrics } from '../utils/test-base.js';
import { getPerformanceExpectations, getThresholds, getTestConfig, getBrowserConfig } from '../utils/environment-config.js';

// Initialize test base and metrics
const testBase = new StorePerformanceTestBase('quickRegressionTest');
const metrics = createStatePerformanceMetrics();

// Override config functions method to provide the actual imports
testBase.getConfigFunctions = () => ({ getThresholds, getTestConfig, getBrowserConfig });

export const options = testBase.getRegressionOptions();

export default async function quickRegressionTest() {
  const page = await browser.newPage();
  const homepage = new HomePage(page);

  await testBase.runTestWithCleanup(page, async () => {
    console.log('🔬 Quick Store Regression Test Starting');
    console.log(getPerformanceExpectations(testBase.appUrl));

    await testBase.setupPerformanceMonitoring(page);

    // Test 1: Bootstrap Performance
    console.log('📊 Testing bootstrap performance...');
    await testBase.testBootstrap(page, homepage, metrics);

    // Test 2: Basic Memory Check
    console.log('🧠 Testing memory patterns...');
    await testMemoryBasic(page, homepage);

    // Test 3: State Update Speed
    console.log('⚡ Testing state updates...');
    await testBase.testStateUpdates(page, metrics);

    console.log('✅ Quick regression test completed');
  });
}

async function testMemoryBasic(page) {
  const operations = [
    async () => {
      const buttons = page.locator('button');
      if (await buttons.count() > 0) {
        await buttons.first().click();
      }
    },
    async () => await page.reload(),
    async () => await page.waitForLoadState('domcontentloaded')
  ];

  const memoryGrowth = await testBase.testMemoryPattern(page, operations, metrics);

  check(memoryGrowth, {
    'memory_growth_under_5mb': (g) => g < 5 * 1024 * 1024,
    'memory_growth_under_10mb': (g) => g < 10 * 1024 * 1024,
  });
}
