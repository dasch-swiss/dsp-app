import { faker } from '@faker-js/faker';

import { Project00FFPayloads } from '../../fixtures/project00FF-resource-payloads';
import { ClassPropertyPayloads } from '../../fixtures/property-definition-payloads';
import { ResourceRequests, ResponseUtil } from '../../fixtures/requests';
import { AddResourceInstancePage } from '../../support/pages/add-resource-instance-page';

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('ACCESS_TOKEN')}`,
});

/**
 * Guards the architectural contract that editing a property in the resource
 * viewer must NOT tear down and recreate the resource subtree. If it did,
 * the page would scroll back to the top and the user would lose their place
 * mid-edit — a UX regression we explicitly want to prevent.
 *
 * The Storybook story `resource-dispatcher.component.stories.ts` covers the
 * dispatcher's own contract in isolation; this e2e covers the full chain
 * from `ResourceFetcherComponent` down through the dispatcher to
 * `PropertiesDisplayComponent` against a real backend, so it catches
 * destroy-on-reload regressions introduced anywhere along that path.
 *
 * The "plain" resource (no file representation) is the case that historically
 * carried the bug — see the fix in `resource-dispatcher.component.ts`'s
 * `ngOnChanges` and the matching unit-test coverage.
 */
describe('Resource view preserves identity on edit (no scroll-to-top)', () => {
  let finalLastModificationDate: string;
  let propertyName: string;
  let po: AddResourceInstancePage;
  const project00FFPayloads = new Project00FFPayloads();

  // Mirrors the setup in resource.cy.ts: create a fresh plain class on the
  // 00FF/images ontology and attach a short-text property to it.
  beforeEach(() => {
    const className = `class${faker.string.alphanumeric(8)}`;
    propertyName = `prop${faker.string.alphanumeric(8)}`;
    po = new AddResourceInstancePage(className);

    const ontologyIri = encodeURIComponent(`${Cypress.env('apiUrl')}/ontology/00FF/images/v2`);
    cy.request({
      method: 'GET',
      url: `${Cypress.env('apiUrl')}/v2/ontologies/allentities/${ontologyIri}`,
      headers: getAuthHeaders(),
    }).then(ontResponse => {
      const currentLmd = ontResponse.body['knora-api:lastModificationDate']['@value'];
      cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/v2/ontologies/classes`,
        headers: getAuthHeaders(),
        body: project00FFPayloads.createClassPayload(className, undefined, currentLmd),
      }).then(response => {
        finalLastModificationDate = ResponseUtil.lastModificationDate(response);
      });
    });
  });

  it('keeps the properties-display subtree alive after editing a text value', () => {
    const initialValue = faker.lorem.word();
    const editedValue = faker.lorem.word();

    ResourceRequests.resourceRequest(
      ClassPropertyPayloads.textShort(finalLastModificationDate, propertyName),
      false,
      po.className,
      propertyName
    );
    po.visitAddPage();

    // ---- Create the resource ----
    po.addInitialLabel();
    cy.get('[data-cy=text-input]').type(initialValue);
    po.clickOnSubmit();
    cy.contains(initialValue);

    // ---- Tag the live DOM so we can prove it survives the edit ----
    // The dispatcher renders <app-resource-plain> for non-representation
    // resources. If the dispatcher destroys+recreates the subtree on reload,
    // this tagged node will be gone and the assertion below fails.
    cy.get('app-resource-plain').first().invoke('attr', 'data-test-survives-edit', 'original');

    // ---- Edit the value WITHOUT cy.reload() ----
    // AddResourceInstancePage.saveEdit() calls cy.reload() — we intentionally
    // bypass it here because that reload would mask the very regression we
    // are guarding against.
    po.mouseHover();
    cy.get('[data-cy=edit-button]').click({ force: true });
    cy.get('[data-cy=text-input] input').clear().type(editedValue);
    cy.intercept('PUT', '**/v2/values').as('saveValue');
    cy.get('[data-cy=save-button]').click({ force: true });
    cy.wait('@saveValue');

    // ---- Assertions ----
    // 1. The edited value is rendered.
    cy.contains(editedValue);

    // 2. The tagged <app-resource-plain> still exists with its marker —
    //    proves the subtree was NOT destroyed and recreated.
    //    A regression of the destroy-on-reload bug would make this fail.
    cy.get('app-resource-plain[data-test-survives-edit="original"]').should('exist');
  });
});