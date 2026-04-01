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

const isRemote = (): boolean => {
  const baseUrl = Cypress.config('baseUrl');
  return !!(baseUrl && (baseUrl.includes('dasch.swiss') || baseUrl.includes('stage') || baseUrl.includes('dev-')));
};

// Reset the triplestore once per spec file (not per test).
// Skipped for remote environments, when explicitly disabled, and for read-only logged-out-user specs.
before(() => {
  if (Cypress.env('skipDatabaseCleanup') || isRemote()) return;
  if (Cypress.spec.relative.startsWith('cypress/e2e/logged-out-user')) return;

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
});

// Re-login before each test for system-admin specs.
// testIsolation: true (Cypress default) clears localStorage between tests, wiping the ACCESS_TOKEN.
// Keeping login in beforeEach ensures each test starts authenticated.
beforeEach(() => {
  if (Cypress.env('skipDatabaseCleanup') || isRemote()) return;
  if (!Cypress.spec.relative.startsWith('cypress/e2e/system-admin')) return;

  cy.readFile('cypress/fixtures/user_profiles.json').then((json: UserProfiles) => {
    cy.login({
      username: json.systemAdmin_username_root,
      password: json.systemAdmin_password_root,
    });
  });
});

// do things here after each test if needed
// afterEach(() => {
// });
