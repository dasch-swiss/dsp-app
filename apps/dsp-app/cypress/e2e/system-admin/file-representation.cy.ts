import { Project00FFPayloads } from '../../fixtures/project00FF-resource-payloads';
import { AddResourceInstancePage } from '../../support/pages/add-resource-instance-page';

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('ACCESS_TOKEN')}`,
});

const getOntologyLmd = (): Cypress.Chainable<string> => {
  const ontologyIri = encodeURIComponent(`${Cypress.env('apiUrl')}/ontology/00FF/images/v2`);
  return cy
    .request({
      method: 'GET',
      url: `${Cypress.env('apiUrl')}/v2/ontologies/allentities/${ontologyIri}`,
      headers: getAuthHeaders(),
    })
    .then(response => response.body['knora-api:lastModificationDate']['@value']);
};

describe('File representation', () => {
  let po: AddResourceInstancePage;
  const projectPayloads = new Project00FFPayloads();

  beforeEach(() => {
    po = new AddResourceInstancePage();
  });

  it('svg file upload is accepted', () => {
    getOntologyLmd().then(lmd => {
      cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/v2/ontologies/classes`,
        headers: getAuthHeaders(),
        body: projectPayloads.stillImageRepresentation('svgclass', lmd),
      }).then(() => {
        cy.visit('/project/00FF/data/images/svgclass');
        cy.get('[data-cy=create-resource-btn]').click();

        po.addInitialLabel();

        cy.intercept('POST', '**/assets/ingest/**').as('ingestUpload');
        cy.get('[data-cy=upload-file]').selectFile('cypress/fixtures/test.svg', { force: true });
        cy.wait('@ingestUpload').its('response.statusCode').should('eq', 200);
      });
    });
  });

  it('external iiif image', () => {
    const invalidIifImageUrl = 'https://example.com/wrong.jpg';
    const encodedValidIifImageUrl =
      'https://iiif.wellcomecollection.org/image/b20432033_B0008608.JP2/full/880%2C/0/default.jpg';

    getOntologyLmd().then(lmd => {
      cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/v2/ontologies/classes`,
        headers: getAuthHeaders(),
        body: projectPayloads.stillImageRepresentation('datamodelclass', lmd),
      }).then(() => {
        po.visitAddPage();
        cy.get('[data-cy=image-source-selector]').should('be.visible');
        cy.get('[data-cy=image-source-selector]').find('mat-chip-option').eq(1).click();

        po.addInitialLabel();
        cy.get('[data-cy=external-iiif-input]').type(invalidIifImageUrl);
        po.clickOnSubmit();

        cy.intercept('HEAD', '**/default.jpg', { statusCode: 200 }).as('fetchPreviewImage');
        cy.get('[data-cy=external-iiif-input]').clear().type(encodedValidIifImageUrl);
        cy.wait('@fetchPreviewImage');

        cy.get('img[alt="IIIF Preview"]').should('have.attr', 'src', encodedValidIifImageUrl).and('be.visible');
      });
    });
  });
});
