import { User } from '../../models/user-profiles';

Cypress.Commands.add('login', (user: User) => {
  cy.session(
    user,
    () => {
      cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/v2/authentication`,
        body: {
          username: user.username,
          password: user.password,
        },
      }).then(response => {
        localStorage.setItem('cookieBanner', 'false');
        localStorage.setItem('ACCESS_TOKEN', response.body.token);
      });
    },
    {
      validate: () => {
        expect(localStorage.getItem('ACCESS_TOKEN')).to.exist;
      },
    }
  );
});
