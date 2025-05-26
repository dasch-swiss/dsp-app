describe('Project overview (landing page)', () => {
  it('should load clickable projects on the landing page', () => {
    cy.visit('/');
    const projectTileSelector = '[data-cy=project-card] a';

    cy.get(projectTileSelector)
      .should('be.visible')
      .should('have.length.greaterThan', 0)
      .eq(Math.floor(Math.random() * 5))
      .click();

    cy.url().should('include', '/project');
  });
});
