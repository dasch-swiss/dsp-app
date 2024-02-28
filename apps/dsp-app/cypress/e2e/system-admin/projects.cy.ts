import { faker } from '@faker-js/faker';
import { customShortcode } from '../../support/helpers/custom-shortcode';
import { generateKeyword } from '../../support/helpers/custom-word';
import { randomNumber } from '../../support/helpers/random-number';
import ProjectPage from '../../support/pages/project-page';

describe('Projects', () => {
  const projectPage = new ProjectPage();

  beforeEach(() => {
    projectPage.requestProject();
  });

  it('admin can create a project', () => {
    const data = {
      shortcode: customShortcode(),
      shortname: faker.lorem.word(),
      longname: faker.company.name(),
      description: faker.lorem.sentence(),
      keywords: Array.from({ length: randomNumber(3, 6) }, () => generateKeyword(4)),
    };

    cy.intercept('POST', '/admin/projects').as('submitRequest');

    cy.visit('/project/create-new');
    cy.get('[data-cy=shortcode-input]').type(data.shortcode);
    cy.get('[data-cy=shortname-input]').type(data.shortname);
    cy.get('[data-cy=longname-input]').type(data.longname);
    cy.get('[data-cy=description-input]').type(data.description);
    cy.get('[data-cy=keywords-input]').type(`${data.keywords.join('{enter}')}{enter}`);
    cy.get('[data-cy=submit-button]').click();

    cy.wait('@submitRequest');
    cy.url().should('match', /\/project\/(.+)/);
    cy.contains(data.shortcode).should('be.visible');
    cy.contains(data.description).should('be.visible');
    data.keywords.forEach(keyword => cy.contains(keyword).should('be.visible'));
  });

  it('admin can edit a project', () => {
    const data = {
      longname: faker.company.name(),
      description: faker.lorem.sentence(),
      keywords: faker.lorem.words(3).split(' '),
    };
    cy.intercept('PUT', '/admin/projects/iri/*').as('submitRequest');

    cy.visit(`/project/${projectPage.projectIri.match(/\/([^\/]+)$/)[1]}/settings/edit`);
    cy.get('[data-cy=shortcode-input] input').should('have.value', projectPage.project.shortcode);
    cy.get('[data-cy=shortname-input] input').should('have.value', projectPage.project.shortname);
    cy.get('[data-cy=longname-input] input')
      .should('have.value', projectPage.project.longname)
      .clear()
      .type(data.longname);
    cy.get('[data-cy=description-input] textarea')
      .should('have.value', projectPage.project.description[0].value)
      .clear()
      .type(data.description);
    cy.get('[data-cy=keywords-input] input')
      .type('{backspace}'.repeat(5))
      .type(`${data.keywords.join('{enter}')}{enter}`);
    cy.get('[data-cy=submit-button]').click();

    cy.wait('@submitRequest');
    cy.url().should('match', /\/project\/(.+)/);
    cy.contains(projectPage.project.shortcode).should('be.visible');
    cy.contains(data.description).should('be.visible');
    data.keywords.forEach(keyword => cy.contains(keyword).should('be.visible'));
  });

  it('admin can deactivate a project', () => {
    cy.intercept('DELETE', `/admin/projects/iri/${encodeURIComponent(projectPage.projectIri)}`).as('deactivateRequest');

    cy.visit('/system/projects');
    cy.get('[data-cy=active-projects-section]')
      .contains('[data-cy=project-row]', projectPage.project.shortcode)
      .find('[data-cy=more-button]')
      .scrollIntoView()
      .should('be.visible')
      .click();
    cy.get('[data-cy=deactivate-button]').scrollIntoView().click({ force: true });
    cy.get('[data-cy=confirmation-button]').click();
    cy.wait('@deactivateRequest');

    cy.get('[data-cy=inactive-projects-section]')
      .contains('[data-cy=project-row]', projectPage.project.shortcode)
      .should('exist');
  });

  it('admin can reactivate a project', () => {
    cy.intercept('PUT', `/admin/projects/iri/${encodeURIComponent(projectPage.projectIri)}`).as('updateRequest');

    cy.request(
      'DELETE',
      `${Cypress.env('apiUrl')}/admin/projects/iri/${encodeURIComponent(projectPage.projectIri)}`
    ).then(() => {
      cy.visit('/system/projects');
      cy.get('[data-cy=inactive-projects-section]')
        .contains('[data-cy=project-row]', projectPage.project.shortcode)
        .find('[data-cy=more-button]')
        .scrollIntoView()
        .should('be.visible')
        .click();
      cy.get('[data-cy=reactivate-button]').scrollIntoView().click({ force: true });
      cy.get('[data-cy=confirmation-button]').click();
      cy.wait('@updateRequest');

      cy.get('[data-cy=active-projects-section]')
        .contains('[data-cy=project-row]', projectPage.project.shortcode)
        .should('exist');
    });
  });
});
