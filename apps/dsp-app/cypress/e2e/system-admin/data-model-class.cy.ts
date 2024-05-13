import { ResourceClassDefinitionWithAllLanguages } from '@dasch-swiss/dsp-js';
import { faker } from '@faker-js/faker';
import { ClassType, PropertyType } from '../../support/helpers/constants';
import { DataModelClassProperty } from '../../support/helpers/interfaces';
import ProjectPage from '../../support/pages/project-page';

describe('Data Model Class', () => {
  const projectPage = new ProjectPage();

  beforeEach(() => {
    projectPage.requestProject();
  });

  it('should create new data model class', () => {
    const textClass: ResourceClassDefinitionWithAllLanguages = {
      id: faker.lorem.word(),
      subClassOf: [],
      propertiesList: [],
      canBeInstantiated: true,
      label: faker.lorem.words(5),
      comment: faker.lorem.words(10),
      comments: [],
      labels: [],
    };

    const resourceClass: ResourceClassDefinitionWithAllLanguages = {
      id: faker.lorem.word(),
      subClassOf: [],
      propertiesList: [],
      canBeInstantiated: true,
      label: faker.lorem.words(5),
      comment: faker.lorem.words(10),
      comments: [],
      labels: [],
    };

    cy.intercept('POST', '/v2/ontologies/classes').as('createRequest');

    cy.createOntology(projectPage);

    cy.get('[data-cy=create-class-button]').scrollIntoView().should('be.visible').click();
    cy.get(`[data-cy=${ClassType.TextRepresentation}]`).scrollIntoView().should('be.visible').click({ force: true });
    cy.get('[data-cy=name-input]').clear().type(textClass.id);
    cy.get('[data-cy=label-input]').clear().type(textClass.label);
    cy.get('[data-cy=comment-textarea]').type(textClass.comment);
    cy.get('[data-cy=submit-button]').click();

    cy.wait('@createRequest');
    cy.get('[data-cy=class-card]').should('be.visible').get('mat-card-title').contains(textClass.label.split(' ')[0]);
    cy.get('[data-cy=create-class-button]').scrollIntoView().should('be.visible').click();
    cy.get(`[data-cy=${ClassType.Resource}]`).scrollIntoView().should('be.visible').click({ force: true });
    cy.get('[data-cy=name-input]').clear().type(resourceClass.id);
    cy.get('[data-cy=label-input]').clear().type(resourceClass.label);
    cy.get('[data-cy=comment-textarea]').type(resourceClass.comment);
    cy.get('[data-cy=submit-button]').click();

    cy.wait('@createRequest');
    cy.get('[data-cy=class-card]')
      .should('be.visible')
      .get('mat-card-title')
      .contains(resourceClass.label.split(' ')[0]);
  });

  it('should cancel to create data model class', () => {
    cy.createOntology(projectPage);

    cy.get('[data-cy=create-class-button]').scrollIntoView().should('be.visible').click();
    cy.get(`[data-cy=${ClassType.TextRepresentation}]`).scrollIntoView().should('be.visible').click({ force: true });
    cy.get('.mat-mdc-dialog-container').should('be.visible');
    cy.get('[data-cy=cancel-button]').scrollIntoView().should('be.visible').click();
    cy.get('.mat-mdc-dialog-container').should('not.exist');

    cy.get('[data-cy=create-class-button]').scrollIntoView().should('be.visible').click();
    cy.get(`[data-cy=${ClassType.TextRepresentation}]`).scrollIntoView().click({ force: true });
    cy.get('.mat-mdc-dialog-container').should('be.visible');
    cy.get('.cdk-overlay-backdrop-showing').click(-50, -50, { force: true });
    cy.get('.mat-mdc-dialog-container').should('not.exist');
  });

  it('should add property to a data model class', () => {
    const textProperty = <DataModelClassProperty>{
      name: faker.lorem.word(),
      label: faker.lorem.words(5),
      comment: faker.lorem.words(10),
    };

    cy.intercept('POST', '/v2/ontologies/properties').as('createPropertyRequest');
    cy.createDataModelClass(projectPage);

    cy.get('[data-cy=class-card]').should('be.visible');
    cy.get('[data-cy=add-property-button]').should('be.visible').click();
    cy.get('[data-cy=create-new-from-type-button]').should('be.visible').click({ force: true });
    cy.get(`[data-cy=${PropertyType.Text}]`).should('be.visible').click();
    cy.get(`[data-cy=${PropertyType.Short}]`).should('be.visible').click();

    cy.get('[data-cy=name-input]').clear().type(textProperty.name);
    cy.get('[data-cy=label-input] input').clear().type(textProperty.label);
    cy.get('[data-cy=comment-textarea]').type(textProperty.comment);
    cy.get('[data-cy=submit-button]').click();

    cy.wait('@createPropertyRequest');
    cy.reload(); // TODO remove
    cy.get('[data-cy=property-label]').should('be.visible').should('include.text', textProperty.label);
  });
});
