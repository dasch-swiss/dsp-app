import { UserProfiles } from '../models/user-profiles';
import './commands/api-commands';
import './commands/auth-commands';
import './commands/data-model-class-command';
import './commands/ontology-command';

const resizeObserverLoopErrRe = /^[^(ResizeObserver loop limit exceeded)]/;
Cypress.on('uncaught:exception', err => {
  /* returning false here prevents Cypress from failing the test */
  if (resizeObserverLoopErrRe.test(err.message)) {
    return false;
  }
});

// do things here before each test if needed
// All active session data (cookies, localStorage and sessionStorage) across all domains are cleared.
beforeEach(() => {
  if (Cypress.env('skipDatabaseCleanup')) {
    return; // Skip cleanup
  }

  let users: UserProfiles;

  // clear database
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/admin/store/ResetTriplestoreContent`,
  });

  cy.readFile('cypress/fixtures/user_profiles.json').then((json: UserProfiles) => {
    // read JSON data file
    users = json;

    if (Cypress.spec.relative.startsWith('cypress/e2e/system-admin')) {
      cy.login({
        username: users.systemAdmin_username_root,
        password: users.systemAdmin_password_root,
      });
    }
  });
});

// do things here after each test if needed
// afterEach(() => {
// });
