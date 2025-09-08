import { PerformanceTestBase, USER_SERVICE_TEST_PAGES } from '../../support/utils/performance-test-base';

describe('Memory Leak Detection', () => {
  const perfTest = new PerformanceTestBase();

  beforeEach(() => {
    perfTest.setupTest();
    cy.visit('/');
    // Ensure user is properly logged in
    cy.get('[data-cy="user-button"]').should('be.visible');
  });

  it('should detect memory leaks in user subscription patterns', () => {
    // Use shared utility to run comprehensive memory leak test
    perfTest.runMemoryLeakTest(['/projects', '/account', '/system/projects'], 10);
  });

  it('should monitor user authentication memory patterns', () => {
    // Test memory usage during repeated login/logout cycles
    perfTest.takeMemorySnapshot('auth_test_start');

    for (let authCycle = 1; authCycle <= 5; authCycle++) {
      cy.log(`Auth memory test cycle ${authCycle}/5`);

      // Logout using dedicated command
      cy.logout();
      cy.wait(500);
      perfTest.takeMemorySnapshot(`cycle_${authCycle}_logout`);

      // Login again
      cy.loginAdmin();
      cy.visit('/');
      // Wait for authenticated state to load
      cy.get('[data-cy="user-button"]').should('be.visible');
      cy.wait(500);
      perfTest.takeMemorySnapshot(`cycle_${authCycle}_login`);
    }

    perfTest.takeMemorySnapshot('auth_test_end');
  });

  it('should test user service observable subscription cleanup', () => {
    // Use shared utility with predefined user service pages
    perfTest.runMemoryLeakTest(USER_SERVICE_TEST_PAGES, 3);
  });

  afterEach(() => {
    // No cleanup needed - just log results
  });
});
