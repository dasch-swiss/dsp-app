import { TestBed } from '@angular/core/testing';
import { StatementElement, IriLabelPair } from '../model';
import { SearchStateService } from './search-state.service';

describe('SearchStateService', () => {
  let service: SearchStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SearchStateService],
    });
    service = TestBed.inject(SearchStateService);
  });

  describe('Observable Emissions', () => {
    it('should emit selectedResourceClass$ when state changes', done => {
      const testResourceClass: IriLabelPair = { iri: 'http://test.org/class', label: 'Test Class' };
      let emissionCount = 0;

      service.selectedResourceClass$.subscribe(resourceClass => {
        emissionCount++;
        if (emissionCount === 1) {
          expect(resourceClass).toBeUndefined(); // Initial state
        } else if (emissionCount === 2) {
          expect(resourceClass).toEqual(testResourceClass);
          done();
        }
      });

      service.patchState({ selectedResourceClass: testResourceClass });
    });

    it('should emit statementElements$ when state changes', done => {
      const newStatement = new StatementElement();
      let emissionCount = 0;

      service.statementElements$.subscribe(elements => {
        emissionCount++;
        if (emissionCount === 1) {
          expect(elements.length).toBe(1); // Initial state with startWith
        } else if (emissionCount === 2) {
          expect(elements.length).toBe(1); // After patch, still has 1 from current state
          done();
        }
      });

      // Patch with a different number of elements to trigger emission
      service.patchState({ statementElements: [newStatement] });
    });
  });
});
