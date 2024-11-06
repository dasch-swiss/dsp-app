import StillImagePage from '../../support/pages/still-image.page';

function assessToolbarVisibility(buttons: Cypress.Chainable<JQuery<HTMLElement>>[]) {
  cy.log('Assess toolbar visibility');
  buttons.forEach(button => button.should('be.visible'));

  cy.get('[data-cy="still-image-settings-button"]').should('be.visible');
  cy.get('[data-cy="zoom-out"]').should('be.visible');
  cy.get('[data-cy="zoom-in"]').should('be.visible');
  cy.get('[data-cy="still-image-download-button"]').should('be.visible');
  cy.get('[data-cy="still-image-region-button"]').should('be.visible');
  cy.get('[data-cy="zoom-reset"]').should('be.visible');
  cy.get('[data-cy="fullscreen"]').should('be.visible');
}

function clickOutsideMenu() {
  cy.get('body').click(0, 0);
}

describe('Still image', () => {
  const color = { hex: '#65ff33', rgb: 'rgb(101, 255, 51)' };
  it.skip('can see the image with the reader, the toolbar is visible, display a region and click', () => {
    const page = new StillImagePage();
    page.init();

    const shareButton = cy.get('[data-cy="still-image-share-button"]');
    const moreButton = cy.get('[data-cy="more-vert-image-button"]');
    assessToolbarVisibility([shareButton, moreButton]);

    const region = cy.get('[data-cy="annotation-rectangle"]');
    region.should('have.css', 'outline-color', color.rgb);
    region.click();
    cy.get('[data-cy="property-header"]').should('contain', page.label);
    cy.get('[data-cy="annotation-border"]').first().should('have.css', 'border-width', '1px');

    cy.log('Click on the more button');
    moreButton.click();
    cy.get('[data-cy="open-iiif-new-tab"]')
      .should('be.visible')
      .should('have.attr', 'href')
      .and('match', /http:\/\/0\.0\.0\.0:1024\/0803\/.*\/full\/2002,1104\/0\/default\.jpg/);
    clickOutsideMenu();

    cy.log('Click on the share button');
  });
});
