import { Project0001Page } from '../../support/pages/existing-ontology-class-page';

describe('Image settings', () => {
  const settingsRoute = `/project/${Project0001Page.projectShortCode}/settings/image-settings`;

  // One linear walk rather than several independent tests: every case mutates the project's stored
  // setting, so separate tests would depend on each other's leftovers. The triplestore reset that
  // gives this spec a known starting point is the global per-spec-file `before()` in
  // cypress/support/e2e.ts, not a call here.
  it('walks a stored size through Default and on to a watermark, never sending pct:100', () => {
    const requestBodies: string[] = [];

    cy.intercept('GET', '**/RestrictedViewSettings').as('loadSettings');
    cy.intercept('DELETE', '**/RestrictedViewSettings').as('clearSettings');
    cy.intercept('POST', '**/RestrictedViewSettings', req => {
      requestBodies.push(JSON.stringify(req.body));
    }).as('saveSettings');

    cy.visit(settingsRoute);
    cy.wait('@loadSettings').then(({ response }) => {
      expect(response?.statusCode).to.equal(200);
      expect(response?.body.isDefault, '0001 starts on the platform default').to.equal(true);
    });

    // Assert a rendered post-load state before interacting. `cy.wait` only proves the response was
    // seen, not that applyResponse() has run, and "Submit is disabled" is true both before and
    // after the load — so it cannot stand in for that.
    cy.get('[data-cy=image-settings-default] input').should('be.checked');

    cy.log('Submit is disabled until the selection changes');
    cy.get('[data-cy=image-settings-submit]').should('be.disabled');

    cy.log('Store an explicit size, so there is something for Default to clear');
    cy.get('[data-cy=image-settings-restrict-size]').click();
    cy.get('[data-cy=image-settings-submit]').should('be.enabled').click();
    cy.wait('@saveSettings').its('response.statusCode').should('eq', 200);

    cy.reload();
    cy.wait('@loadSettings');
    cy.get('[data-cy=image-settings-restrict-size] input').should('be.checked');

    cy.log('Default issues a DELETE');
    cy.get('[data-cy=image-settings-default]').click();
    cy.get('[data-cy=image-settings-submit]').should('be.enabled').click();
    cy.wait('@clearSettings').its('response.statusCode').should('eq', 200);

    cy.log('A reload lands on Default and names the inherited limit');
    cy.reload();
    cy.wait('@loadSettings').then(({ response }) => {
      expect(response?.body.isDefault).to.equal(true);
    });
    cy.get('[data-cy=image-settings-default] input').should('be.checked');
    cy.get('[data-cy=image-settings-default-hint]').should('be.visible');

    cy.log('A watermark still saves through POST');
    cy.get('[data-cy=image-settings-watermark]').click();
    cy.get('[data-cy=image-settings-submit]').should('be.enabled').click();
    cy.wait('@saveSettings').its('response.statusCode').should('eq', 200);

    cy.reload();
    cy.wait('@loadSettings');
    cy.get('[data-cy=image-settings-watermark] input').should('be.checked');

    cy.then(() => {
      expect(requestBodies.join(' ')).not.to.contain('pct:100');
    });
  });
});
