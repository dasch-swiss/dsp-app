import { NodeValue, Predicate, StatementElement } from '../model';
import { FilterParam } from '../service/search-url-sync.service';

/**
 * Pure reconstruction of the confirmed statement tree from decoded URL filter params.
 *
 * Extracted verbatim (DEV-6576 Phase 2) from the inline reducer in
 * `FilterChipBarComponent._applyParams`, so it can be unit-tested in isolation and reused by the
 * `searchState$` derivation. Given the URL's `FilterParam[]` and the ontology's hydrated
 * `Predicate[]`, it returns the `StatementElement[]` those params describe — resolving each
 * predicate by IRI and wiring parent/child links via `parentIndex`.
 *
 * Behaviour matches the previous implementation exactly:
 * - a `FilterParam` whose predicate IRI is not among `predicates` is skipped;
 * - a child whose `parentIndex` points past the already-built statements is skipped;
 * - a child inherits its parent's object node (when it is a `NodeValue`) as its subject node,
 *   and `parentStatementLevel + 1`.
 */
export function buildStatementsFromFilterParams(
  filterParams: FilterParam[],
  predicates: Predicate[]
): StatementElement[] {
  return filterParams.reduce((acc, fp) => {
    if (fp.parentIndex !== null && fp.parentIndex >= acc.length) return acc;
    const predicate = predicates.find(p => p.iri === fp.predicateIri);
    if (!predicate) return acc;
    const parentStmt = fp.parentIndex !== null ? acc[fp.parentIndex] : undefined;
    const stmt = new StatementElement(
      parentStmt?.selectedObjectNode instanceof NodeValue ? parentStmt.selectedObjectNode : undefined,
      parentStmt ? parentStmt.statementLevel + 1 : 0,
      parentStmt
    );
    stmt.selectedPredicate = predicate;
    if (fp.operator) stmt.selectedOperator = fp.operator;
    if (fp.value) stmt.selectedObjectValue = fp.value;
    return [...acc, stmt];
  }, [] as StatementElement[]);
}
