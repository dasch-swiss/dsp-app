import { TestBed } from '@angular/core/testing';
import { Constants } from '@dasch-swiss/dsp-js';
import { firstValueFrom } from 'rxjs';
import { OrderByItem, Predicate, StatementElement } from '../../model';
import { Operator } from '../../operators.config';
import { englishLabels, makePredicate } from '../../testing/test-data-builders';
import { OrderByService } from '../order-by.service';
import { SearchStateService } from '../search-state.service';

/**
 * Acceptance specs for the i18n DTO contract introduced by DEV-6645.
 *
 * Asserts that:
 *   1. `availablePredicates$` carries the full `labels: StringLiteralV2[]`
 *      from the completed statement's predicate (no single-language flattening).
 *   2. `_computeNextOrderBy` constructs `OrderByItem`s with the labels array
 *      threaded through verbatim, so the consuming `order-by.component` can
 *      pick the preferred language at render time.
 */
function makeCompletedStatement(predicateIri: string, labels: ReturnType<typeof englishLabels>): StatementElement {
  const statement = new StatementElement();
  statement.selectedPredicate = makePredicate(predicateIri, '', Constants.TextValue, false);
  // Overwrite with the desired multi-language labels (makePredicate wraps a
  // single language; we need the full set to validate propagation).
  statement.selectedPredicate.labels = labels;
  statement.selectedOperator = Operator.Equals;
  statement.selectedObjectValue = 'test';
  return statement;
}

/**
 * Build a "complete" StatementElement (`isValidAndComplete === true`) for a
 * given predicate. We use `Operator.Exists` because it makes the statement
 * complete without requiring an object node, which keeps fixtures small.
 */
function makeCompleteStatement(predicate: Predicate): StatementElement {
  const stmt = new StatementElement();
  stmt.selectedPredicate = predicate;
  stmt.selectedOperator = Operator.Exists;
  return stmt;
}

describe('OrderByService — i18n DTO propagation (DEV-6645)', () => {
  let service: OrderByService;
  let searchStateService: SearchStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [OrderByService, SearchStateService],
    });
    service = TestBed.inject(OrderByService);
    searchStateService = TestBed.inject(SearchStateService);
  });

  describe('availablePredicates$', () => {
    it('threads the predicate labels array through unchanged from the completed statement', async () => {
      const labels = [
        { language: 'en', value: 'has author' },
        { language: 'de', value: 'hat Autor' },
        { language: 'fr', value: 'a pour auteur' },
      ];
      const statement = makeCompletedStatement('http://example/hasAuthor', labels);
      searchStateService.patchState({ statementElements: [statement] });

      // `availablePredicates$` is derived from a BehaviorSubject, so by the
      // time we subscribe it replays the patched state's map immediately.
      const map = await firstValueFrom(service.availablePredicates$);

      expect(map.size).toBe(1);
      const entry = map.get(statement.id);
      expect(entry).toBeDefined();
      expect(entry!.labels).toBe(labels); // identity — no clone, no flatten
      expect(entry!.disabledForSorting).toBe(false);
    });
  });

  describe('OrderByItem construction', () => {
    it('OrderByItem stores labels as StringLiteralV2[]', () => {
      const labels = [
        { language: 'en', value: 'has title' },
        { language: 'de', value: 'hat Titel' },
      ];
      const item = new OrderByItem('http://example/hasTitle', labels, false);

      expect(item.id).toBe('http://example/hasTitle');
      expect(item.labels).toBe(labels);
      expect(item.orderBy).toBe(false);
    });

    it('defaults labels to [] when constructed without them', () => {
      const item = new OrderByItem('http://example/x');

      expect(item.labels).toEqual([]);
    });
  });
});

describe('OrderByService — disabledForSorting (DEV-6677)', () => {
  let service: OrderByService;
  let searchStateService: SearchStateService;

  const textPredicate = makePredicate('http://test.org/hasText', 'Has Text', Constants.TextValue, false);
  const linkPredicate = makePredicate('http://test.org/hasLink', 'Has Link', 'http://test.org/LinkedClass', true);
  const listPredicate = makePredicate(
    'http://test.org/hasListItem',
    'Has List Item',
    Constants.ListValue,
    false, // NOT a link property — list values are their own category
    'http://test.org/list-root'
  );

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [OrderByService, SearchStateService],
    });
    searchStateService = TestBed.inject(SearchStateService);
    service = TestBed.inject(OrderByService);
  });

  it('marks plain value predicates as orderable', async () => {
    searchStateService.patchState({ statementElements: [makeCompleteStatement(textPredicate)] });

    const available = await firstValueFrom(service.availablePredicates$);
    const entry = [...available.values()][0];

    expect(entry.disabledForSorting).toBe(false);
  });

  it('marks link predicates as non-orderable', async () => {
    searchStateService.patchState({ statementElements: [makeCompleteStatement(linkPredicate)] });

    const available = await firstValueFrom(service.availablePredicates$);
    const entry = [...available.values()][0];

    expect(entry.disabledForSorting).toBe(true);
  });

  it('marks list-value predicates as non-orderable even though isLinkProperty is false', async () => {
    // Regression test for DEV-6677: gravsearch rejects ORDER BY on linked
    // resources and list nodes ("?res1 cannot be used in ORDER BY"). The
    // service must surface list-value predicates as disabled, which the
    // template uses to grey out the checkbox and show the tooltip.
    searchStateService.patchState({ statementElements: [makeCompleteStatement(listPredicate)] });

    const available = await firstValueFrom(service.availablePredicates$);
    const entry = [...available.values()][0];

    expect(entry.disabledForSorting).toBe(true);
  });

  it('reconciles disabled flag onto emitted OrderByItem instances', async () => {
    const intPredicate = makePredicate('http://test.org/hasInt', 'Has Int', Constants.IntValue, false);

    searchStateService.patchState({
      statementElements: [
        makeCompleteStatement(textPredicate),
        makeCompleteStatement(listPredicate),
        makeCompleteStatement(linkPredicate),
      ],
    });

    // The service reacts to availablePredicates$ via skip(1), so we drive it
    // by patching state a second time to trigger reconciliation.
    searchStateService.patchState({
      statementElements: [...searchStateService.currentState.statementElements, makeCompleteStatement(intPredicate)],
    });

    const orderBy = searchStateService.currentState.orderBy;
    // Look up by statement id (OrderByItem.id matches StatementElement.id, not the predicate IRI).
    const byStatementId = new Map(orderBy.map(item => [item.id, item]));
    const stmts = searchStateService.currentState.statementElements;
    const findStmt = (predIri: string) => stmts.find(s => s.selectedPredicate?.iri === predIri)!;

    expect(byStatementId.get(findStmt(textPredicate.iri).id)?.disabled).toBe(false);
    expect(byStatementId.get(findStmt(intPredicate.iri).id)?.disabled).toBe(false);
    expect(byStatementId.get(findStmt(linkPredicate.iri).id)?.disabled).toBe(true);
    expect(byStatementId.get(findStmt(listPredicate.iri).id)?.disabled).toBe(true);
  });
});
