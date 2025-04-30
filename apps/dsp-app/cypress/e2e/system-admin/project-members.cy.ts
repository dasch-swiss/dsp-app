import { Project0001Page } from '../../support/pages/existing-ontology-class-page';

describe('Project members', () => {
  let project0001Page: Project0001Page;

  before(() => {
    cy.resetDatabase();
    project0001Page = new Project0001Page();
  });

  it('admin can remove user from a project', () => {
    cy.intercept('DELETE', '/admin/users/**').as('deleteRequest');
    cy.intercept('GET', '**/members').as('membersRequest');
    cy.visit(`/project/${Project0001Page.projectShortCode}/settings/collaboration`);
    let memberCount = 0;
    cy.get('[data-cy=member-count]')
      .should('be.visible')
      .invoke('text')
      .then(text => {
        memberCount = parseInt(text.match(/\d+/)?.[0]);
        expect(memberCount).to.be.greaterThan(0);
      });

    cy.get('[data-cy=user-menu]').eq(2).click();
    cy.get('[data-cy=remove-member-button]').should('be.visible').click();
    cy.get('[data-cy=confirmation-button]').should('be.visible').click();
    cy.wait('@deleteRequest').its('response.statusCode').should('eq', 200);
    cy.wait('@membersRequest').its('response.statusCode').should('eq', 200);
  });
});
