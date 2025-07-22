import { faker } from '@faker-js/faker';
import { ListGetResponseADM } from '../../../../../libs/vre/open-api/src';
import { UserProfiles } from '../../models/user-profiles';
import { Project0001Page } from '../../support/pages/existing-ontology-class-page';

describe('Project Member - List management', () => {
  const projectPage = new Project0001Page();
  let listUrl: string;
  let listId: string;

  before(() => {
    cy.resetDatabase();
  });

  beforeEach(() => {
    cy.readFile('cypress/fixtures/user_profiles.json').then((json: UserProfiles) => {
      const users: UserProfiles = json;
      cy.login({
        username: users.anythingProjectAdmin_username,
        password: users.anythingProjectAdmin_password,
      });
    });
  });

  describe('List Management', () => {
    beforeEach(() => {
      cy.request<ListGetResponseADM>('POST', `${Cypress.env('apiUrl')}/admin/lists`, {
        comments: [{ language: 'de', value: faker.lorem.words(2) }],
        labels: [{ language: 'de', value: faker.lorem.words(2) }],
        projectIri: `http://rdfh.ch/projects/${projectPage.projectShortCode}`,
      }).then(response => {
        listId = response.body.list.listinfo.id.match(/\/([^\/]*)$/)[1];
        listUrl = `/project/${projectPage.projectShortCode}/list/${listId}`;
      });
    });

    it('should create new list', () => {
      const createData = {
        label: faker.lorem.words(2),
        comment: faker.lorem.sentence(),
      };

      cy.intercept('POST', '/admin/lists').as('submitRequest');

      cy.visit(`/project/${projectPage.projectShortCode}/data-models`);
      cy.get('[data-cy=create-list-button]').click();
      cy.get('[data-cy=label-input]').type(createData.label);
      cy.get('[data-cy=comments-input]').type(createData.comment);
      cy.get('[data-cy=submit-button]').click();

      cy.wait('@submitRequest');
      cy.url().should('match', new RegExp(`/project/${projectPage.projectShortCode}/list/(.+)`));
    });

    it('should edit existing list', () => {
      const editData = {
        label: faker.lorem.words(2),
        comment: faker.lorem.words(2),
      };

      cy.intercept('PUT', '/admin/lists/*').as('editRequest');

      cy.visit(listUrl);

      cy.get('[data-cy=edit-button]').click();
      cy.get('[data-cy=label-input] input').clear().type(editData.label, { force: true });
      cy.get('[data-cy=comments-input]').clear().type(editData.comment);
      cy.get('[data-cy=submit-button]').click();

      cy.wait('@editRequest');
      cy.url().should('match', new RegExp(`/project/${projectPage.projectShortCode}/list/(.+)`));
      cy.get('[data-cy=label-title]').contains(editData.label);
      cy.get('[data-cy=comment-title]').contains(editData.comment);
    });

    it('should delete existing list', () => {
      cy.visit(listUrl);
      cy.intercept('DELETE', '/admin/lists/*').as('deleteRequest');
      cy.get('[data-cy=delete-button]').click();
      cy.get('[data-cy=confirmation-button]').click();
      cy.wait('@deleteRequest');

      cy.url().should('match', new RegExp(`/project/${projectPage.projectShortCode}/data-models$`));
    });

    it('should create and edit list in single test', () => {
      const createData = {
        label: faker.lorem.words(2),
        comment: faker.lorem.sentence(),
      };

      const editData = {
        label: faker.lorem.words(2),
        comment: faker.lorem.words(2),
      };

      cy.intercept('POST', '/admin/lists').as('createRequest');
      cy.intercept('PUT', '/admin/lists/*').as('editRequest');

      // Create list
      cy.visit(`/project/${projectPage.projectShortCode}/data-models`);
      cy.get('[data-cy=create-list-button]').click();
      cy.get('[data-cy=label-input]').type(createData.label);
      cy.get('[data-cy=comments-input]').type(createData.comment);
      cy.get('[data-cy=submit-button]').click();

      cy.wait('@createRequest');
      cy.url().should('match', new RegExp(`/project/${projectPage.projectShortCode}/list/(.+)`));

      // Edit the created list
      cy.get('[data-cy=edit-button]').click();
      cy.get('[data-cy=label-input] input').clear().type(editData.label, { force: true });
      cy.get('[data-cy=comments-input]').clear().type(editData.comment);
      cy.get('[data-cy=submit-button]').click();

      cy.wait('@editRequest');
      cy.url().should('match', new RegExp(`/project/${projectPage.projectShortCode}/list/(.+)`));
      cy.get('[data-cy=label-title]').contains(editData.label);
      cy.get('[data-cy=comment-title]').contains(editData.comment);
    });
  });
});
