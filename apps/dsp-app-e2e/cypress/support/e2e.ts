import './commands/login';
import { UserProfiles } from '../models/user-profiles';

// do things here before each test if needed
// All active session data (cookies, localStorage and sessionStorage) across all domains are cleared.
beforeEach(() => {
  let users: UserProfiles;
  cy.readFile('cypress/fixtures/user_profiles.json').then((json: UserProfiles) => {
    // read JSON data file
    users = json;

    if (Cypress.spec.relative.startsWith('cypress/e2e/System_Admin')) {
      cy.login({
        username: users.systemAdmin_username_root,
        password: users.systemAdmin_password_root,
      });
    }

    if (Cypress.spec.relative.startsWith('cypress/e2e/Project_Member')) {
      cy.login({
        username: users.projectMember_username,
        password: users.projectMember_password,
      });
    }
  });
});

// do things here after each test if needed
// afterEach(() => {
// });
