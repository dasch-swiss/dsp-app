describe('Data models page', () => {
  it('should be accessible but readonly', () => {
    cy.visit('/project/0803');
    cy.get('[data-cy=data-models-tab]').should('be.visible').click();
    // The tab opens on the first data model's classes.
    cy.url().should('include', '/project/0803/data-models/classes');

    cy.get('[data-cy=data-models-tree]')
      .should('be.visible')
      .within(() => {
        cy.get('[data-cy=data-models-tree-model]').first().should('be.visible');
        cy.get('[data-cy=data-models-tree-create-model]').should('not.exist');
        cy.get('[data-cy=data-models-tree-edit-model]').should('not.exist');
        cy.get('[data-cy=data-models-tree-delete-model]').should('not.exist');
        cy.get('[data-cy=data-models-tree-create-vocabulary]').should('not.exist');
      });

    cy.get('[data-cy=data-model-class-card]').first().should('be.visible');
    cy.get('[data-cy=data-model-classes-create]').should('not.exist');
    cy.get('[data-cy=class-panel-add-property]').should('not.exist');

    // The card's dots show only on hover, so the click is forced.
    cy.get('[data-cy=data-model-class-card]')
      .first()
      .find('[data-cy=data-model-class-card-menu]')
      .click({ force: true });
    cy.get('[data-cy=data-model-class-card-delete]').should('not.exist');
    cy.get('[data-cy=data-model-class-card-edit]').should('not.exist');
    cy.get('[data-cy=data-model-class-card-copy-id]').should('be.enabled');
    cy.get('[data-cy=data-model-class-card-open-instances]').should('be.enabled');
  });
});
