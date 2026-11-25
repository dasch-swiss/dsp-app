import { faker } from '@faker-js/faker';
import { CLASS_TYPES } from '../helpers/constants';
import { classCard, openCreateClassDialog } from '../helpers/data-models';
import ProjectPage from '../pages/project-page';

Cypress.Commands.add(
  'createDataModelClass',
  (
    projectPage: ProjectPage,
    resourceClass = {
      id: faker.lorem.word(),
      name: faker.lorem.word(),
      type: '',
      subClassOf: [],
      comment: [{ value: faker.lorem.word() }],
      label: [{ value: faker.lorem.word() }],
    }
  ) => {
    cy.intercept('POST', '/v2/ontologies/classes').as('createClassRequest');

    return cy.createOntology(projectPage).then(() => {
      openCreateClassDialog(CLASS_TYPES.textRepresentation.label);
      cy.get('[data-cy=comment-textarea]').should('be.visible').clear().type(resourceClass.comment[0].value);
      cy.get('[data-cy=name-input]').clear().type(resourceClass.name);
      cy.get('[data-cy=label-input]').clear().type(resourceClass.label[0].value);
      cy.get('[data-cy=submit-button]').should('be.visible').click();

      cy.wait('@createClassRequest');
      classCard(resourceClass.name).should('be.visible');
      cy.log('Data model class created!');

      return cy.wrap(resourceClass).as('dataModelClass');
    });
  }
);
