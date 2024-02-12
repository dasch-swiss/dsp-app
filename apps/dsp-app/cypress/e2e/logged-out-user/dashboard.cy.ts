describe('Visual Check for Projects on Home Page', () => {
  it('should load clickable projects on the home page', () => {
    cy.visit('/');

    cy.get('[data-cy=tile]')
      .should('be.visible')
      .should('have.length.greaterThan', 0)
      .first()
      .find('[data-cy=navigate-to-project-button]')
      .click();

    cy.url().should('include', '/project'); // Update with the expected URL
  });
});
