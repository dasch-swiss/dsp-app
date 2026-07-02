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
