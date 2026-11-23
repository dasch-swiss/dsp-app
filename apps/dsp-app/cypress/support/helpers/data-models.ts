/** Helpers for the Data models tab (`/project/:p/data-models`). */

/** The data model's line in the tab's rail, by its label. */
export const railModel = (label: string) => cy.contains('[data-cy=data-models-tree-model]', label);

/** A class's card in the Classes section, by the class's name (the end of its IRI). */
export const classCard = (name: string) => cy.get(`[data-cy=data-model-class-card][data-iri$="#${name}"]`);

/** Opens the "Create class" menu and picks the kind, by its menu label. */
export const openCreateClassDialog = (kindLabel: string) => {
  cy.get('[data-cy=data-model-classes-create]').should('be.visible').click();
  cy.get(`[data-cy="data-model-classes-create-${kindLabel}"]`).should('be.visible').click();
};

/**
 * Opens the class menu of a card; its dots show only while the card's header is hovered, which Cypress cannot do, so
 * the click is forced.
 */
export const openClassMenu = (name: string) => {
  classCard(name).find('[data-cy=data-model-class-card-menu]').click({ force: true });
};

/** Opens a card's "Add property › Create new from type › <group> › <type>", which opens the property dialog. */
export const addNewPropertyFromType = (className: string, group: string, type: string) => {
  classCard(className).find('[data-cy=class-panel-add-property]').scrollIntoView().should('be.visible').click();
  cy.get('[data-cy=class-panel-add-new-property]').should('be.visible').click();
  // Each submenu opens as the last overlay panel.
  cy.get('.mat-mdc-menu-panel').last().contains('button', group).should('be.visible').click();
  cy.get('.mat-mdc-menu-panel').last().contains('button', type).should('be.visible').click();
};
