import { User, UserProfiles } from '../../models/user-profiles';

// Helper function to get API URL based on environment
function getApiUrl(): string {
  const baseUrl = Cypress.config('baseUrl');

  if (!baseUrl || baseUrl.includes('localhost') || baseUrl.includes('0.0.0.0') || baseUrl.includes('4200')) {
    return Cypress.env('apiUrl') || 'http://0.0.0.0:3333';
  }

  // For remote environments, derive API URL from app URL
  if (baseUrl.includes('dev-02.dasch.swiss')) {
    return 'https://api.dev-02.dasch.swiss';
  }
  if (baseUrl.includes('dev.dasch.swiss')) {
    return 'https://api.dev.dasch.swiss';
  }
  if (baseUrl.includes('stage.dasch.swiss')) {
    return 'https://api.stage.dasch.swiss';
  }
  if (baseUrl.includes('dasch.swiss')) {
    return 'https://api.dasch.swiss';
  }

  return Cypress.env('apiUrl') || 'http://0.0.0.0:3333';
}

Cypress.Commands.add('resetDatabase', () =>
  cy.request({
    method: 'POST',
    url: `${getApiUrl()}/admin/store/ResetTriplestoreContent`,
    body: [
      {
        path: 'test_data/project_data/anything-data.ttl',
        name: 'http://www.knora.org/ontology/0001/anything',
      },
    ],
  })
);

Cypress.Commands.add('login', (user: User) =>
  cy
    .request({
      method: 'POST',
      url: `${getApiUrl()}/v2/authentication`,
      body: {
        username: user.username,
        password: user.password,
      },
    })
    .then(response => {
      localStorage.setItem('cookieBanner', 'false');
      localStorage.setItem('rnw-closed-banners', 'true');
      localStorage.setItem('ACCESS_TOKEN', response.body.token);
    })
);

Cypress.Commands.add('logout', () => {
  cy.session(
    {},
    () => {
      cy.request({
        method: 'DELETE',
        url: `${getApiUrl()}/v2/authentication`,
      }).then(response => {
        localStorage.removeItem('cookieBanner');
        localStorage.removeItem('rnw-closed-banners');
        localStorage.removeItem('ACCESS_TOKEN');
      });
    },
    {
      validate: () => {
        expect(localStorage.getItem('ACCESS_TOKEN')).to.not.exist;
      },
    }
  );
});

Cypress.Commands.add('loginAdmin', () => {
  // Use environment variables if available (for remote environments)
  const envUsername = Cypress.env('DSP_APP_USERNAME');
  const envPassword = Cypress.env('DSP_APP_PASSWORD');

  if (envUsername && envPassword) {
    cy.login({
      username: envUsername,
      password: envPassword,
    });
  } else {
    // Try different admin accounts based on environment
    const baseUrl = Cypress.config('baseUrl');
    const isRemote = baseUrl && (baseUrl.includes('dasch.swiss') || baseUrl.includes('stage') || baseUrl.includes('dev-'));
    
    cy.readFile('cypress/fixtures/user_profiles.json').then((users: UserProfiles) => {
      if (isRemote) {
        // Try system admin first for remote environments
        cy.login({
          username: users.systemAdmin_username,
          password: users.systemAdmin_password,
        });
      } else {
        // Use root for local testing
        cy.login({
          username: users.systemAdmin_username_root,
          password: users.systemAdmin_password_root,
        });
      }
    });
  }
});
