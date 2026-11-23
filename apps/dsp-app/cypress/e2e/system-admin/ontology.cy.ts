import { CreateOntology } from '../../../../../libs/dsp-js/src';
import { faker } from '@faker-js/faker';
import { railModel } from '../../support/helpers/data-models';
import { uniqueName } from '../../support/helpers/unique-name';
import ProjectPage from '../../support/pages/project-page';

describe('Ontology', () => {
  const projectPage = new ProjectPage();

  beforeEach(() => {
    projectPage.requestProject();
  });

  it('should create new ontology', () => {
    const data = {
      name: uniqueName(),
      label: faker.lorem.words(5),
      comment: faker.lorem.words(10),
    };

    cy.intercept('POST', '/v2/ontologies').as('submitRequest');
    cy.visit(`/project/${projectPage.projectUuid}/data-models`);
    cy.url().should('include', `project\/${projectPage.projectUuid}\/data-models`);

    cy.get('[data-cy=data-models-tree-create-model]').should('be.visible').click();

    cy.get('[data-cy=name-input]').type(data.name);
    // ensure that the label input is visible
    cy.get('[data-cy=label-input]').scrollIntoView().should('be.visible');

    cy.get('[data-cy=label-input]').clear();
    // no label, submit button should be disabled
    cy.get('[data-cy=label-input]').type(data.label);
    cy.get('[data-cy=comment-textarea]').type(data.comment);

    cy.get('[data-cy=comment-textarea]').clear();
    cy.get('[data-cy=comment-textarea]').type(data.comment);

    cy.get('[data-cy=submit-button]').click();

    cy.wait('@submitRequest');
    // The new data model opens on its classes.
    cy.url().should('include', `project/${projectPage.projectUuid}/data-models/classes`);
    cy.url().should('include', `ontology=${data.name}`);
    railModel(data.label).should('be.visible');
  });

  it('should update ontology', () => {
    const data = <CreateOntology>{
      name: uniqueName(),
      label: faker.lorem.words(5),
      comment: faker.lorem.words(10),
    };

    cy.intercept('PUT', '/v2/ontologies/metadata').as('updateRequest');

    cy.createOntology(projectPage).then(ontology => {
      // The pen shows only while the data model's line is hovered, so the click is forced.
      railModel(ontology.ontology.label).find('[data-cy=data-models-tree-edit-model]').click({ force: true });
      cy.get('[data-cy=label-input]').clear().type(data.label);
      cy.get('[data-cy=comment-textarea]').type(data.comment);
      cy.get('[data-cy=submit-button]').click();

      cy.wait('@updateRequest');
      cy.url().should('include', `project/${projectPage.projectUuid}/data-models/classes`);
      cy.url().should('include', `ontology=${ontology.ontology.name}`);
      railModel(data.label).should('be.visible');
    });
  });
});
