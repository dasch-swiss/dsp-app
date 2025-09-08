import { browser } from 'k6/browser';
import { HomePage } from '../pages/home-page.js';
import { StorePerformanceTestBase, createStatePerformanceMetrics } from '../utils/test-base.js';
import { getThresholds, getTestConfig, getBrowserConfig, getPerformanceExpectations } from '../utils/environment-config.js';

// Initialize test base and metrics
const testBase = new StorePerformanceTestBase('statisticalTest', 3, '8m');
const metrics = createStatePerformanceMetrics();

// Override config functions method to provide the actual imports
testBase.getConfigFunctions = () => ({ getThresholds, getTestConfig, getBrowserConfig });

export const options = testBase.getRegressionOptions(1, {
  // Additional statistical thresholds
  'statistical_reliability': ['rate>0.8'],
  'state_update_latency': ['p(95)<800', 'avg<600'],
  'bootstrap_time': ['p(90)<18000', 'avg<15000']
});

export default async function statisticalRegressionTest() {
  const page = await browser.newPage();
  const homepage = new HomePage(page);

  await testBase.runTestWithCleanup(page, async () => {
    console.log('📊 Statistical Regression Test - Iteration');
    console.log(getPerformanceExpectations(testBase.appUrl));

    await testBase.setupPerformanceMonitoring(page);

    // Perform statistical test with warmup
    const iterationReliable = await performMainTest(page, homepage);
    metrics.statisticalReliability.add(iterationReliable ? 1 : 0);
  });
}

async function performMainTest(page, homepage) {
  try {
    // Bootstrap test
    await testBase.testBootstrap(page, homepage, metrics);

    // Memory test
    const operations = [
      async () => await page.reload(),
      async () => await page.waitForLoadState('networkidle')
    ];
    await testBase.testMemoryPattern(page, operations, metrics);

    // State update test
    await testBase.testStateUpdates(page, metrics);

    return true;
  } catch (e) {
    console.log(`❌ Test iteration failed: ${e.message}`);
    return false;
  }
}
