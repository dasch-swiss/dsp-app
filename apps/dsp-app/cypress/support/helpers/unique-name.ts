import { faker } from '@faker-js/faker';

// Monotonic counter guaranteeing uniqueness within a single spec run, even when
// two names are generated in the same millisecond.
let counter = 0;

/**
 * Generate a unique, valid ontology entity name (class or property `name`).
 *
 * Ontology names are validated in the app by `CustomRegex.ID_NAME_REGEX`
 * (`/^(?![vV]+[0-9])+^([a-zA-Z])[a-zA-Z0-9_.-]*$/`) AND by an async
 * "already exists" validator that keeps the submit button disabled on any
 * collision with an existing entity name.
 *
 * Bare `faker.lorem.word()` draws from a ~1000-word dictionary, so two calls in
 * the same test (or a clash with a reset-database default) intermittently
 * collide, the submit button stays disabled, and `cy.click()` fails with
 * "this element is `disabled`". This flakiness — not any API change — is what
 * stalls the auto-generated OpenAPI spec-bump PRs.
 *
 * The counter suffix makes the name unique; the leading lowercase letter keeps
 * it regex-valid and clear of the `v|V` + digit lookahead.
 */
export function uniqueName(): string {
  counter += 1;
  return `e2e${faker.string.alpha({ length: 6, casing: 'lower' })}${counter}`;
}
