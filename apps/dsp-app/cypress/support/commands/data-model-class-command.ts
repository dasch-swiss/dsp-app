import { faker } from '@faker-js/faker';
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
    // cy.createOntology(projectPage).then(ontology => {
    //   resourceClass.id = ontology.ontologyMetadata['@id'];
    //   const request = new JsonConvert().serializeObject(resourceClass, CreateResourceClassPayload);
    //   cy.request<ResourceClassDefinitionWithAllLanguages>(
    //     'POST',
    //     `${Cypress.env('apiUrl')}/v2/ontologies/classes`,
    //     request
    //   ).then(response => {
    //     cy.log('Data model class created!');
    //   });
    // });

    cy.intercept('POST', '/v2/ontologies/classes').as('createClassRequest');

    return cy.createOntology(projectPage).then(() => {
      cy.wait(3000); // TODO remove
      cy.get('[data-cy=create-class-button]').scrollIntoView().should('be.visible').click();
      cy.get('[data-cy=TextRepresentation]').scrollIntoView().should('be.visible').click();
      cy.get('[data-cy=comment-textarea]').should('be.visible').clear().type(resourceClass.comment[0].value);
      cy.get('[data-cy=name-input]').clear().type(resourceClass.name);
      cy.get('[data-cy=label-input]').clear().type(resourceClass.label[0].value);
      cy.get('[data-cy=submit-button]').should('be.visible').click();

      cy.wait('@createClassRequest');
      cy.log('Data model class created!');

      return cy.wrap(resourceClass).as('dataModelClass');
    });
  }
);
