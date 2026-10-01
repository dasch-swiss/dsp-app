import { NodeValue, Predicate, PropertyObjectType, StatementElement } from '../model';
import { FilterParam } from '../filter-params.codec';
import { toLabels } from './labels';

/**
 * Set of object types whose operand is a node reference (an IRI naming a list node, resource class,
 * or linked resource) rather than a plain literal. Matches the branching in
 * {@link StatementElement.objectType}; when a new node-shaped `PropertyObjectType` is added, add it
 * here too so the URL rehydration keeps producing the `IriLabelPair` shape the chip pipe expects.
 */
const NODE_SHAPED_OBJECT_TYPES: ReadonlySet<PropertyObjectType> = new Set([
  PropertyObjectType.ListValueObject,
  PropertyObjectType.LinkValueObject,
  PropertyObjectType.ResourceObject,
]);

/**
 * Pure reconstruction of the confirmed statement tree from decoded URL filter params. This is the
 * reconstruction used by the `searchState$` derivation. Given the URL's `FilterParam[]` and the
 * ontology's hydrated `Predicate[]`, it returns the `StatementElement[]` those params describe —
 * resolving each predicate by IRI and wiring parent/child links via `parentIndex`.
 *
 * `parentIndex` is a position in the *original* `filterParams` array (that is how the encoder assigns
 * it). Reconstruction therefore keeps a slot array aligned to those original indices — dropped entries
 * leave a `null` slot rather than shifting later ones — so a child's `parentIndex` still resolves to the
 * right parent even when an *earlier* entry was skipped (e.g. its predicate is not in the currently
 * hydrated ontology, common for shared/bookmarked URLs and ontology switches). Resolving into the
 * growing result array instead would misalign every index after the first drop, silently dropping or
 * reparenting subcriteria.
 *
 * Reconstruction rules:
 * - a `FilterParam` whose predicate IRI is not among `predicates` is skipped (its slot becomes `null`);
 * - a child whose `parentIndex` is out of range or points at a dropped (`null`) slot is skipped;
 * - a child inherits its parent's object node (when it is a `NodeValue`) as its subject node,
 *   and `parentStatementLevel + 1`.
 */
export function buildStatementsFromFilterParams(
  filterParams: FilterParam[],
  predicates: Predicate[]
): StatementElement[] {
  // Slot array aligned 1:1 with `filterParams` by original index; `null` marks a dropped entry.
  const slots: (StatementElement | null)[] = new Array(filterParams.length).fill(null);
  const result: StatementElement[] = [];

  filterParams.forEach((fp, index) => {
    const predicate = predicates.find(p => p.iri === fp.predicateIri);
    if (!predicate) return; // leave slots[index] = null

    // Resolve the parent by its ORIGINAL index. Out-of-range or a dropped parent → orphan, skip the child.
    // Parents always precede their children in the encoding, so a valid parent slot is already filled here.
    let parentStmt: StatementElement | undefined;
    if (fp.parentIndex !== null) {
      if (fp.parentIndex < 0 || fp.parentIndex >= slots.length || slots[fp.parentIndex] === null) return;
      parentStmt = slots[fp.parentIndex] ?? undefined;
    }

    const stmt = new StatementElement(
      parentStmt?.selectedObjectNode instanceof NodeValue ? parentStmt.selectedObjectNode : undefined,
      parentStmt ? parentStmt.statementLevel + 1 : 0,
      parentStmt
    );
    stmt.selectedPredicate = predicate;
    if (fp.operator) stmt.selectedOperator = fp.operator;
    if (fp.value) {
      // Rebuild the object *shape* the chip and editor expect. The setter on `selectedObjectValue`
      // routes strings to `StringValue` and objects to `NodeValue`, and the chip pipe treats those
      // two very differently — a `StringValue` is rendered as-is, while a `NodeValue`'s labels are
      // resolved from live data (list tree / ontology) via the label resolver, which is what makes
      // the chip re-translate on language switch (DEV-6857). So statements whose object is a linked
      // *node* (list nodes, resource classes picked via Matches, linked resources) must land as
      // NodeValue-shaped IriLabelPairs — even when the URL carries no `valueLabel` (which is now
      // the case for list values and resource-class Matches under DEV-6857). The classification
      // itself lives on `StatementElement.objectType`, so route through it rather than duplicating
      // its branching here — a new node-shaped `PropertyObjectType` only needs to be added to
      // `NODE_SHAPED_OBJECT_TYPES` above.
      stmt.selectedObjectValue = NODE_SHAPED_OBJECT_TYPES.has(stmt.objectType)
        ? { iri: fp.value, labels: toLabels(fp.valueLabel), comments: [] }
        : fp.value;
    }
    slots[index] = stmt;
    result.push(stmt);
  });

  return result;
}
