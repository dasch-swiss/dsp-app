import { browser } from 'k6/browser';
import { HomePage } from '../pages/home-page.js';
import { StorePerformanceTestBase, createStatePerformanceMetrics } from '../utils/test-base.js';
import { getThresholds, getTestConfig, getBrowserConfig } from '../utils/environment-config.js';

// Initialize test base and metrics
const testBase = new StorePerformanceTestBase('storeRegressionTest');
const metrics = createStatePerformanceMetrics();

// Override config functions method to provide the actual imports
testBase.getConfigFunctions = () => ({ getThresholds, getTestConfig, getBrowserConfig });

export const options = testBase.getRegressionOptions(1, {
  'store_state_update_latency': ['avg<600'],
  'store_memory_growth': ['avg<52428800'],
  'store_component_render_time': ['avg<300'],
  'store_subscription_efficiency': ['rate>0.6'],
  'store_bootstrap_time': ['avg<15000']
});

export default async function storeRegressionTest() {
  const page = await browser.newPage();
  const homepage = new HomePage(page);

  await testBase.runTestWithCleanup(page, async () => {
    console.log('🔬 Starting State Performance Tests');

    await testBase.setupPerformanceMonitoring(page);

    // Use shared test methods
    await testBase.testBootstrap(page, homepage, metrics);
    await testBase.testStateUpdates(page, metrics);

    const memoryOperations = [
      async () => await page.reload(),
      async () => await page.waitForTimeout(1000)
    ];
    await testBase.testMemoryPattern(page, memoryOperations, metrics);

    console.log('✅ State Performance tests completed');
  });
}
