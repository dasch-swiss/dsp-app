import { ResourceClassDefinitionWithAllLanguages } from '@dasch-swiss/dsp-js';
import { faker } from '@faker-js/faker';
import { DataModelClassProperty } from '../../models/data-model-class';
import { CLASS_TYPES, PropertyType } from '../../support/helpers/constants';
import ProjectPage from '../../support/pages/project-page';

describe('Data Model Class', () => {
  const projectPage = new ProjectPage();

  beforeEach(() => {
    projectPage.requestProject();
  });

  it('should create new data model class of a certain type', () => {
    const classType = CLASS_TYPES.textRepresentation;

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
    cy.get(`[data-cy=${classType.type}]`).scrollIntoView().should('be.visible').click({ force: true });

    cy.get('[data-cy=name-input]').clear().type(textClass.id);
    cy.get('[data-cy=label-input]').clear().type(textClass.label);
    cy.get('[data-cy=comment-textarea]').type(textClass.comment);
    cy.get('[data-cy=submit-button]').click();

    cy.wait('@createRequest');
    cy.get('[data-cy=class-card]')
      .should('be.visible')
      .within(() => {
        cy.get('mat-card-title').contains(textClass.label.split(' ')[0]);
      });
    // The within function is used to scope the search for mat-card-title within the visible class-card. This ensures that Cypress waits for mat-card-title to be available within the class-card.
    cy.get('[data-cy=create-class-button]').scrollIntoView().should('be.visible').click();
    cy.get(`[data-cy=Resource]`).scrollIntoView().should('be.visible').click({ force: true });
    cy.get('[data-cy=name-input]').clear().type(resourceClass.id);
    cy.get('[data-cy=label-input]').clear().type(resourceClass.label);
    cy.get('[data-cy=comment-textarea]').type(resourceClass.comment);
    cy.get('[data-cy=submit-button]').click();

    cy.wait('@createRequest');
    cy.get('[data-cy=class-card]')
      .should('be.visible')
      .get('mat-card-title')
      .contains(resourceClass.label.split(' ')[0]);
    cy.get('[data-cy=class-type-label]').should('be.visible').should('include.text', classType.label);
  });

  it('should create new class with object class constraints (e.g. page as part of a book)', () => {
    const bookType = CLASS_TYPES.objectWithoutRepresentation;
    const bookClass: ResourceClassDefinitionWithAllLanguages = {
      id: faker.lorem.word(),
      subClassOf: [],
      propertiesList: [],
      canBeInstantiated: true,
      label: `B${faker.lorem.words(5)}`,
      comment: faker.lorem.words(10),
      comments: [],
      labels: [],
    };

    const stillImageType = CLASS_TYPES.stillImageRepresentation;
    const stillImageClass: ResourceClassDefinitionWithAllLanguages = {
      id: faker.lorem.word(),
      subClassOf: [],
      propertiesList: [],
      canBeInstantiated: true,
      label: `A${faker.lorem.words(5)}`,
      comment: faker.lorem.words(10),
      comments: [],
      labels: [],
    };

    cy.intercept('POST', '/v2/ontologies/classes').as('createRequest');

    cy.createOntology(projectPage);
    // create a book
    cy.get('[data-cy=create-class-button]').scrollIntoView().should('be.visible').click();
    cy.get(`[data-cy=${bookType.type}]`).scrollIntoView().should('be.visible').click({ force: true });

    cy.get('[data-cy=name-input]').clear().type(bookClass.id);
    cy.get('[data-cy=label-input]').clear().type(bookClass.label);
    cy.get('[data-cy=comment-textarea]').type(bookClass.comment);
    cy.get('[data-cy=submit-button]').click();

    cy.wait('@createRequest');
    cy.get('[data-cy=class-card]')
      .should('be.visible')
      .within(() => {
        cy.get('mat-card-title').contains(bookClass.label.split(' ')[0]);
      });

    // create a still image class
    cy.get('[data-cy=create-class-button]').scrollIntoView().should('be.visible').click();
    cy.get(`[data-cy=${stillImageType.type}]`).scrollIntoView().should('be.visible').click({ force: true });
    cy.get('[data-cy=name-input]').clear().type(stillImageClass.id);
    cy.get('[data-cy=label-input]').clear().type(stillImageClass.label);
    cy.get('[data-cy=comment-textarea]').type(stillImageClass.comment);
    cy.get('[data-cy=submit-button]').click();

    cy.wait('@createRequest');
    cy.get('[data-cy=class-card]')
      .should('be.visible')
      .get('mat-card-title')
      .contains(stillImageClass.label.split(' ')[0]);
    cy.get('[data-cy=class-type-label]').should('be.visible').should('include.text', stillImageType.label);

    // link them
    const partOfProperty = <DataModelClassProperty>{
      name: faker.lorem.word(),
      label: `B${faker.lorem.words(5)}`,
      comment: faker.lorem.words(10),
    };

    const linkToClassProperty = <DataModelClassProperty>{
      name: faker.lorem.word(),
      label: `A${faker.lorem.words(5)}`,
      comment: faker.lorem.words(10),
    };

    cy.intercept('POST', '/v2/ontologies/properties').as('createPropertyRequest');
    cy.intercept('POST', '/v2/ontologies/cardinalities').as('addCardinalityRequest');
    // partOf property
    cy.get('[data-cy=class-card]').eq(0).should('be.visible');
    cy.get('[data-cy=add-property-button]').eq(0).should('be.visible').click();
    cy.get('[data-cy=create-new-from-type-button]').should('be.visible').click({ force: true });
    cy.get(`[data-cy=${PropertyType.LinkRelation}]`).should('be.visible').click();
    cy.get(`[data-cy=${PropertyType.PartOfClass}]`).should('be.visible').click();

    cy.get('[data-cy=name-input]').clear().type(partOfProperty.name);
    cy.get('[data-cy=label-input] input').clear().type(partOfProperty.label);
    cy.get('[data-cy=comment-textarea]').type(partOfProperty.comment);
    cy.get('[data-cy=object-attribute-link]').click(); // open dropdown

    cy.get('mat-option').contains(bookClass.label).scrollIntoView().should('be.visible').click();

    cy.get('[data-cy=submit-button]').click();

    cy.wait('@createPropertyRequest');
    cy.wait('@addCardinalityRequest');
    cy.get('[data-cy=property-object-label]').should('be.visible').should('include.text', bookClass.label);

    // linkToClass property
    cy.get('[data-cy=class-card]').eq(0).should('be.visible');
    cy.get('[data-cy=add-property-button]').eq(0).should('be.visible').click();
    cy.get('[data-cy=create-new-from-type-button]').should('be.visible').click({ force: true });
    cy.get(`[data-cy=${PropertyType.LinkRelation}]`).should('be.visible').click();
    cy.get(`[data-cy=${PropertyType.LinkToClass}]`).should('be.visible').click();

    cy.get('[data-cy=name-input]').clear().type(linkToClassProperty.name);
    cy.get('[data-cy=label-input] input').clear().type(linkToClassProperty.label);
    cy.get('[data-cy=comment-textarea]').type(linkToClassProperty.comment);
    cy.get('[data-cy=object-attribute-link]').click();
    cy.get('mat-option').contains(bookClass.label).scrollIntoView().should('be.visible').click();
    cy.get('[data-cy=submit-button]').click();

    cy.wait('@createPropertyRequest');
    cy.wait('@addCardinalityRequest');
    // there should be a second property with a link to the class
    cy.get('[data-cy=property-object-label]').eq(1).should('be.visible').should('include.text', bookClass.label);

    // go back to data models, lists and create a list
    cy.get('[data-cy=back-to-data-models]').should('be.visible').click();
    cy.get('[data-cy=create-list-button]').should('be.visible').click();

    const listLabel = faker.lorem.word();

    cy.get('[data-cy=create-list-button]').click({ force: true, multiple: false });
    cy.get('[data-cy=label-input]:visible').should('have.length', 1).type(listLabel);
    cy.get('[data-cy=comments-input]:visible').should('have.length', 1).type(faker.lorem.sentence());
    cy.get('[data-cy=submit-button]:visible').should('have.length', 1).click();
    projectPage.visitDataModels();
    cy.get('[data-cy=ontology-button]').should('be.visible').click();
    cy.intercept('POST', '/v2/ontologies/properties').as('createPropertyRequest');
    cy.intercept('POST', '/v2/ontologies/cardinalities').as('addCardinalityRequest');
    // partOf property
    cy.get('[data-cy=class-card]').eq(0).should('be.visible');
    cy.get('[data-cy=add-property-button]').eq(0).should('be.visible').click();
    cy.get('[data-cy=create-new-from-type-button]').should('be.visible').click({ force: true });
    cy.get(`[data-cy=${PropertyType.List}]`).should('be.visible').click();
    cy.get(`[data-cy=${PropertyType.Dropdown}]`).should('be.visible').click();

    cy.get('[data-cy=name-input]').clear().type(faker.lorem.word());
    cy.get('[data-cy=label-input] input').clear().type(faker.lorem.word(2));
    cy.get('[data-cy=comment-textarea]').type(faker.lorem.word(5));
    cy.get('[data-cy=object-attribute-list]').click(); // open dropdown

    cy.get('mat-option').contains(listLabel).scrollIntoView().should('be.visible').click();

    cy.get('[data-cy=submit-button]').click();

    cy.wait('@createPropertyRequest');
    cy.wait('@addCardinalityRequest');
    cy.get('[data-cy=property-object-label]').should('be.visible').should('include.text', bookClass.label);
  });

  it('should cancel to create data model class', () => {
    const classType = CLASS_TYPES.stillImageRepresentation;
    cy.createOntology(projectPage);

    cy.get('[data-cy=create-class-button]').scrollIntoView().should('be.visible').click();
    cy.get(`[data-cy=${classType.type}]`).scrollIntoView().should('be.visible').click({ force: true });
    cy.get('.mat-mdc-dialog-container').should('be.visible');
    cy.get('[data-cy=cancel-button]').scrollIntoView().should('be.visible').click();
    cy.get('.mat-mdc-dialog-container').should('not.exist');

    cy.get('[data-cy=create-class-button]').scrollIntoView().should('be.visible').click();
    cy.get(`[data-cy=${classType.type}]`).scrollIntoView().click({ force: true });
    cy.get('.mat-mdc-dialog-container').should('be.visible');
    cy.get('.cdk-overlay-backdrop-showing').click(-50, -50, { force: true });
    cy.get('.mat-mdc-dialog-container').should('not.exist');
  });

  it('should delete a data model class', () => {
    cy.createDataModelClass(projectPage);
    const classCard = cy.get('[data-cy=class-card] mat-card-header');
    classCard.should('be.visible');
    classCard.trigger('mouseenter').wait(100);
    cy.get('[data-cy=more-button]').should('be.visible').click();
    cy.get('[data-cy=delete-button]').click();
    cy.get('[data-cy=confirmation-button]').click();
    classCard.should('not.exist');
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
    cy.get('[data-cy=property-label]').should('be.visible').should('include.text', textProperty.label);
  });
});
