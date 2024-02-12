import { faker } from '@faker-js/faker';
import { ProjectOperationResponseADM } from '../../../../../libs/vre/open-api/src';
import { customShortcode } from '../../support/helpers/custom-shortcode';
import { generateKeyword } from '../../support/helpers/custom-word';
import { randomNumber } from '../../support/helpers/random-number';

describe('Projects', () => {
  let projectIri: string;

  const payload = {
    shortname: 'shortname',
    shortcode: 'A0A0',
    longname: 'Longname',
    description: [{ language: 'de', value: 'description' }],
    keywords: ['keyword'],
    status: true,
    selfjoin: true,
  };

  beforeEach(() => {
    cy.request<ProjectOperationResponseADM>('POST', `${Cypress.env('apiUrl')}/admin/projects`, payload).then(
      response => {
        projectIri = response.body.project.id;
      }
    );
  });

  it('admin can create a project', () => {
    const data = {
      shortcode: customShortcode(),
      shortname: faker.internet.userName(),
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

    cy.visit(`/project/${projectIri.match(/\/([^\/]+)$/)[1]}/settings/edit`);
    cy.get('[data-cy=shortcode-input] input').should('have.value', payload.shortcode);
    cy.get('[data-cy=shortname-input] input').should('have.value', payload.shortname);
    cy.get('[data-cy=longname-input] input').should('have.value', payload.longname).clear().type(data.longname);
    cy.get('[data-cy=description-input] textarea')
      .should('have.value', payload.description[0].value)
      .clear()
      .type(data.description);
    cy.get('[data-cy=keywords-input] input')
      .type('{backspace}'.repeat(5))
      .type(`${data.keywords.join('{enter}')}{enter}`);
    cy.get('[data-cy=submit-button]').click();

    cy.wait('@submitRequest');
    cy.url().should('match', /\/project\/(.+)/);
    cy.contains(payload.shortcode).should('be.visible');
    cy.contains(data.description).should('be.visible');
    data.keywords.forEach(keyword => cy.contains(keyword).should('be.visible'));
  });

  it('admin can deactivate a project', () => {
    cy.intercept('DELETE', `/admin/projects/iri/${encodeURIComponent(projectIri)}`).as('deactivateRequest');

    cy.visit('/system/projects');
    cy.get('[data-cy=active-projects-section]')
      .contains('[data-cy=project-row]', payload.shortcode)
      .find('[data-cy=more-button]')
      .scrollIntoView()
      .should('be.visible')
      .click();
    cy.get('[data-cy=deactivate-button]').click();
    cy.get('[data-cy=confirmation-button]').click();
    cy.wait('@deactivateRequest');

    cy.get('[data-cy=inactive-projects-section]').contains('[data-cy=project-row]', payload.shortcode).should('exist');
  });

  it.only('admin can reactivate a project', () => {
    cy.intercept('PUT', `/admin/projects/iri/${encodeURIComponent(projectIri)}`).as('updateRequest');

    cy.request('DELETE', `${Cypress.env('apiUrl')}/admin/projects/iri/${encodeURIComponent(projectIri)}`).then(() => {
      cy.visit('/system/projects');
      cy.get('[data-cy=inactive-projects-section]')
        .contains('[data-cy=project-row]', payload.shortcode)
        .find('[data-cy=more-button]')
        .scrollIntoView()
        .should('be.visible')
        .click();
      cy.get('[data-cy=reactivate-button]').scrollIntoView().click({ force: true });
      cy.get('[data-cy=confirmation-button]').click();
      cy.wait('@updateRequest');

      cy.get('[data-cy=active-projects-section]').contains('[data-cy=project-row]', payload.shortcode).should('exist');
    });
  });
});
