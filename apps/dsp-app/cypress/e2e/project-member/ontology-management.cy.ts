import { faker } from '@faker-js/faker';
import { UserProfiles } from '../../models/user-profiles';
import { Project0001Page } from '../../support/pages/existing-ontology-class-page';

describe('Project Member - Ontology management', () => {
  const projectPage = new Project0001Page();

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

  describe('Ontology Management', () => {
    it('should create new ontology and edit the ontology', () => {
      const createData = {
        name: faker.string.alpha({ length: { min: 3, max: 16 } }),
        label: faker.lorem.words(5),
        comment: faker.lorem.words(10),
      };

      const editData = {
        label: faker.lorem.words(5),
        comment: faker.lorem.words(10),
      };

      cy.intercept('POST', '/v2/ontologies').as('submitRequest');
      cy.visit(`/project/${projectPage.projectShortCode}/data-models`);
      cy.url().should('include', `project\/${projectPage.projectShortCode}\/data-models`);

      cy.get('[data-cy=data-models-container]')
        .find('[data-cy=create-button]')
        .scrollIntoView()
        .should('be.visible')
        .click();

      cy.get('[data-cy=name-input]').type(createData.name);
      // ensure that the label input is visible
      cy.get('[data-cy=label-input]').scrollIntoView().should('be.visible');

      cy.get('[data-cy=label-input]').clear();
      cy.get('[data-cy=label-input]').type(createData.label);
      cy.get('[data-cy=comment-textarea]').type(createData.comment);
      cy.get('[data-cy=submit-button]').should('be.enabled');

      cy.get('[data-cy=comment-textarea]').clear();
      cy.get('[data-cy=comment-textarea]').type(createData.comment);

      cy.get('[data-cy=submit-button]').click();

      cy.wait('@submitRequest');
      cy.url().should('include', `project/${projectPage.projectShortCode}/ontology/${createData.name}/editor/classes`);
      cy.get('[data-cy=ontology-label]').contains(createData.label).should('be.visible');
      cy.get('[data-cy=edit-ontology-button]').scrollIntoView().should('be.visible').click();
      cy.get('[data-cy=label-input]').clear().type(editData.label);
      cy.get('[data-cy=comment-textarea]').clear().type(editData.comment);
      cy.get('[data-cy=submit-button]').click();
      cy.url().should('include', `project/${projectPage.projectShortCode}/ontology/${createData.name}/editor/classes`);
      cy.get('[data-cy=ontology-label]').contains(editData.label).should('be.visible');
    });
  });
});
