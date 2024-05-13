export class AddResourceInstancePage {
  visitAddPage = () => {
    cy.visit('/project/00FF/ontology/images/datamodelclass/add');
  };

  getSubmitButton = () => cy.get('[data-cy=submit-button]');

  clickOnSubmit = () => {
    this.getSubmitButton().click({ force: true });
  };

  mouseHover = () => {
    cy.get('[data-cy=property-value]').trigger('mouseenter');
  };
  setupEdit = () => {
    this.mouseHover();
    cy.get('[data-cy=edit-button]').click({ force: true });
  };

  saveEdit() {
    cy.get('[data-cy=save-button]').click({ force: true });
    cy.reload(); // TODO shouldnt reload
  }

  delete() {
    cy.reload(); // TODO shouldnt reload
    this.mouseHover();
    cy.get('[data-cy=delete-button]').click();
    cy.get('[data-cy=confirm-button]').click();
    cy.reload(); // TODO shouldnt reload
    cy.contains('This resource has no defined properties');
  }

  addInitialLabel() {
    cy.get('[data-cy=label-input]').type('label');
  }
}
