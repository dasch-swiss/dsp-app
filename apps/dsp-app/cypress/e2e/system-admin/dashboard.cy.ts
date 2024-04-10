describe('Dashboard', () => {
  it('should load clickable projects on the home page', () => {
    cy.visit('/');
    const projectTileSelector = '[data-cy=navigate-to-project-button]';

    cy.get(projectTileSelector).should('be.visible').should('have.length.greaterThan', 0);

    cy.get(projectTileSelector)
      .eq(Math.floor(Math.random() * 5))
      .click();

    cy.url().should('include', '/project'); // Update with the expected URL
  });
});
