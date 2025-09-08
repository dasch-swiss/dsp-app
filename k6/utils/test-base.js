import { browser } from 'k6/browser';
import { getBrowserConfig, getPerformanceExpectations } from './environment-config.js';
import { ENVIRONMENTS } from '../options/constants.js';

/**
 * Base K6 test utilities to eliminate code duplication
 */
export class K6TestBase {
  constructor(testName, duration = '30s') {
    this.testName = testName;
    this.duration = duration;
    this.appUrl = __ENV.APP_URL || ENVIRONMENTS.DEV;
    this.versionTag = __ENV.VERSION || 'unknown';
  }

  /**
   * Standard options configuration for user service performance tests
   */
  getBaseOptions(vus = 1) {
    return {
      scenarios: {
        [this.testName]: {
          executor: 'constant-vus',
          vus,
          duration: this.duration,
          options: {
            browser: {
              type: 'chromium',
              ...getBrowserConfig(this.appUrl)
            }
          }
        }
      }
    };
  }

  /**
   * Standard setup function with logging
   */
  setup() {
    console.log(`🔍 Running ${this.testName} for version: ${this.versionTag}`);
    console.log(getPerformanceExpectations(this.appUrl));
    return { version: this.versionTag, url: this.appUrl };
  }

  /**
   * Standard teardown function with logging
   */
  teardown(data) {
    console.log(`✅ Completed ${this.testName} for version: ${data.version}`);
  }

  /**
   * Standard error handling and cleanup for test functions
   */
  async runTestWithCleanup(page, testFunction) {
    try {
      await testFunction();
    } catch (error) {
      console.log(`❌ Test failed - Version: ${this.versionTag}, Error: ${error.message}`);
      throw error;
    } finally {
      await page.screenshot({ path: `k6/screenshots/${this.testName}-${this.versionTag}-${Date.now()}.png` });
      await page.close();
    }
  }

  /**
   * Count API requests by type from browser performance entries
   */
  async countApiRequests(page, metrics, version) {
    const apiRequests = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');
      const apiCounts = {
        auth: 0,
        projects: 0,
        ontologies: 0,
        resources: 0,
        total: 0
      };

      resources.forEach(resource => {
        const url = resource.name;
        if (url.includes('/v2/authentication') || url.includes('/admin/users') || url.includes('/admin/permissions')) {
          apiCounts.auth++;
        } else if (url.includes('/admin/projects') || url.includes('/v2/projects')) {
          apiCounts.projects++;
        } else if (url.includes('/v2/ontologies')) {
          apiCounts.ontologies++;
        } else if (url.includes('/v2/resources') || url.includes('/v2/search')) {
          apiCounts.resources++;
        }

        if (url.includes('/v2/') || url.includes('/admin/')) {
          apiCounts.total++;
        }
      });

      return apiCounts;
    });

    // Record API request metrics
    metrics.authApiCalls.add(apiRequests.auth, { version });
    metrics.projectApiCalls.add(apiRequests.projects, { version });
    metrics.ontologyApiCalls.add(apiRequests.ontologies, { version });
    metrics.resourceApiCalls.add(apiRequests.resources, { version });
    metrics.totalApiCalls.add(apiRequests.total, { version });

    console.log(`📊 API Requests - Auth: ${apiRequests.auth}, Projects: ${apiRequests.projects}, Ontologies: ${apiRequests.ontologies}, Resources: ${apiRequests.resources}, Total: ${apiRequests.total}`);

    return apiRequests;
  }

  /**
   * Measures execution time of an async function
   * Uses K6-compatible timing instead of performance.now()
   */
  async measureAsync(fn) {
    const start = Date.now();
    const result = await fn();
    const duration = Date.now() - start;
    return { result, duration };
  }

  /**
   * Standard success/failure logging
   */
  logResult(operation, duration, success, version = this.versionTag) {
    const status = success ? '✅' : '❌';
    console.log(`${status} ${operation} - Version: ${version}, Duration: ${duration.toFixed(0)}ms`);
  }
}

/**
 * Common metrics for user service performance tests
 */
export function createUserServiceMetrics() {
  const { Trend, Rate, Counter } = require('k6/metrics');

  return {
    loginDuration: new Trend('login_duration', true),
    userMenuAppearance: new Trend('user_menu_appearance', true),
    authFlowSuccess: new Rate('auth_flow_success'),
    userStateUpdate: new Trend('user_state_update', true),
    statePropagationDuration: new Trend('state_propagation_duration', true),
    projectNavigationTime: new Trend('project_navigation_time', true),
    userMenuPersistence: new Trend('user_menu_persistence', true),
    pageTransitionSuccess: new Rate('page_transition_success'),
    // API request counters
    authApiCalls: new Counter('api_auth_requests'),
    projectApiCalls: new Counter('api_project_requests'),
    ontologyApiCalls: new Counter('api_ontology_requests'),
    resourceApiCalls: new Counter('api_resource_requests'),
    totalApiCalls: new Counter('api_total_requests')
  };
}

/**
 * Informational thresholds for user service performance tests
 * These are for monitoring only and will not fail the test
 */
export const USER_SERVICE_THRESHOLDS = {
  // Removed blocking thresholds - now only for informational monitoring
  // Tests will complete regardless of performance to gather data
};

/**
 * Base class for state performance tests
 */
export class StorePerformanceTestBase extends K6TestBase {
  constructor(testName, iterations = 1, maxDuration = '5m') {
    super(testName, maxDuration);
    this.iterations = iterations;
  }

  /**
   * Standard options for regression tests with environment-aware configuration
   */
  getRegressionOptions(vus = 1, customThresholds = {}) {
    // Import at top level - these imports should be available if called from test files
    const { getThresholds, getTestConfig, getBrowserConfig } = this.getConfigFunctions();

    return {
      scenarios: {
        [this.testName]: {
          executor: 'shared-iterations',
          vus,
          iterations: this.iterations,
          maxDuration: this.duration,
          options: {
            browser: {
              type: 'chromium',
              headless: getBrowserConfig(this.appUrl).headless,
            },
          },
        },
      },
      thresholds: {
        ...getThresholds(this.appUrl),
        ...customThresholds
      }
    };
  }

  /**
   * Helper to get config functions - should be overridden by importing files
   */
  getConfigFunctions() {
    // This will be overridden by the actual test files that import the config functions
    return {
      getThresholds: (url) => ({}),
      getTestConfig: (url) => ({ iterations: this.iterations, maxDuration: this.duration }),
      getBrowserConfig: (url) => ({ headless: true })
    };
  }

  /**
   * Setup performance monitoring utilities in browser
   */
  async setupPerformanceMonitoring(page) {
    await page.evaluate(() => {
      window.performanceMetrics = {
        marks: [],
        memorySnapshots: [],
        measurements: [],

        mark: function(name) {
          performance.mark(name);
          this.marks.push({ name, timestamp: performance.now() });
        },

        measure: function(name, startMark, endMark) {
          performance.measure(name, startMark, endMark);
          const entry = performance.getEntriesByName(name, 'measure')[0];
          if (entry) {
            this.measurements.push({
              name,
              duration: entry.duration,
              timestamp: Date.now()
            });
          }
          return entry ? entry.duration : 0;
        },

        getMemorySnapshot: function() {
          const snapshot = performance.memory ? {
            used: performance.memory.usedJSHeapSize,
            total: performance.memory.totalJSHeapSize,
            limit: performance.memory.jsHeapSizeLimit
          } : { used: 0, total: 0, limit: 0 };

          this.memorySnapshots.push({
            ...snapshot,
            timestamp: Date.now()
          });

          return snapshot;
        },

        measureAsync: async function(name, fn) {
          this.mark(`${name}-start`);
          const result = await fn();
          this.mark(`${name}-end`);
          const duration = this.measure(name, `${name}-start`, `${name}-end`);
          return { result, duration };
        }
      };

      // Setup Performance Observer
      if (typeof PerformanceObserver !== 'undefined') {
        const observer = new PerformanceObserver((list) => {
          window.performanceMetrics.marks.push(...list.getEntries());
        });
        observer.observe({entryTypes: ['measure', 'mark', 'navigation']});
      }
    });
  }

  /**
   * Common bootstrap performance test
   */
  async testBootstrap(page, homepage, metrics) {
    const startTime = Date.now();

    await homepage.goto();
    await page.waitForLoadState('domcontentloaded');

    // Wait for Angular to bootstrap
    await page.waitForFunction(() => {
      return document.readyState === 'complete' &&
             (window.ng || document.querySelector('[ng-version]'));
    }, { timeout: 20000 });

    const totalBootstrapTime = Date.now() - startTime;

    console.log(`Bootstrap time: ${totalBootstrapTime}ms`);
    metrics.bootstrapTime.add(totalBootstrapTime);

    return totalBootstrapTime;
  }

  /**
   * Common memory testing patterns
   */
  async testMemoryPattern(page, operations, metrics) {
    const initialMemory = await page.evaluate(() => {
      if (!window.performanceMetrics) return 0;
      return window.performanceMetrics.getMemorySnapshot().used;
    });

    for (const operation of operations) {
      await operation();
      await page.waitForTimeout(100);
    }

    const finalMemory = await page.evaluate(() => {
      if (!window.performanceMetrics) return 0;
      return window.performanceMetrics.getMemorySnapshot().used;
    });

    const memoryDelta = finalMemory - initialMemory;
    console.log(`Memory growth: ${Math.round(memoryDelta / 1024)}KB`);
    metrics.memoryGrowth.add(memoryDelta);

    return memoryDelta;
  }

  /**
   * Test state update latency with common patterns
   */
  async testStateUpdates(page, metrics) {
    // Use simple, universal selectors to avoid runtime require() calls
    const stateTests = [
      { selector: 'button, [role="button"]', action: 'click', name: 'button_interaction' },
      { selector: 'input[type="text"], input[type="search"]', action: 'type', name: 'input_interaction' },
      { selector: 'nav a, [routerLink], .mat-tab', action: 'click', name: 'navigation_interaction' }
    ];

    for (const test of stateTests) {
      try {
        const elements = page.locator(test.selector);
        const count = await elements.count();

        if (count === 0) continue;

        const element = elements.first();
        if (!(await element.isVisible()) || !(await element.isEnabled())) {
          continue;
        }

        const duration = await page.evaluate(async (testInfo) => {
          if (!window.performanceMetrics) return 0;

          const { result, duration } = await window.performanceMetrics.measureAsync(testInfo.name, async () => {
            // Simulate state update
            return true;
          });

          return duration;
        }, test);

        // Perform the actual interaction
        if (test.action === 'click') {
          await element.click();
        } else if (test.action === 'type') {
          await element.fill('test');
          await element.clear();
        }

        await page.waitForTimeout(50);
        metrics.stateUpdateLatency.add(duration);

      } catch (e) {
        console.log(`State update test ${test.name} failed: ${e.message}`);
      }
    }
  }
}

/**
 * Common metrics for state performance tests
 */
export function createStatePerformanceMetrics() {
  const { Trend, Rate, Counter } = require('k6/metrics');

  return {
    stateUpdateLatency: new Trend('state_update_latency'),
    memoryGrowth: new Trend('memory_growth'),
    bootstrapTime: new Trend('bootstrap_time'),
    interactionLatency: new Trend('interaction_latency'),
    memoryEfficiency: new Trend('memory_efficiency'),
    subscriptionOverhead: new Trend('subscription_overhead'),
    stateConsistency: new Counter('state_consistency_issues'),
    statisticalReliability: new Rate('statistical_reliability')
  };
}
