describe('Resource page', () => {
  it('should not be accessible and return to page', () => {
    cy.visit('/project/0803/ontology/incunabula/book/add');
    const regex = new RegExp('/project/0803$');
    cy.url().should('match', regex);
  });
});
