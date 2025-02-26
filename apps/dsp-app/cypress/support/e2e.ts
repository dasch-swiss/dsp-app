import { UserProfiles } from '../models/user-profiles';
import './commands/api-commands';
import './commands/auth-commands';
import './commands/data-model-class-command';
import './commands/ontology-command';
import '@cypress/code-coverage/support';

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
    body: [
      {
        path: 'test_data/project_data/anything-data.ttl',
        name: 'http://www.knora.org/ontology/0001/anything',
      },
      // {
      //   path: 'test_data/project_data/images-demo-data.ttl',
      //   name: 'http://www.knora.org/data/00FF/images',
      // },
      // {
      //   path: 'test_data/project_data/beol-data.ttl',
      //   name: 'http://www.knora.org/data/0801/beol',
      // },
      // {
      //   path: 'test_data/project_ontologies/books-onto.ttl',
      //   name: 'http://www.knora.org/ontology/0001/books',
      // },
      // {
      //   path: 'test_data/project_data/incunabula-data.ttl',
      //   name: 'http://www.knora.org/data/0803/incunabula',
      // },
      // {
      //   path: 'test_data/project_data/biblio-data.ttl',
      //   name: 'http://www.knora.org/data/0801/biblio',
      // },
      // {
      //   path: 'test_data/project_data/webern-data.ttl',
      //   name: 'http://www.knora.org/data/0806/webern',
      // },
      // {
      //   path: 'test_data/project_ontologies/dokubib-onto.ttl',
      //   name: 'http://www.knora.org/ontology/0804/dokubib',
      // },
    ],
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
