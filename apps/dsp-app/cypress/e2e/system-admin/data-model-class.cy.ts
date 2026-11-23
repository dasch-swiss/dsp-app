import { ResourceClassDefinitionWithAllLanguages } from '../../../../../libs/dsp-js/src';
import { faker } from '@faker-js/faker';
import { DataModelClassProperty } from '../../models/data-model-class';
import { CLASS_TYPES, PropertyType } from '../../support/helpers/constants';
import {
  addNewPropertyFromType,
  classCard,
  openClassMenu,
  openCreateClassDialog,
} from '../../support/helpers/data-models';
import { uniqueName } from '../../support/helpers/unique-name';
import ProjectPage from '../../support/pages/project-page';

/** A property's row on a class's card, by the property's label. */
const propertyRow = (className: string, label: string) =>
  classCard(className).contains('[data-cy=data-model-class-card-property]', label);

describe('Data Model Class', () => {
  const projectPage = new ProjectPage();

  beforeEach(() => {
    cy.resetDatabase();
  });

  beforeEach(() => {
    projectPage.requestProject();
  });

  it('should create new data model class of a certain type', () => {
    const classType = CLASS_TYPES.textRepresentation;

    const textClass: ResourceClassDefinitionWithAllLanguages = {
      id: uniqueName(),
      subClassOf: [],
      propertiesList: [],
      canBeInstantiated: true,
      label: 'testClassLabel01',
      comment: faker.lorem.words(10),
      comments: [],
      labels: [],
    };

    const resourceClass: ResourceClassDefinitionWithAllLanguages = {
      id: uniqueName(),
      subClassOf: [],
      propertiesList: [],
      canBeInstantiated: true,
      label: 'testClassLabel02',
      comment: faker.lorem.words(10),
      comments: [],
      labels: [],
    };

    cy.intercept('POST', '/v2/ontologies/classes').as('createRequest');

    cy.createOntology(projectPage);

    openCreateClassDialog(classType.label);

    cy.get('[data-cy=name-input]').clear().type(textClass.id);
    cy.get('[data-cy=label-input]').clear().type(textClass.label);
    cy.get('[data-cy=comment-textarea]').type(textClass.comment);
    cy.get('[data-cy=submit-button]').click();

    cy.wait('@createRequest');
    classCard(textClass.id).should('be.visible').should('contain.text', textClass.label);

    openCreateClassDialog(CLASS_TYPES.objectWithoutRepresentation.label);
    cy.get('[data-cy=name-input]').clear().type(resourceClass.id);
    cy.get('[data-cy=label-input]').clear().type(resourceClass.label);
    cy.get('[data-cy=comment-textarea]').type(resourceClass.comment);
    cy.get('[data-cy=submit-button]').click();

    cy.wait('@createRequest');
    classCard(resourceClass.id).should('be.visible').should('contain.text', resourceClass.label);
    classCard(textClass.id)
      .find('[data-cy=data-model-class-card-file] mat-icon')
      .should('be.visible')
      .should('contain.text', classType.fileIcon);
  });

  it('should create new class with object class constraints (e.g. page as part of a book)', () => {
    const bookType = CLASS_TYPES.objectWithoutRepresentation;
    const bookClass: ResourceClassDefinitionWithAllLanguages = {
      id: uniqueName(),
      subClassOf: [],
      propertiesList: [],
      canBeInstantiated: true,
      label: `BookClass`,
      comment: faker.lorem.words(10),
      comments: [],
      labels: [],
    };

    const stillImageType = CLASS_TYPES.stillImageRepresentation;
    const stillImageClass: ResourceClassDefinitionWithAllLanguages = {
      id: uniqueName(),
      subClassOf: [],
      propertiesList: [],
      canBeInstantiated: true,
      label: `AStillImageClass`,
      comment: faker.lorem.words(10),
      comments: [],
      labels: [],
    };

    cy.intercept('POST', '/v2/ontologies/classes').as('createRequest');

    cy.createOntology(projectPage);
    // create a book
    openCreateClassDialog(bookType.label);

    cy.get('[data-cy=name-input]').clear().type(bookClass.id);
    cy.get('[data-cy=label-input]').clear().type(bookClass.label);
    cy.get('[data-cy=comment-textarea]').type(bookClass.comment);
    cy.get('[data-cy=submit-button]').click();

    cy.wait('@createRequest');
    classCard(bookClass.id).should('be.visible').should('contain.text', bookClass.label);

    // create a still image class
    openCreateClassDialog(stillImageType.label);
    cy.get('[data-cy=name-input]').clear().type(stillImageClass.id);
    cy.get('[data-cy=label-input]').clear().type(stillImageClass.label);
    cy.get('[data-cy=comment-textarea]').type(stillImageClass.comment);
    cy.get('[data-cy=submit-button]').click();

    cy.wait('@createRequest');
    classCard(stillImageClass.id).should('be.visible').should('contain.text', stillImageClass.label);
    classCard(stillImageClass.id)
      .find('[data-cy=data-model-class-card-file] mat-icon')
      .should('be.visible')
      .should('contain.text', stillImageType.fileIcon);

    // link them
    const partOfProperty = <DataModelClassProperty>{
      name: uniqueName(),
      label: `B${faker.lorem.words(5)}`,
      comment: faker.lorem.words(10),
    };

    const linkToClassProperty = <DataModelClassProperty>{
      name: uniqueName(),
      label: `A${faker.lorem.words(5)}`,
      comment: faker.lorem.words(10),
    };

    cy.intercept('POST', '/v2/ontologies/properties').as('createPropertyRequest');
    cy.intercept('POST', '/v2/ontologies/cardinalities').as('addCardinalityRequest');
    // partOf property
    addNewPropertyFromType(stillImageClass.id, PropertyType.LinkRelation, PropertyType.PartOfClass);

    cy.get('[data-cy=name-input]').clear().type(partOfProperty.name);
    cy.get('[data-cy=label-input] input').clear().type(partOfProperty.label);
    cy.get('[data-cy=comment-textarea]').type(partOfProperty.comment);
    cy.get('[data-cy=object-attribute-link]').click(); // open dropdown

    cy.get('mat-option').contains(bookClass.label).scrollIntoView().should('be.visible').click();

    cy.get('[data-cy=submit-button]').click();

    cy.wait('@createPropertyRequest');
    cy.wait('@addCardinalityRequest');
    propertyRow(stillImageClass.id, partOfProperty.label)
      .find('[data-cy=data-model-class-card-target]')
      .should('be.visible')
      .should('include.text', bookClass.label);

    // linkToClass property
    addNewPropertyFromType(stillImageClass.id, PropertyType.LinkRelation, PropertyType.LinkToClass);

    cy.get('[data-cy=name-input]').clear().type(linkToClassProperty.name);
    cy.get('[data-cy=label-input] input').clear().type(linkToClassProperty.label);
    cy.get('[data-cy=comment-textarea]').type(linkToClassProperty.comment);
    cy.get('[data-cy=object-attribute-link]').click();
    cy.get('mat-option').contains(bookClass.label).scrollIntoView().should('be.visible').click();
    cy.get('[data-cy=submit-button]').click();

    cy.wait('@createPropertyRequest');
    cy.wait('@addCardinalityRequest');
    // there should be a second property with a link to the class
    propertyRow(stillImageClass.id, linkToClassProperty.label)
      .find('[data-cy=data-model-class-card-target]')
      .should('be.visible')
      .should('include.text', bookClass.label);

    // create a list from the rail
    const listLabel = uniqueName();

    cy.get('[data-cy=data-models-tree-create-vocabulary]').should('be.visible').click();
    cy.get('[data-cy=label-input]:visible').should('have.length', 1).type(listLabel);
    cy.get('[data-cy=comments-input]:visible').should('have.length', 1).type(faker.lorem.sentence());
    cy.get('[data-cy=submit-button]:visible').should('have.length', 1).click();
    cy.url().should('match', /\/data-models\/list\/(.+)/);

    // back to the data model's classes, to add a list property
    cy.get('@ontology').then((created: any) => projectPage.visitDataModels('classes', created.ontology.name));
    const listProperty = <DataModelClassProperty>{
      name: uniqueName(),
      label: `C${faker.lorem.words(2)}`,
      comment: faker.lorem.word({ length: 5 }),
    };
    cy.intercept('POST', '/v2/ontologies/properties').as('createPropertyRequest');
    cy.intercept('POST', '/v2/ontologies/cardinalities').as('addCardinalityRequest');
    addNewPropertyFromType(stillImageClass.id, PropertyType.List, PropertyType.Dropdown);

    cy.get('[data-cy=name-input]').clear().type(listProperty.name);
    cy.get('[data-cy=label-input] input').clear().type(listProperty.label);
    cy.get('[data-cy=comment-textarea]').type(listProperty.comment);
    cy.get('[data-cy=object-attribute-list]').click(); // open dropdown

    cy.get('mat-option').contains(listLabel).scrollIntoView().should('be.visible').click();

    cy.get('[data-cy=submit-button]').click();

    cy.wait('@createPropertyRequest');
    cy.wait('@addCardinalityRequest');
    propertyRow(stillImageClass.id, listProperty.label).should('be.visible');
  });

  it('should cancel to create data model class', () => {
    const classType = CLASS_TYPES.stillImageRepresentation;
    cy.createOntology(projectPage);

    openCreateClassDialog(classType.label);
    cy.get('.mat-mdc-dialog-container').should('be.visible');
    cy.get('[data-cy=cancel-button]').scrollIntoView().should('be.visible').click();
    cy.get('.mat-mdc-dialog-container').should('not.exist');

    openCreateClassDialog(classType.label);
    cy.get('.mat-mdc-dialog-container').should('be.visible');
    // The dialog's backdrop is the last one; the create menu's may still be fading out.
    cy.get('.cdk-overlay-backdrop-showing').last().click(-50, -50, { force: true });
    cy.get('.mat-mdc-dialog-container').should('not.exist');
    cy.get('[data-cy=data-model-class-card]').should('not.exist');
  });

  it('should delete a data model class', () => {
    cy.intercept('GET', '/v2/ontologies/candeleteclass/*').as('canDeleteClassRequest');
    cy.createDataModelClass(projectPage).then(resourceClass => {
      openClassMenu(resourceClass.name);
      // the delete item stays disabled until /candeleteclass answers
      cy.wait('@canDeleteClassRequest');
      cy.get('[data-cy=data-model-class-card-delete]').should('not.be.disabled').click();
      cy.get('[data-cy=confirmation-button]').click();
      classCard(resourceClass.name).should('not.exist');
    });
  });

  it('should add property to a data model class', () => {
    const textProperty = <DataModelClassProperty>{
      name: uniqueName(),
      label: faker.lorem.words(5),
      comment: faker.lorem.words(10),
    };

    cy.intercept('POST', '/v2/ontologies/properties').as('createPropertyRequest');
    cy.createDataModelClass(projectPage).then(resourceClass => {
      addNewPropertyFromType(resourceClass.name, PropertyType.Text, PropertyType.Short);

      cy.get('[data-cy=name-input]').clear().type(textProperty.name);
      cy.get('[data-cy=label-input] input').clear().type(textProperty.label);
      cy.get('[data-cy=comment-textarea]').type(textProperty.comment);
      cy.get('[data-cy=submit-button]').click();

      cy.wait('@createPropertyRequest');
      propertyRow(resourceClass.name, textProperty.label).should('be.visible');
    });
  });
});
