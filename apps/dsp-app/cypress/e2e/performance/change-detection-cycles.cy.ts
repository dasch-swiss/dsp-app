import { PerformanceTestBase } from '../../support/utils/performance-test-base';

describe('Change Detection Performance', () => {
  const perfTest = new PerformanceTestBase();

  beforeEach(() => {
    perfTest.setupTest();
    cy.visit('/');
    // Ensure user is properly logged in via UI flow
    cy.get('[data-cy="user-button"]').should('be.visible');
  });

  it('should measure change detection cycles during user operations', () => {
    cy.window().then((win) => {
      // Access Angular profiler if available
      const ng = (win as any).ng;
      if (!ng?.profiler) {
        cy.log('Angular profiler not available - skipping detailed CD measurement');
        return;
      }

      // Navigate to user-heavy page (project overview with user permissions)
      cy.visit('/projects');

      // Start profiling change detection
      const profileStart = performance.now();

      // Trigger user state dependent operations - click on first project
      cy.get('.project-tile').first().click();

      // Wait for user permissions to load and UI to stabilize
      cy.get('.project-title').should('be.visible');

      cy.window().then(() => {
        const profileEnd = performance.now();
        const totalTime = profileEnd - profileStart;

        // Record performance data using shared utility
        perfTest.recordMeasurement('project_navigation_with_user_permissions', totalTime);
      });
    });
  });

  it('should measure user state change propagation timing', () => {
    // Test rapid user state changes that would trigger many component updates
    cy.visit('/account');

    const startTime = performance.now();

    // Ensure any existing overlays are dismissed
    cy.get('body').click(0, 0);
    cy.wait(100);

    // Open user menu (simulates UserService state access)
    cy.get('[data-cy="user-button"]').should('be.visible').click();
    cy.get('.cdk-overlay-pane .user-menu').should('be.visible');

    // Close menu by clicking outside to test state propagation
    cy.get('body').click(0, 0);
    cy.get('.cdk-overlay-pane .user-menu').should('not.exist');

    // Measure time for all user-dependent components to update
    cy.get('[data-cy="user-button"]').should('be.visible'); // Header should update

    cy.window().then(() => {
      const endTime = performance.now();
      const propagationTime = endTime - startTime;

      perfTest.recordMeasurement('user_state_propagation', propagationTime);
    });
  });

  it('should measure memory usage during user operations', () => {
    cy.window().then(() => {
      // Baseline memory measurement
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Perform user-intensive operations
      const pages = ['/projects', '/account', '/system/projects'];
      for (let i = 0; i < 3; i++) {
        pages.forEach(page => {
          cy.visit(page);
          cy.wait(300);
        });
      }

      cy.window().then(() => {
        const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
        const memoryIncrease = finalMemory - initialMemory;

        perfTest.recordMeasurement('user_navigation_memory_usage', memoryIncrease, {
          initialMemory,
          finalMemory
        });
      });
    });
  });

  afterEach(() => {
    // No cleanup needed - just log results
  });
});
