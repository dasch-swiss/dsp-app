describe('Visual Check for Projects on Home Page', () => {
  it('should load clickable projects on the home page', () => {
    cy.visit('/');

    cy.get('[data-cy=navigate-to-project-button]')
      .should('be.visible')
      .should('have.length.greaterThan', 0)
      .eq(Math.floor(Math.random() * 5))
      .click();

    cy.url().should('include', '/project'); // Update with the expected URL
  });
});
