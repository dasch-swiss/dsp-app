import { faker } from '@faker-js/faker';
import { UserProfiles } from '../../models/user-profiles';
import { Project0001Page } from '../../support/pages/existing-ontology-class-page';

const anythingOntology = 'http://0.0.0.0:3333/ontology/0001/anything/v2#';
const knoraApi = 'http://api.knora.org/ontology/knora-api/v2#';

// `anything:VideoThing` test-data fixture (`test_data/project_data/anything-data.ttl` in dsp-api),
// a MovingImageRepresentation instance every anything-project test can rely on existing.
const videoThingIri = 'http://rdfh.ch/0001/zUelKon-SdmuL9iiHMgnGw';

// `knora-api:Region` test-data fixture used by dsp-api's ResourceDescriptionE2ESpec for the same property.
const existingRegionIri = 'http://rdfh.ch/0001/A5NfXW4QRxOnBPULCTvH5w';

function resourceUuid(resourceIri: string): string {
  return resourceIri.substring(resourceIri.lastIndexOf('/') + 1);
}

function visitResource(resourceIri: string) {
  cy.visit(`/resource/${Project0001Page.projectShortCode}/${resourceUuid(resourceIri)}`);
}

/** Authenticates directly against dsp-api, independent of any app-side `cy.login` session. */
function getAnythingAdminToken() {
  return cy.readFile('cypress/fixtures/user_profiles.json').then((json: UserProfiles) =>
    cy
      .request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/v2/authentication`,
        body: {
          username: json.anythingProjectAdmin_username,
          password: json.anythingProjectAdmin_password,
        },
      })
      .then(response => response.body.token as string)
  );
}

function createThing(token: string, label: string, description?: string) {
  return cy
    .request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/v2/resources`,
      headers: { Authorization: `Bearer ${token}` },
      body: {
        '@type': `${anythingOntology}Thing`,
        'http://www.w3.org/2000/01/rdf-schema#label': label,
        'http://api.knora.org/ontology/knora-api/v2#attachedToProject': {
          '@id': `http://rdfh.ch/projects/${Project0001Page.projectShortCode}`,
        },
        ...(description
          ? {
              [`${knoraApi}hasDescription`]: {
                '@type': `${knoraApi}TextValue`,
                [`${knoraApi}valueAsString`]: description,
              },
            }
          : {}),
      },
    })
    .then(response => {
      expect(response.status).to.equal(200);
      return response.body['@id'] as string;
    });
}

function createVideoSegment(token: string, label: string, description: string) {
  return cy
    .request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/v2/resources`,
      headers: { Authorization: `Bearer ${token}` },
      body: {
        '@type': `${knoraApi}VideoSegment`,
        'http://www.w3.org/2000/01/rdf-schema#label': label,
        'http://api.knora.org/ontology/knora-api/v2#attachedToProject': {
          '@id': `http://rdfh.ch/projects/${Project0001Page.projectShortCode}`,
        },
        [`${knoraApi}isVideoSegmentOfValue`]: {
          '@type': `${knoraApi}LinkValue`,
          [`${knoraApi}linkValueHasTargetIri`]: {
            '@id': videoThingIri,
          },
        },
        [`${knoraApi}hasSegmentBounds`]: {
          '@type': `${knoraApi}IntervalValue`,
          [`${knoraApi}intervalValueHasStart`]: {
            '@type': 'http://www.w3.org/2001/XMLSchema#decimal',
            '@value': '1.0',
          },
          [`${knoraApi}intervalValueHasEnd`]: {
            '@type': 'http://www.w3.org/2001/XMLSchema#decimal',
            '@value': '2.0',
          },
        },
        [`${knoraApi}hasDescription`]: {
          '@type': `${knoraApi}TextValue`,
          [`${knoraApi}valueAsString`]: description,
        },
      },
    })
    .then(response => {
      expect(response.status).to.equal(200);
      return response.body['@id'] as string;
    });
}

describe('Resource description', () => {
  beforeEach(() => {
    cy.viewport(2000, 1000);
  });

  describe('as an editor', () => {
    let thingIri: string;

    beforeEach(() => {
      cy.readFile('cypress/fixtures/user_profiles.json').then((json: UserProfiles) => {
        cy.login({
          username: json.anythingProjectAdmin_username,
          password: json.anythingProjectAdmin_password,
        }).then(() => {
          getAnythingAdminToken().then(token => {
            createThing(token, faker.lorem.words(3)).then(iri => {
              thingIri = iri;
            });
          });
        });
      });
    });

    it('adds a description in the header, and the property list has no hasDescription row', () => {
      visitResource(thingIri);
      cy.intercept('POST', '**/v2/values').as('createValue');

      cy.get('[data-cy=resource-header-description]').should('be.visible');
      cy.get('[data-cy=resource-header-description]').find('[data-cy=add-property-value-button]').click();

      const description = faker.lorem.sentence();
      cy.get('[data-cy=resource-header-description]')
        .find('[data-cy=common-input-text]')
        .should('be.visible')
        .type(description);
      cy.get('[data-cy=resource-header-description]').find('[data-cy=save-button]').click();
      cy.wait('@createValue').its('response.statusCode').should('eq', 200);

      cy.get('[data-cy=resource-header-description]').contains(description);
      cy.get(`[data-cy="row-${knoraApi}hasDescription"]`).should('not.exist');
    });

    it('edits and then deletes the description in the header', () => {
      getAnythingAdminToken().then(token => {
        createThing(token, faker.lorem.words(3), faker.lorem.sentence()).then(iri => {
          visitResource(iri);

          cy.intercept('PUT', '**/v2/values').as('updateValue');
          cy.get('[data-cy=resource-header-description]').find('[data-cy=property-value]').trigger('mouseenter');
          cy.get('[data-cy=resource-header-description]')
            .find('[data-cy="action-bubble"] .edit-button')
            .should('be.visible')
            .click({ force: true });

          const updatedDescription = faker.lorem.sentence();
          cy.get('[data-cy=resource-header-description]')
            .find('[data-cy=common-input-text]')
            .should('be.visible')
            .clear()
            .type(updatedDescription);
          cy.get('[data-cy=resource-header-description]').find('[data-cy=save-button]').click();
          cy.wait('@updateValue').its('response.statusCode').should('eq', 200);
          cy.get('[data-cy=resource-header-description]').contains(updatedDescription);

          cy.intercept('POST', '**/v2/values/delete').as('deleteValue');
          cy.get('[data-cy=resource-header-description]').find('[data-cy=property-value]').trigger('mouseenter');
          cy.get('[data-cy=resource-header-description]')
            .find('[data-cy="delete-button"]')
            .should('be.visible')
            .click();
          cy.get('[data-cy="delete-comment"]').should('be.visible').type(faker.lorem.sentence());
          cy.get('[data-cy="confirm-button"]').click();
          cy.wait('@deleteValue').its('response.statusCode').should('eq', 200);
          cy.get('[data-cy=resource-header-description]').find('[data-cy=property-value]').should('not.exist');
        });
      });
    });
  });

  describe('as a user without edit rights', () => {
    it('sees the description with no edit controls', () => {
      const description = faker.lorem.sentence();
      getAnythingAdminToken().then(token => {
        createThing(token, faker.lorem.words(3), description).then(iri => {
          // No cy.login: an anonymous visit exercises the no-edit-rights viewer without
          // depending on cy.logout's cy.session lifecycle mid-test.
          visitResource(iri);
          cy.get('[data-cy=accept-cookies]').click();

          cy.get('[data-cy=resource-header-description]').should('be.visible');
          cy.get('[data-cy=resource-header-description]').contains(description);
          cy.get('[data-cy=resource-header-description]')
            .find('[data-cy=add-property-value-button]')
            .should('not.exist');
          cy.get('[data-cy=resource-header-description]').find('[data-cy=property-value]').trigger('mouseenter');
          cy.get('[data-cy=resource-header-description]').find('[data-cy="action-bubble"]').should('not.exist');
        });
      });
    });
  });

  describe('segments', () => {
    it('still shows the description on a video segment', () => {
      const description = faker.lorem.sentence();
      cy.readFile('cypress/fixtures/user_profiles.json').then((json: UserProfiles) => {
        cy.login({
          username: json.anythingProjectAdmin_username,
          password: json.anythingProjectAdmin_password,
        }).then(() => {
          getAnythingAdminToken().then(token => {
            createVideoSegment(token, faker.lorem.words(3), description).then(iri => {
              visitResource(iri);

              cy.get('[data-cy=resource-header-description]').should('be.visible');
              cy.get('[data-cy=resource-header-description]').contains(description);
              cy.get(`[data-cy="row-${knoraApi}hasDescription"]`).should('exist');
            });
          });
        });
      });
    });
  });

  describe('regions', () => {
    it('shows no resource-header-description on a region opened on its own page', () => {
      cy.readFile('cypress/fixtures/user_profiles.json').then((json: UserProfiles) => {
        cy.login({
          username: json.anythingProjectAdmin_username,
          password: json.anythingProjectAdmin_password,
        }).then(() => {
          visitResource(existingRegionIri);
          cy.get('[data-cy=resource-header-label]').should('be.visible');
          cy.get('[data-cy=resource-header-description]').should('not.exist');
        });
      });
    });
  });

  describe('data model editor', () => {
    it('does not list Description on the anything:Thing class view', () => {
      cy.readFile('cypress/fixtures/user_profiles.json').then((json: UserProfiles) => {
        cy.login({
          username: json.anythingProjectAdmin_username,
          password: json.anythingProjectAdmin_password,
        });
      });

      cy.visit(`/project/${Project0001Page.projectShortCode}/ontology/anything/editor/classes`);
      cy.get('[data-cy=class-card]')
        .contains('Thing')
        .parents('[data-cy=class-card]')
        .first()
        .within(() => {
          cy.get('[data-cy=property-label]')
            .contains(/description/i)
            .should('not.exist');
        });
    });
  });
});
