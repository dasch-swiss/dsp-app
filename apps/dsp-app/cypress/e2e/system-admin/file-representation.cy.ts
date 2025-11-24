import { Project00FFPayloads } from '../../fixtures/project00FF-resource-payloads';
import { ResponseUtil } from '../../fixtures/requests';
import { AddResourceInstancePage } from '../../support/pages/add-resource-instance-page';

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('ACCESS_TOKEN')}`,
});

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

    cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/v2/ontologies/classes`,
      headers: getAuthHeaders(),
      body: classPayload,
    })
      .then(response => {
        lastModDate = ResponseUtil.lastModificationDate(response);
      })
      .then(() => {
        po.visitAddPage();
        cy.get('[data-cy=image-source-selector]').should('be.visible');

        cy.get('[data-cy=image-source-selector]').find('mat-chip-option').eq(1).click();

        // create
        po.addInitialLabel();
        cy.get('[data-cy=external-iiif-input]').type(invalidIifImageUrl);

        // try to submit with invalid url
        po.clickOnSubmit();

        cy.intercept('HEAD', '**/default.jpg', {
          statusCode: 200,
        }).as('fetchPreviewImage');

        cy.get('[data-cy=external-iiif-input]').clear().type(encodedValidIifImageUrl);

        cy.wait('@fetchPreviewImage');

        cy.get('img[alt="IIIF Preview"]').should('have.attr', 'src', encodedValidIifImageUrl).and('be.visible');
      });
  });
});
