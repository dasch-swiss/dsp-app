import { ArchiveClassResource } from '../../models/existing-data-models';
import { Project0001Page } from '../../support/pages/existing-ontology-class-page';

describe('Create archive model, add new data and view it', () => {
  let projectAssertionPage: Project0001Page;

  const archiveData: ArchiveClassResource = {
    className: 'ThingArchive',
    label: 'Archive Representation',
    file: '7mdeoFJ48dI-YCKeZrXK3Rr.7z',
  };

  const archiveFile = '7mdeoFJ48dI-YCKeZrXK3Rr.7z';

  beforeEach(() => {
    projectAssertionPage = new Project0001Page();
  });

  it('archive representation should be present', () => {
    projectAssertionPage.visitClass(archiveData.className);
    cy.get('[data-cy=accept-cookies]').click();
    cy.get('[data-cy=resource-list-item]').contains(archiveData.label).click();
    cy.get('[data-cy=resource-header-label]').contains(archiveData.label);
    cy.get('.representation-container').should('exist');
    cy.get('app-archive').should('be.visible');
    // cy.get('[data-cy=original-file-name]').contains(archiveFile);
    cy.get('[data-cy=more-button]').click();
    // cy.get('[data-cy=download-file-button]').click(); //merge #4227 bugfix
    // cy.readFile(path.join(Cypress.config('downloadsFolder'), 'file.zip')).should('exist');
  });
});
