import { faker } from '@faker-js/faker';
import { UserProfiles } from '../../models/user-profiles';
import { Project0001Page } from '../../support/pages/existing-ontology-class-page';

const anythingOntology = 'http://0.0.0.0:3333/ontology/0001/anything/v2#';
const knoraApi = 'http://api.knora.org/ontology/knora-api/v2#';

// The resource header renders the first description under the label
// (`resource-header-description.component.ts`); project resources have no Description property
// row, but Segments keep theirs (`GenerateProperty.commonProperty`).
const headerDescriptionSelector = '[data-cy="resource-header-description"]';
const editDescriptionButtonSelector = '[data-cy="edit-description-button"]';
// `app-properties-display` renders each row via `[attr.data-cy]="'row-' + prop.propDef.id"`.
const descriptionRowSelector = `[data-cy="row-${knoraApi}hasDescription"]`;
// The create-resource form renders a property via a `creator-row-<propertyIri>` hook
// (see `create-resource-form-properties.component.ts`).
const descriptionCreatorRowSelector = `[data-cy="creator-row-${knoraApi}hasDescription"]`;
const listItemDescriptionSelector = '[data-cy="resource-list-item-description"]';
// `hasDescription` is `salsah-gui:Richtext`, edited through `app-ck-editor`, a CKEditor
// `contenteditable` region.
const richTextContentSelector = '.ck-content[contenteditable=true]';

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

/**
 * Serves the app config with `featureFlags.resourceDescription` set, so the spec does not depend on
 * which config the app was started with (CI serves `config.prod.json`, where it is off). Cache
 * validators are dropped so the response always carries a body to rewrite.
 */
function setResourceDescriptionFlag(enabled: boolean) {
  cy.intercept('GET', '**/config/config.*.json', req => {
    delete req.headers['if-none-match'];
    delete req.headers['if-modified-since'];
    req.continue(res => {
      res.body.featureFlags = { ...res.body.featureFlags, resourceDescription: enabled };
    });
  });
}

function loginAsAnythingAdmin() {
  return cy.readFile('cypress/fixtures/user_profiles.json').then((json: UserProfiles) =>
    cy.login({
      username: json.anythingProjectAdmin_username,
      password: json.anythingProjectAdmin_password,
    })
  );
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
    setResourceDescriptionFlag(true);
  });

  describe('in the header, as an editor', () => {
    beforeEach(() => loginAsAnythingAdmin());

    it('orders the info bar, the label and the description, and has no Description row', () => {
      getAnythingAdminToken().then(token => {
        createThing(token, faker.lorem.words(3), faker.lorem.sentence()).then(iri => {
          visitResource(iri);

          cy.get('app-resource-info-bar').then(infoBar => {
            cy.get('[data-cy=resource-header-label]').then(label => {
              cy.get(headerDescriptionSelector).then(description => {
                expect(
                  infoBar[0].compareDocumentPosition(label[0]) & Node.DOCUMENT_POSITION_FOLLOWING
                ).to.be.greaterThan(0);
                expect(
                  label[0].compareDocumentPosition(description[0]) & Node.DOCUMENT_POSITION_FOLLOWING
                ).to.be.greaterThan(0);
              });
            });
          });
          cy.get(descriptionRowSelector).should('not.exist');
        });
      });
    });

    it('adds, edits and removes the description through the edit button', () => {
      getAnythingAdminToken().then(token => {
        createThing(token, faker.lorem.words(3)).then(iri => {
          visitResource(iri);
          const header = () => cy.get(headerDescriptionSelector);
          const editor = () => cy.get('mat-dialog-container').find(richTextContentSelector).should('be.visible');
          const submit = () => cy.get('[data-cy=edit-resource-description-submit]').click();

          cy.intercept('POST', '**/v2/values').as('createValue');
          header().find(editDescriptionButtonSelector).click();
          const description = faker.lorem.sentence();
          editor().type(description);
          submit();
          cy.wait('@createValue').its('response.statusCode').should('eq', 200);
          header().contains(description);

          cy.intercept('PUT', '**/v2/values').as('updateValue');
          header().find(editDescriptionButtonSelector).click();
          const updated = faker.lorem.sentence();
          editor().type('{selectall}{backspace}').type(updated);
          submit();
          cy.wait('@updateValue').its('response.statusCode').should('eq', 200);
          header().contains(updated);

          cy.intercept('POST', '**/v2/values/delete').as('deleteValue');
          header().find(editDescriptionButtonSelector).click();
          editor().type('{selectall}{backspace}');
          submit();
          cy.wait('@deleteValue').its('response.statusCode').should('eq', 200);
          header().should('not.contain', updated);
          header().find('.placeholder').should('be.visible');
        });
      });
    });
  });

  describe('in the header, as a user without edit rights', () => {
    it('sees the description read-only', () => {
      const description = faker.lorem.sentence();
      getAnythingAdminToken().then(token => {
        createThing(token, faker.lorem.words(3), description).then(iri => {
          // No cy.login: an anonymous visit exercises the no-edit-rights viewer without
          // depending on cy.logout's cy.session lifecycle mid-test.
          visitResource(iri);
          cy.get('[data-cy=accept-cookies]').click();

          cy.get(headerDescriptionSelector).contains(description);
          cy.get(editDescriptionButtonSelector).should('not.exist');
          cy.get(descriptionRowSelector).should('not.exist');
        });
      });
    });

    it('sees no description element when there is none', () => {
      getAnythingAdminToken().then(token => {
        createThing(token, faker.lorem.words(3)).then(iri => {
          visitResource(iri);
          cy.get('[data-cy=accept-cookies]').click();

          cy.get('[data-cy=resource-header-label]').should('be.visible');
          cy.get(headerDescriptionSelector).should('not.exist');
        });
      });
    });
  });

  describe('segments', () => {
    it('still shows the description as a property row on a video segment', () => {
      const description = faker.lorem.sentence();
      loginAsAnythingAdmin().then(() => {
        getAnythingAdminToken().then(token => {
          createVideoSegment(token, faker.lorem.words(3), description).then(iri => {
            visitResource(iri);

            cy.get(descriptionRowSelector).should('exist').contains(description);
            cy.get(headerDescriptionSelector).should('not.exist');
          });
        });
      });
    });
  });

  describe('regions', () => {
    it('shows no description on a region opened on its own page', () => {
      loginAsAnythingAdmin().then(() => {
        visitResource(existingRegionIri);
        cy.get('[data-cy=resource-header-label]').should('be.visible');
        cy.get(headerDescriptionSelector).should('not.exist');
        cy.get(descriptionRowSelector).should('not.exist');
      });
    });
  });

  describe('creating a resource from the anything:Thing class view', () => {
    beforeEach(() => loginAsAnythingAdmin());

    it('shows the description entered in the create-resource form in the new resource header', () => {
      new Project0001Page().visitClass('Thing');
      cy.get('[data-cy=create-resource-btn]').click();

      const label = faker.lorem.words(3);
      cy.get('[data-cy=resource-label]').find('[data-cy=common-input-text]').type(label, { force: true });

      const description = faker.lorem.sentence();
      cy.get(descriptionCreatorRowSelector).find(richTextContentSelector).should('be.visible').type(description);

      cy.intercept('GET', '**/resources/**').as('resourceRequest');
      cy.get('[data-cy=submit-button]').click();
      cy.wait('@resourceRequest').its('response.statusCode').should('eq', 200);

      cy.get('[data-cy=resource-dialog]').within(() => {
        cy.get('[data-cy=resource-header-label]').contains(label);
        cy.get(headerDescriptionSelector).contains(description);
      });
    });

    it('creates a resource without touching Description, and shows no description value', () => {
      new Project0001Page().visitClass('Thing');
      cy.get('[data-cy=create-resource-btn]').click();

      const label = faker.lorem.words(3);
      cy.get('[data-cy=resource-label]').find('[data-cy=common-input-text]').type(label, { force: true });

      cy.intercept('GET', '**/resources/**').as('resourceRequest');
      cy.get('[data-cy=submit-button]').click();
      cy.wait('@resourceRequest').its('response.statusCode').should('eq', 200);

      cy.get('[data-cy=resource-dialog]').within(() => {
        cy.get('[data-cy=resource-header-label]').contains(label);
        // An editor sees the "add" placeholder, never a rendered value.
        cy.get(headerDescriptionSelector).find('.placeholder').should('be.visible');
        cy.get(headerDescriptionSelector).find('app-rich-text-viewer').should('not.exist');
      });
    });
  });

  describe('the class resource list', () => {
    it('shows the description greyed out after the label, as plain text', () => {
      // "!" sorts before letters and digits, so the resource is on the first page of the label-ordered list.
      const label = `!${faker.lorem.words(2)}`;
      const sentence = faker.lorem.sentence();
      loginAsAnythingAdmin().then(() => {
        getAnythingAdminToken().then(token => {
          createThing(token, label, sentence).then(() => {
            new Project0001Page().visitClass('Thing');

            cy.contains('[data-cy=resource-list-item]', label)
              .find(listItemDescriptionSelector)
              .should('have.text', sentence)
              .and('have.css', 'color', 'rgba(0, 0, 0, 0.54)');
          });
        });
      });
    });
  });

  describe('with the feature flag off', () => {
    beforeEach(() => {
      setResourceDescriptionFlag(false);
      loginAsAnythingAdmin();
    });

    it('shows no description in the header, the creation form or the resource list', () => {
      const label = `!${faker.lorem.words(2)}`;
      getAnythingAdminToken().then(token => {
        createThing(token, label, faker.lorem.sentence()).then(iri => {
          visitResource(iri);
          cy.get('[data-cy=resource-header-label]').should('be.visible');
          cy.get(headerDescriptionSelector).should('not.exist');
          cy.get(descriptionRowSelector).should('not.exist');

          new Project0001Page().visitClass('Thing');
          cy.contains('[data-cy=resource-list-item]', label).find(listItemDescriptionSelector).should('not.exist');

          cy.get('[data-cy=create-resource-btn]').click();
          cy.get('[data-cy=resource-label]').should('be.visible');
          cy.get(descriptionCreatorRowSelector).should('not.exist');
        });
      });
    });
  });

  describe('data model editor', () => {
    it('does not list Description on the anything:Thing class view', () => {
      loginAsAnythingAdmin();

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
