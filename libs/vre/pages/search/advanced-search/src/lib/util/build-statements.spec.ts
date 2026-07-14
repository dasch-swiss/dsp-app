import { Constants } from '@dasch-swiss/dsp-js';
import { NodeValue } from '../model';
import { Operator } from '../operators.config';
import { FilterParam } from '../service/search-url-sync.service';
import { makePredicate } from '../testing/test-data-builders';
import { buildStatementsFromFilterParams } from './build-statements';

/**
 * Restore-baseline specs for the pure filter-decode → StatementElement reconstruction
 * (DEV-6576 Phase 2). This is the logic that hydrates the URL's `filters` param into the
 * statement tree; it must survive into the `searchState$` derivation unchanged, so it is pinned
 * here in isolation from the component.
 */
describe('buildStatementsFromFilterParams (DEV-6576)', () => {
  const titlePred = makePredicate('http://x/hasTitle', 'Title', Constants.TextValue, false);
  const authorPred = makePredicate('http://x/hasAuthor', 'Author', 'http://x/Person', true);
  const namePred = makePredicate('http://x/hasName', 'Name', Constants.TextValue, false);

  const fp = (over: Partial<FilterParam>): FilterParam => ({
    parentIndex: null,
    predicateIri: titlePred.iri,
    operator: Operator.Equals,
    value: '',
    ...over,
  });

  it('builds a single flat statement with predicate, operator, and value', () => {
    const [stmt, ...rest] = buildStatementsFromFilterParams(
      [fp({ predicateIri: titlePred.iri, operator: Operator.Equals, value: 'Moby Dick' })],
      [titlePred]
    );

    expect(rest).toHaveLength(0);
    expect(stmt.selectedPredicate).toBe(titlePred);
    expect(stmt.selectedOperator).toBe(Operator.Equals);
    expect(stmt.selectedObjectValue).toBe('Moby Dick');
    expect(stmt.statementLevel).toBe(0);
    expect(stmt.parentId).toBeUndefined();
  });

  it('rebuilds a linked-resource value as an IriLabelPair carrying its label (DEV-6576)', () => {
    // A link filter round-trips through the URL as { value: <resource IRI>, valueLabel: "Rita" }; on
    // rehydration the value must become an IriLabelPair so the chip shows "Rita", not the IRI.
    const [stmt] = buildStatementsFromFilterParams(
      [
        fp({
          predicateIri: authorPred.iri,
          operator: Operator.Equals,
          value: 'http://rdfh.ch/0801/abc',
          valueLabel: 'Rita',
        }),
      ],
      [authorPred]
    );

    expect(typeof stmt.selectedObjectValue).toBe('object');
    expect(stmt.selectedObjectValue).toMatchObject({ iri: 'http://rdfh.ch/0801/abc' });
    // NodeValue.label picks the first non-empty label value → what the chip renders.
    expect(stmt.selectedObjectLabel).toBe('Rita');
  });

  it('keeps a plain string value as a string when there is no valueLabel', () => {
    const [stmt] = buildStatementsFromFilterParams(
      [fp({ predicateIri: titlePred.iri, operator: Operator.Equals, value: 'Moby Dick' })],
      [titlePred]
    );

    expect(stmt.selectedObjectValue).toBe('Moby Dick');
    expect(stmt.selectedObjectLabel).toBeUndefined();
  });

  it('skips a param whose predicate IRI is not among the hydrated predicates', () => {
    const result = buildStatementsFromFilterParams([fp({ predicateIri: 'http://x/unknown', value: 'v' })], [titlePred]);

    expect(result).toEqual([]);
  });

  it('wires a child to its parent via parentIndex (level + parent link)', () => {
    const result = buildStatementsFromFilterParams(
      [
        fp({ predicateIri: authorPred.iri, operator: Operator.Exists }),
        fp({ predicateIri: namePred.iri, operator: Operator.Equals, value: 'Melville', parentIndex: 0 }),
      ],
      [authorPred, namePred]
    );

    expect(result).toHaveLength(2);
    const [parent, child] = result;
    expect(child.statementLevel).toBe(parent.statementLevel + 1);
    expect(child.parentId).toBe(parent.id);
  });

  it('keeps parentIndex aligned to the ORIGINAL positions when an earlier param is dropped', () => {
    // The first param's predicate is not hydrated (e.g. a shared URL / ontology switch), so it is
    // skipped. The child at index 2 must still resolve its parent (index 1), not misalign onto the
    // shrunken result array. Regression for the parentIndex positional-desync bug.
    const result = buildStatementsFromFilterParams(
      [
        fp({ predicateIri: 'http://x/unknown-not-hydrated', value: 'x' }), // index 0 → dropped
        fp({ predicateIri: authorPred.iri, operator: Operator.Exists }), // index 1 → parent
        fp({ predicateIri: namePred.iri, operator: Operator.Equals, value: 'Melville', parentIndex: 1 }), // child of 1
      ],
      [authorPred, namePred]
    );

    expect(result).toHaveLength(2);
    const [parent, child] = result;
    expect(parent.selectedPredicate?.iri).toBe(authorPred.iri);
    expect(child.selectedPredicate?.iri).toBe(namePred.iri);
    // The child is correctly wired to the author (originally index 1), NOT dropped or reparented.
    expect(child.parentId).toBe(parent.id);
    expect(child.statementLevel).toBe(parent.statementLevel + 1);
  });

  it('drops a child whose parent param was dropped (orphan), without reparenting it', () => {
    // Parent (index 0) has an unhydrated predicate → dropped. Its child (index 1, parentIndex 0) must
    // be dropped as an orphan, not silently attached to some other surviving statement.
    const result = buildStatementsFromFilterParams(
      [
        fp({ predicateIri: 'http://x/unknown-not-hydrated', operator: Operator.Exists }), // index 0 → dropped
        fp({ predicateIri: namePred.iri, value: 'orphan', parentIndex: 0 }), // child of the dropped parent
        fp({ predicateIri: titlePred.iri, value: 'sibling' }), // index 2 → unrelated top-level
      ],
      [namePred, titlePred]
    );

    // Only the unrelated top-level survives; the orphaned child is not reparented onto it.
    expect(result).toHaveLength(1);
    expect(result[0].selectedPredicate?.iri).toBe(titlePred.iri);
    expect(result[0].parentId).toBeUndefined();
  });

  it('does not inherit a subject node when the parent object is a plain string value', () => {
    // Faithful to the original reducer: only a NodeValue parent object propagates as the child's
    // subject node. URL filter values decode to string object values, so no subject is inherited.
    const result = buildStatementsFromFilterParams(
      [
        fp({ predicateIri: titlePred.iri, value: 'plain' }),
        fp({ predicateIri: namePred.iri, value: 'child', parentIndex: 0 }),
      ],
      [titlePred, namePred]
    );

    expect(result[1].subjectNode).toBeUndefined();
    expect(result[1].parentId).toBe(result[0].id);
  });

  it('skips a child whose parentIndex points past the already-built statements', () => {
    const result = buildStatementsFromFilterParams(
      [fp({ predicateIri: namePred.iri, value: 'orphan', parentIndex: 5 })],
      [namePred]
    );

    expect(result).toEqual([]);
  });

  it('returns an empty array for empty input', () => {
    expect(buildStatementsFromFilterParams([], [titlePred])).toEqual([]);
  });

  it('does not set operator/value when they are absent/empty', () => {
    const [stmt] = buildStatementsFromFilterParams(
      [{ parentIndex: null, predicateIri: titlePred.iri, operator: undefined as unknown as Operator, value: '' }],
      [titlePred]
    );

    // No operator param and empty value → predicate set, but setting a predicate defaults the
    // operator to Equals (StatementElement.selectedPredicate setter), and no object value assigned.
    expect(stmt.selectedPredicate).toBe(titlePred);
    expect(stmt.selectedObjectValue).toBeUndefined();
  });

  it('preserves NodeValue type checks without throwing on mixed trees', () => {
    const result = buildStatementsFromFilterParams(
      [
        fp({ predicateIri: authorPred.iri, operator: Operator.Exists }),
        fp({ predicateIri: namePred.iri, value: 'a', parentIndex: 0 }),
        fp({ predicateIri: titlePred.iri, value: 'b' }),
      ],
      [authorPred, namePred, titlePred]
    );

    expect(result).toHaveLength(3);
    expect(result[1].parentId).toBe(result[0].id);
    expect(result[2].parentId).toBeUndefined();
    expect(result.some(s => s.selectedObjectNode instanceof NodeValue)).toBe(false);
  });
});
