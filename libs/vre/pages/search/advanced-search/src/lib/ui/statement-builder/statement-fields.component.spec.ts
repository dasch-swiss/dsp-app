import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Constants } from '@dasch-swiss/dsp-js';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { StatementElement } from '../../model';
import { Operator } from '../../operators.config';
import { DerivedSearchStateService } from '../../service/derived-search-state.service';
import { StatementDraftStore } from '../../service/statement-draft.store';
import { makePredicate } from '../../testing/test-data-builders';
import { ComparisonOperatorComponent } from './assertions/comparison-operator.component';
import { PredicateSelectComponent } from './assertions/predicate-select.component';
import { StatementFieldsComponent } from './statement-fields.component';

/**
 * The value input and the statement it writes to, wired together through the real draft store: an
 * invalid value is stored as undefined and comes back down as the input's `value`, which the input
 * must not apply over what the user typed (DEV-7441).
 */
describe('StatementFieldsComponent value round trip', () => {
  let fixture: ComponentFixture<StatementFieldsComponent>;
  let statement: StatementElement;

  const input = (): HTMLInputElement => fixture.nativeElement.querySelector('input');
  const type = (value: string) => {
    input().value = value;
    input().dispatchEvent(new Event('input'));
    jest.advanceTimersByTime(400);
    fixture.detectChanges();
  };

  beforeEach(() => {
    jest.useFakeTimers();
    TestBed.configureTestingModule({
      imports: [StatementFieldsComponent, TranslateModule.forRoot()],
      providers: [
        provideNoopAnimations(),
        StatementDraftStore,
        {
          provide: DerivedSearchStateService,
          useValue: { searchState$: of({ resourceClass: null, statements: [], orderByItems: [] }) },
        },
      ],
    });
    // Only the value input is under test; the predicate and operator pickers need the ontology pipeline.
    TestBed.overrideComponent(StatementFieldsComponent, {
      remove: { imports: [PredicateSelectComponent, ComparisonOperatorComponent] },
      add: { schemas: [NO_ERRORS_SCHEMA] },
    });

    statement = TestBed.inject(StatementDraftStore).addBlankStatement();
    statement.selectedPredicate = makePredicate('http://ex.org/hasTitle', 'Title', Constants.TextValue, false);
    statement.selectedOperator = Operator.IsLike;

    fixture = TestBed.createComponent(StatementFieldsComponent);
    fixture.componentInstance.statement = statement;
    fixture.detectChanges();
  });

  afterEach(() => jest.useRealTimers());

  it('keeps an invalid "is like" pattern typed over a valid one, and says why', () => {
    type('.*MAL.*');
    expect(statement.selectedObjectValue).toBe('.*MAL.*');

    type('*MAL*');
    input().dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(input().value).toBe('*MAL*');
    expect(statement.selectedObjectValue).toBeUndefined();
    expect(fixture.nativeElement.querySelector('mat-error')?.textContent?.trim()).toBe(
      'pages.search.advancedSearch.errors.invalidRegex'
    );
  });
});
