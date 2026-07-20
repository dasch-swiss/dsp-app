import { faker } from '@faker-js/faker';

// Monotonic counter guaranteeing uniqueness within a single spec run, even when
// two names are generated in the same millisecond.
let counter = 0;

// dsp-api rejects any ontology name that *contains* one of these as a substring
// (case-insensitive), e.g. an `rdf` hidden inside `FhWrDfSouF`. A raw random
// alpha string embeds one by chance every few hundred draws, which 400s
// `POST /v2/ontologies` and flakes any ontology-creating spec. See DEV-6764.
const RESERVED_WORDS = ['rdf', 'rdfs', 'owl', 'xsd', 'schema', 'shared', 'simple', 'ontology'];

const containsReservedWord = (name: string): boolean => {
  const lower = name.toLowerCase();
  return RESERVED_WORDS.some(word => lower.includes(word));
};

/**
 * Generate a unique, valid ontology entity name (ontology, class or property `name`).
 *
 * Ontology names are validated in the app by `CustomRegex.ID_NAME_REGEX`
 * (`/^(?![vV]+[0-9])+^([a-zA-Z])[a-zA-Z0-9_.-]*$/`) AND by an async
 * "already exists" validator that keeps the submit button disabled on any
 * collision with an existing entity name. Ontology `name`s are additionally
 * rejected by dsp-api if they contain a reserved word as a substring.
 *
 * Bare `faker.lorem.word()` draws from a ~1000-word dictionary, so two calls in
 * the same test (or a clash with a reset-database default) intermittently
 * collide, the submit button stays disabled, and `cy.click()` fails with
 * "this element is `disabled`". This flakiness — not any API change — is what
 * stalls the auto-generated OpenAPI spec-bump PRs.
 *
 * The counter suffix makes the name unique; the leading lowercase letter keeps
 * it regex-valid and clear of the `v|V` + digit lookahead; the reserved-word
 * guard re-draws the random part until it embeds none.
 */
export function uniqueName(): string {
  counter += 1;
  let candidate = `e2e${faker.string.alpha({ length: 6, casing: 'lower' })}${counter}`;
  while (containsReservedWord(candidate)) {
    candidate = `e2e${faker.string.alpha({ length: 6, casing: 'lower' })}${counter}`;
  }
  return candidate;
}
