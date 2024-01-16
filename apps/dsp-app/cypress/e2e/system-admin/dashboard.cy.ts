const MY_TOKEN = '';
localStorage.setItem('ACCESS_TOKEN', MY_TOKEN);

describe('ADMIN TEST', () => {
  it('should load clickable projects on the home page', () => {
    cy.visit('/');
    const projectTileSelector = '[data-cy=tile]';

    cy.get(projectTileSelector).should('be.visible').should('have.length.greaterThan', 0);

    cy.get(projectTileSelector).first().find('[data-cy=navigate-to-project-button]').click();

    cy.url().should('include', '/project'); // Update with the expected URL
  });
});
