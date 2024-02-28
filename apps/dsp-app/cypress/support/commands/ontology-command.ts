import { CreateOntology, OntologyMetadata } from '@dasch-swiss/dsp-js';
import { faker } from '@faker-js/faker';
import { JsonConvert } from 'json2typescript';
import ProjectPage from '../pages/project-page';

Cypress.Commands.add(
  'createOntology',
  (
    projectPage: ProjectPage,
    ontology: CreateOntology = {
      name: faker.string.alpha({ length: { min: 3, max: 16 } }),
      attachedToProject: projectPage.projectIri,
      comment: faker.lorem.words(10),
      label: faker.lorem.words(5),
    }
  ) => {
    return cy
      .request<OntologyMetadata>(
        'POST',
        `${Cypress.env('apiUrl')}/v2/ontologies`,
        new JsonConvert().serializeObject(ontology, CreateOntology)
      )
      .then(response => {
        const ontologyMetadata = response.body;
        cy.log('Ontology created!');
        cy.visit(`/project/${projectPage.projectUuid}/ontology/${ontology.name}/editor/classes`);
        return cy.wrap({ ontology, ontologyMetadata }).as('ontology');
      });
  }
);
