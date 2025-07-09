describe('Data models page', () => {
  it('should be accessible but readonly', () => {
    cy.visit('/project/0803/data-models');
    cy.get('[data-cy=data-models-container]')
      .should('be.visible')
      .within(() => {
        cy.get('[data-cy=create-button]').should('not.exist');
        cy.get('[data-cy=edit-button]').should('not.exist');
      });
    cy.get('[data-cy=ontology-button]').first().scrollIntoView().should('be.visible').click();
    cy.url().should('include', '/project/0803/ontology/incunabula/editor/classes');

    cy.get('[data-cy=add-property-button]').should('not.exist');
    cy.get('[data-cy=create-class-button]').should('be.disabled');
    cy.get('[data-cy=create-property-button]').should('be.disabled');

    const classCard = cy.get('[data-cy=class-card] mat-card-header').first();
    classCard.should('be.visible');
    classCard.trigger('mouseenter').wait(100);
    cy.get('[data-cy=more-button]').should('be.visible').click();
    cy.get('[data-cy=delete-button]').should('not.exist');
    cy.get('[data-cy=edit-button]').should('not.exist');
    cy.get('[data-cy=copy-id-button]').should('be.enabled');
    cy.get('[data-cy=open-in-databrowser-button]').should('be.enabled');
  });
});
