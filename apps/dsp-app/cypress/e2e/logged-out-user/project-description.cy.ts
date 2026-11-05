describe('Project description', () => {
  it('opens the full description with its keywords from the Data tab', () => {
    cy.visit('/project/0001/data');
    cy.get('[data-cy=accept-cookies]').click();

    cy.get('[data-cy=project-read-more]').should('be.visible').click();

    cy.get('mat-dialog-container')
      .should('be.visible')
      .within(() => {
        cy.contains('h2', 'Anything Project');
        cy.get('mat-chip').should('have.length', 2);
      });
  });
});
