/**
 * Base utilities for performance testing to eliminate code duplication
 */

export interface PerformanceMeasurement {
  version: string;
  operation: string;
  duration?: number;
  timestamp: string;
  [key: string]: any;
}

export interface MemorySnapshot {
  label: string;
  memory: number;
  timestamp: number;
  version: string;
}

export class PerformanceTestBase {
  protected version: string;
  protected performanceData: PerformanceMeasurement[] = [];
  protected memorySnapshots: MemorySnapshot[] = [];

  constructor() {
    this.version = Cypress.env('VERSION') || 'unknown';
  }

  /**
   * Standard beforeEach setup for performance tests
   */
  setupTest() {
    // Only reset database for local environments
    const baseUrl = Cypress.config('baseUrl');
    const isLocal = !baseUrl || baseUrl.includes('localhost') || baseUrl.includes('0.0.0.0') || baseUrl.includes('4200');

    if (isLocal) {
      cy.resetDatabase();
    } else {
      cy.log('Skipping database reset for remote environment:', baseUrl);
    }

    cy.loginAdmin();
    this.performanceData = [];
    this.memorySnapshots = [];
  }

  /**
   * Take memory snapshot with consistent logging
   */
  takeMemorySnapshot(label: string): number {
    const memory = (performance as any).memory?.usedJSHeapSize || 0;
    const snapshot: MemorySnapshot = {
      label,
      memory,
      timestamp: Date.now(),
      version: this.version
    };

    this.memorySnapshots.push(snapshot);
    cy.log(`Memory Snapshot - ${label}: ${(memory / 1024 / 1024).toFixed(2)}MB`);
    return memory;
  }

  /**
   * Record performance measurement with consistent structure
   */
  recordMeasurement(operation: string, duration: number, additionalData: any = {}) {
    const measurement: PerformanceMeasurement = {
      version: this.version,
      operation,
      duration,
      timestamp: new Date().toISOString(),
      ...additionalData
    };

    this.performanceData.push(measurement);
    cy.log(`Performance - ${operation}: ${duration.toFixed(0)}ms (Version: ${this.version})`);
    return measurement;
  }

  /**
   * Save measurement to file with consistent naming - DISABLED
   */
  saveMeasurement(measurement: PerformanceMeasurement, prefix: string) {
    cy.log(`Performance measurement saved: ${prefix}`, measurement);
  }

  /**
   * Save memory analysis to file with consistent structure
   */
  saveMemoryAnalysis(baselineMemory: number, finalMemory: number, testType: string, additionalData: any = {}) {
    const memoryGrowth = finalMemory - baselineMemory;
    const growthPercentage = ((memoryGrowth / baselineMemory) * 100);

    const analysis = {
      version: this.version,
      testType,
      baselineMemory,
      finalMemory,
      memoryGrowth,
      growthPercentage,
      snapshots: this.memorySnapshots,
      timestamp: new Date().toISOString(),
      ...additionalData
    };

    cy.log(`Memory Analysis - ${testType}: Growth ${(memoryGrowth / 1024 / 1024).toFixed(2)}MB (${growthPercentage.toFixed(2)}%)`);
    cy.log(`Memory analysis completed: ${testType}`, analysis);

    return analysis;
  }

  /**
   * Memory leak detection for navigation cycles
   */
  runMemoryLeakTest(pages: string[], cycles: number = 3) {
    cy.visit('/');
    const baselineMemory = this.takeMemorySnapshot('baseline');

    for (let cycle = 1; cycle <= cycles; cycle++) {
      cy.log(`Memory test cycle ${cycle}/${cycles}`);

      pages.forEach((page, index) => {
        cy.visit(page);
        cy.wait(200);
        this.takeMemorySnapshot(`cycle_${cycle}_page_${index}_${page.replace(/\//g, '_')}`);
      });

      // Force garbage collection if available
      cy.window().then((win) => {
        if ((win as any).gc) {
          (win as any).gc();
        }
      });

      cy.wait(100);
      this.takeMemorySnapshot(`cycle_${cycle}_after_gc`);
    }

    const finalMemory = this.takeMemorySnapshot('final');
    return this.saveMemoryAnalysis(baselineMemory, finalMemory, 'memory_leak_detection', {
      pages,
      cycles
    });
  }

  /**
   * Measure performance of an operation with timing
   */
  measureOperation(operation: string, fn: () => void, additionalData: any = {}) {
    const start = performance.now();
    fn();
    const end = performance.now();
    const duration = end - start;

    return this.recordMeasurement(operation, duration, additionalData);
  }

  /**
   * Clean up performance data (called in afterEach) - DISABLED
   */
  cleanup() {
    if (this.memorySnapshots.length > 0) {
      cy.log(`Memory snapshots taken: ${this.memorySnapshots.length}`);
    }
    if (this.performanceData.length > 0) {
      cy.log(`Performance measurements taken: ${this.performanceData.length}`);
    }
  }
}

// Common pages used in user service tests
export const USER_SERVICE_TEST_PAGES = [
  '/projects',
  '/account',
  '/system/projects',
  '/system/users'
];

// Performance thresholds for warnings
export const PERFORMANCE_THRESHOLDS = {
  MEMORY_GROWTH_WARNING: 50, // percentage
  MEMORY_GROWTH_CRITICAL: 80, // MB
  BOOTSTRAP_TIME_CRITICAL: 25000, // ms
  STATE_UPDATE_CRITICAL: 1500 // ms
};
