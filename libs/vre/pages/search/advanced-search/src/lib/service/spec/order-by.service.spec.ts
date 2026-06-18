import { TestBed } from '@angular/core/testing';
import { Constants } from '@dasch-swiss/dsp-js';
import { firstValueFrom } from 'rxjs';
import { OrderByItem, StatementElement } from '../../model';
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
  (statement.selectedPredicate as any)._labels = labels;
  Object.defineProperty(statement.selectedPredicate, 'labels', {
    get: () => labels,
    configurable: true,
  });
  statement.selectedOperator = Operator.Equals;
  statement.selectedObjectValue = 'test';
  return statement;
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
      expect(entry!.isLinkProperty).toBe(false);
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
