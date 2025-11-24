import { CreateOntology, OntologyMetadata } from '@dasch-swiss/dsp-js';
import { faker } from '@faker-js/faker';
import { JsonConvert } from 'json2typescript';
import ProjectPage from '../pages/project-page';

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('ACCESS_TOKEN')}`,
});

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
      .request<OntologyMetadata>({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/v2/ontologies`,
        headers: getAuthHeaders(),
        body: new JsonConvert().serializeObject(ontology, CreateOntology),
      })
      .then(response => {
        const ontologyMetadata = response.body;
        cy.log('Ontology created!');
        cy.visit(`/project/${projectPage.projectUuid}/ontology/${ontology.name}/editor/classes`);
        return cy.wrap({ ontology, ontologyMetadata }).as('ontology');
      });
  }
);
