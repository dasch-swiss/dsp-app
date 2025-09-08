// Environment-specific configuration for performance tests
import { ENVIRONMENTS } from '../options/constants.js';

/**
 * Get environment-specific performance thresholds
 * Different environments may have different performance characteristics
 */
export function getThresholds(environmentUrl) {
  const environment = getEnvironmentName(environmentUrl);

  const baseThresholds = {
    dev: {
      'state_update_latency': ['avg<800'], // More lenient for dev
      'memory_growth': ['avg<62914560'], // 60MB for dev (less optimized)
      'bootstrap_time': ['avg<20000'], // 20s for dev
      'checks': ['rate>0.5'], // 50% for dev environment
    },
    stage: {
      'state_update_latency': ['avg<600'], // Production-like performance
      'memory_growth': ['avg<52428800'], // 50MB for stage
      'bootstrap_time': ['avg<15000'], // 15s for stage
      'checks': ['rate>0.6'], // 60% for stage
    },
    prod: {
      'state_update_latency': ['avg<500'], // Strictest for production
      'memory_growth': ['avg<41943040'], // 40MB for production
      'bootstrap_time': ['avg<12000'], // 12s for production
      'checks': ['rate>0.7'], // 70% for production
    }
  };

  // Default to stage thresholds if environment not recognized
  return baseThresholds[environment] || baseThresholds.stage;
}

/**
 * Get environment-specific test configuration
 */
export function getTestConfig(environmentUrl) {
  const environment = getEnvironmentName(environmentUrl);

  const configs = {
    dev: {
      maxDuration: '4m', // Longer timeout for dev
      gracefulStop: '30s',
      iterations: 1,
      warmupTime: '10s'
    },
    stage: {
      maxDuration: '3m',
      gracefulStop: '30s',
      iterations: 1,
      warmupTime: '5s'
    },
    prod: {
      maxDuration: '2m', // Faster execution for prod
      gracefulStop: '15s',
      iterations: 1,
      warmupTime: '5s'
    }
  };

  return configs[environment] || configs.stage;
}

/**
 * Get browser configuration based on environment
 */
export function getBrowserConfig(environmentUrl) {
  const environment = getEnvironmentName(environmentUrl);

  const configs = {
    dev: {
      headless: true,
      timeout: '30s'
    },
    stage: {
      headless: true,
      timeout: '20s'
    },
    prod: {
      headless: true,
      timeout: '15s'
    }
  };

  return configs[environment] || configs.stage;
}

/**
 * Determine environment name from URL
 */
function getEnvironmentName(url) {
  if (!url) return 'stage'; // Default

  if (url.includes('dev-02')) return 'dev';
  if (url.includes('dev.')) return 'dev';
  if (url.includes('stage.')) return 'stage';
  if (url.includes('app.dasch.swiss') && !url.includes('dev') && !url.includes('stage')) return 'prod';

  return 'stage'; // Default fallback
}

/**
 * Get environment-specific selectors for better element finding
 */
export function getEnvironmentSelectors(environmentUrl) {
  const environment = getEnvironmentName(environmentUrl);

  // Different environments might have different UI structures
  const selectors = {
    dev: {
      navigation: [
        'nav a[href]:not([href="#"]):visible',
        '[routerLink]:visible',
        'a[href*="/project"]:visible',
        '.navigation-link:visible'
      ],
      buttons: [
        'button:visible:not([disabled])',
        '[role="button"]:visible',
        '.mat-button:visible',
        '.btn:visible'
      ],
      inputs: [
        'input[type="text"]:visible',
        'input[type="search"]:visible',
        'textarea:visible',
        '.mat-input-element:visible'
      ]
    }
  };

  // Use dev selectors for all environments (they should be most comprehensive)
  return selectors.dev;
}

/**
 * Get performance expectations message based on environment
 */
export function getPerformanceExpectations(environmentUrl) {
  const environment = getEnvironmentName(environmentUrl);

  const expectations = {
    dev: '🔧 DEV Environment: Expecting slower performance due to development builds and debug features',
    stage: '🎭 STAGE Environment: Expecting production-like performance with some monitoring overhead',
    prod: '🚀 PRODUCTION Environment: Expecting optimal performance with full optimizations'
  };

  return expectations[environment] || expectations.stage;
}
