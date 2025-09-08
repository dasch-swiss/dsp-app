import { browser } from 'k6/browser';
import { HomePage } from '../pages/home-page.js';
import { check } from 'k6';
import { StorePerformanceTestBase, createStatePerformanceMetrics } from '../utils/test-base.js';
import { getThresholds, getTestConfig, getBrowserConfig } from '../utils/environment-config.js';

// Initialize test base and metrics
const testBase = new StorePerformanceTestBase('microBenchmarks', 1, '30s');
const metrics = createStatePerformanceMetrics();

// Override config functions method to provide the actual imports
testBase.getConfigFunctions = () => ({ getThresholds, getTestConfig, getBrowserConfig });

export const options = testBase.getRegressionOptions(1, {
  'interaction_latency': ['p(95)<300'],
  'memory_efficiency': ['avg<1048576'],
  'subscription_overhead': ['avg<50'],
  'state_consistency_issues': ['count<1']
});

export default async function microBenchmarks() {
  const page = await browser.newPage();
  const homepage = new HomePage(page);

  await testBase.runTestWithCleanup(page, async () => {
    console.log('🔬 Store vs BehaviorSubject Micro-benchmarks');

    await testBase.setupPerformanceMonitoring(page);
    await homepage.goto();
    await page.waitForLoadState('networkidle');

    // Run micro-benchmarks using shared utilities
    await testInteractionLatency(page);
    await testMemoryEfficiency(page);
    await testSubscriptionOverhead(page);
    await testStateConsistency(page);

    console.log('✅ Micro-benchmarks completed');
  });
}

async function testInteractionLatency(page) {
  console.log('⚡ Testing user interaction latency');

  const testElements = [
    { selector: 'button, [role="button"]', action: 'click', name: 'button_click' },
    { selector: 'input[type="text"], input[type="search"]', action: 'type', name: 'input_type' },
    { selector: 'a, [routerLink]', action: 'click', name: 'navigation_click' },
    { selector: 'select, .mat-select', action: 'click', name: 'select_click' }
  ];

  for (const test of testElements) {
    try {
      const elements = page.locator(test.selector);
      const count = await elements.count();

      if (count === 0 || !(await elements.first().isVisible()) || !(await elements.first().isEnabled())) {
        continue;
      }

      const element = elements.first();

      // Measure interaction with shared utility
      const duration = await testBase.measureAsync(async () => {
        if (test.action === 'click') {
          await element.click();
        } else if (test.action === 'type') {
          await element.fill('perf-test');
          await element.clear();
        }
        await page.waitForTimeout(50);
      });

      console.log(`${test.name}: ${Math.round(duration.duration)}ms`);
      metrics.interactionLatency.add(duration.duration);

    } catch (e) {
      console.log(`⚠️ ${test.name} test failed: ${e.message}`);
    }
  }
}

async function testMemoryEfficiency(page) {
  console.log('🧠 Testing memory efficiency');

  const operations = [
    async () => {
      const buttons = page.locator('button');
      if (await buttons.count() > 0) {
        await buttons.first().click();
      }
    },
    async () => {
      const inputs = page.locator('input');
      if (await inputs.count() > 0) {
        await inputs.first().fill('memory-test-data');
        await inputs.first().clear();
      }
    },
    async () => {
      await page.reload();
      await page.waitForLoadState('domcontentloaded');
    }
  ];

  // Use shared memory testing utility
  const memoryDelta = await testBase.testMemoryPattern(page, operations, metrics);

  if (memoryDelta > 0) {
    const avgMemoryPerOp = memoryDelta / operations.length;
    console.log(`Average memory per operation: ${Math.round(avgMemoryPerOp / 1024)}KB`);
    metrics.memoryEfficiency.add(avgMemoryPerOp);
  }
}

async function testSubscriptionOverhead(page) {
  console.log('🔗 Testing subscription overhead');

  const subscriptionTests = [];

  for (let i = 0; i < 5; i++) {
    try {
      const overhead = await page.evaluate(() => {
        if (!window.performanceMetrics) return 0;

        const startTime = Date.now();

        // Simulate observable subscription overhead
        const observers = [];
        for (let j = 0; j < 10; j++) {
          observers.push({
            id: j,
            callback: () => {},
            created: Date.now()
          });
        }

        return Date.now() - startTime;
      });

      subscriptionTests.push(overhead);
      console.log(`Subscription test ${i}: ${Math.round(overhead)}ms`);

    } catch (e) {
      console.log(`Subscription test ${i} failed: ${e.message}`);
    }
  }

  if (subscriptionTests.length > 0) {
    const avgOverhead = subscriptionTests.reduce((a, b) => a + b) / subscriptionTests.length;
    console.log(`Average subscription overhead: ${Math.round(avgOverhead)}ms`);
    metrics.subscriptionOverhead.add(avgOverhead);
  }
}

async function testStateConsistency(page) {
  console.log('🎯 Testing state consistency');

  let consistencyIssues = 0;

  // Test 1: Input state consistency
  try {
    const inputs = page.locator('input[type="text"], input[type="search"]');
    if (await inputs.count() > 0) {
      const input = inputs.first();
      const testString = 'consistency-test';

      await input.type(testString, { delay: 10 });
      await page.waitForTimeout(100);

      const finalValue = await input.inputValue();
      if (finalValue !== testString) {
        console.log(`⚠️ State consistency issue: expected "${testString}", got "${finalValue}"`);
        consistencyIssues++;
      }
    }
  } catch (e) {
    console.log(`State consistency test failed: ${e.message}`);
    consistencyIssues++;
  }

  // Test 2: Navigation consistency
  try {
    const currentUrl = page.url();
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    const newUrl = page.url();
    if (currentUrl !== newUrl) {
      console.log(`⚠️ Navigation consistency issue: URL changed`);
      consistencyIssues++;
    }
  } catch (e) {
    console.log(`Navigation consistency test failed: ${e.message}`);
    consistencyIssues++;
  }

  console.log(`State consistency issues found: ${consistencyIssues}`);
  metrics.stateConsistency.add(consistencyIssues);

  check(consistencyIssues, {
    'no_consistency_issues': (issues) => issues === 0,
    'minimal_consistency_issues': (issues) => issues < 2,
  });
}
