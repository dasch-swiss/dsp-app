import { faker } from '@faker-js/faker';
import { UserProfiles } from '../../models/user-profiles';

describe('Authentication', () => {
  const po = {
    loginButton: '[data-cy=login-button]',
    username: '[data-cy=username-input]',
    password: '[data-cy=password-input]',
    submitButton: '[data-cy=submit-button]',
  };
  it('Logged out user can login', () => {
    cy.readFile('cypress/fixtures/user_profiles.json').then((users: UserProfiles) => {
      cy.visit('/');

      cy.get(po.loginButton).click();

      cy.get(po.username).type(users.systemAdmin_username_root);
      cy.get(po.password).type(users.systemAdmin_password_root);
      cy.get(po.submitButton).click();

      cy.get(po.loginButton).should('not.be.visible');
      cy.get('[data-cy=user-button]').should('be.visible');
    });
  });

  it('Logged out user receives a notification if wrong credentials', () => {
    cy.visit('/');

    cy.get(po.loginButton).click();

    cy.get(po.username).type(faker.internet.userName());
    cy.get(po.password).type(faker.internet.password());
    cy.get(po.submitButton).click();

    cy.get('body').click('topLeft');
    cy.get(po.loginButton).should('be.visible');
    cy.get('.data-cy-snackbar').should('contain', 'The username and / or password do not match.');
  });
});
