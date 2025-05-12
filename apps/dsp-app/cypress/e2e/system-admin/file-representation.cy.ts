import { Project00FFPayloads } from '../../fixtures/project00FF-resource-payloads';
import { ResponseUtil } from '../../fixtures/requests';
import { AddResourceInstancePage } from '../../support/pages/add-resource-instance-page';

describe('File representation', () => {
  let lastModDate: string;
  let po: AddResourceInstancePage;
  const projectPayloads = new Project00FFPayloads();

  beforeEach(() => {
    po = new AddResourceInstancePage();
  });

  it('external iiif image', () => {
    const classPayload = projectPayloads.stillImageRepresentation('datamodelclass');
    const invalidIifImageUrl = 'https://example.com/wrong.jpg';
    const validIifImageUrl = 'https://ids.lib.harvard.edu/ids/iiif/24209711/full/105,/0/default.jpg';
    const encodedValidIifImageUrl =
      'https://iiif.wellcomecollection.org/image/b20432033_B0008608.JP2/full/880%2C/0/default.jpg';

    cy.request('POST', `${Cypress.env('apiUrl')}/v2/ontologies/classes`, classPayload)
      .then(response => {
        lastModDate = ResponseUtil.lastModificationDate(response);
      })
      .then(() => {
        po.visitAddPage();
        cy.get('[data-cy=upload-control]').should('be.visible');

        cy.get('[data-cy=external-image-chip]').click();

        // create
        po.addInitialLabel();
        cy.get('[data-cy=external-iiif-input]').type(invalidIifImageUrl);

        // try to submit with invalid url
        po.clickOnSubmit();
        cy.get('mat-error').should('contain.text', 'The provided URL is not a valid IIIF image URL');

        cy.intercept('HEAD', '**/default.jpg', {
          statusCode: 200,
        }).as('fetchPreviewImage');

        cy.get('[data-cy=external-iiif-input]').clear().type(encodedValidIifImageUrl);

        cy.wait('@fetchPreviewImage');

        cy.get('img[alt="IIIF Preview"]').should('have.attr', 'src', encodedValidIifImageUrl).and('be.visible');
      });
  });
});
