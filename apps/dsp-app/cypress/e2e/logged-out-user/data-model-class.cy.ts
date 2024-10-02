describe('Data model class page', () => {
  it('should not be accessible and return to dashboard', () => {
    cy.visit('/project/0803/ontology/incunabula/editor/classes');
    cy.url().should('contain', '/?returnLink=');
  });
});
