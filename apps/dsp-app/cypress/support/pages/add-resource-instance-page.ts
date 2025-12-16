export class AddResourceInstancePage {
  visitAddPage = () => {
    cy.visit('/project/00FF/data/images/datamodelclass');
    cy.get('[data-cy=create-resource-btn]').click();
  };

  getSubmitButton = () => cy.get('[data-cy=submit-button]');

  clickOnSubmit = (waitForSuccess: boolean = true) => {
    this.getSubmitButton().click({ force: true });
    if (waitForSuccess) {
      cy.wait(500);
    }
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
    cy.reload();
    cy.get('[data-cy=property-value]').should('be.visible');
  }

  delete() {
    this.mouseHover();
    cy.get('[data-cy=delete-button]').click();
    cy.get('[data-cy=confirm-button]').click();
    cy.reload();
  }

  addInitialLabel() {
    cy.get('[data-cy=label-input]').type('label');
  }
}
