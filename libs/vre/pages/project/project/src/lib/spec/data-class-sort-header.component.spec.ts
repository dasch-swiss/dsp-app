import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Constants } from '@dasch-swiss/dsp-js';
import { OntologyDataService, Predicate, RDFS_LABEL } from '@dasch-swiss/vre/pages/search/search-filters';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, of } from 'rxjs';
import { DataClassSortHeaderComponent } from '../data-class-sort-header.component';
import { DataClassUrlStateService } from '../data-class-url-state.service';

const ONTO = 'http://0.0.0.0:3333/ontology/0001/test/v2';
const CREATOR = `${ONTO}#hasCreator`;
const label = (value: string) => [{ value, language: 'en' }] as Predicate['labels'];

describe('DataClassSortHeaderComponent', () => {
  let fixture: ComponentFixture<DataClassSortHeaderComponent>;
  let sortDescending$: BehaviorSubject<boolean>;
  let sortPredicateIri$: BehaviorSubject<string>;
  let setSort: jest.Mock;

  const header = () => fixture.nativeElement.querySelector('[role="columnheader"]') as HTMLElement;
  const trigger = () => fixture.nativeElement.querySelector('[data-cy=sort-property-trigger]') as HTMLButtonElement;
  const direction = () => fixture.nativeElement.querySelector('[data-cy=sort-direction-toggle]') as HTMLButtonElement;

  const properties: Predicate[] = [
    new Predicate(RDFS_LABEL, label('Label'), Constants.TextValue, false),
    new Predicate(CREATOR, label('Creator'), Constants.TextValue, false),
    // Neither is meaningfully orderable, and advanced search excludes both from its own options.
    new Predicate(`${ONTO}#partOf`, label('Part of'), `${ONTO}#Book`, true),
    new Predicate(`${ONTO}#category`, label('Category'), Constants.ListValue, false),
  ];

  beforeEach(async () => {
    sortDescending$ = new BehaviorSubject(false);
    sortPredicateIri$ = new BehaviorSubject<string>(RDFS_LABEL);
    setSort = jest.fn();

    await TestBed.configureTestingModule({
      imports: [DataClassSortHeaderComponent, TranslateModule.forRoot()],
      providers: [
        {
          provide: DataClassUrlStateService,
          useValue: { sortDescending$, sortPredicateIri$, resourceClassIri$: of(`${ONTO}#Book`), setSort },
        },
        { provide: OntologyDataService, useValue: { getProperties$: () => of(properties) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DataClassSortHeaderComponent);
    fixture.detectChanges();
  });

  it('offers the class properties, minus the ones that cannot be ordered', () => {
    const offered = fixture.componentInstance.sortOptions().map(o => o.label);
    expect(offered).toEqual(['Label', 'Creator']);
  });

  it('shows the property currently sorted by', () => {
    expect(trigger().textContent).toContain('Label');

    sortPredicateIri$.next(CREATOR);
    fixture.detectChanges();

    expect(trigger().textContent).toContain('Creator');
  });

  it('exposes the direction as aria-sort and names the next action', () => {
    expect(header().getAttribute('aria-sort')).toBe('ascending');
    expect(direction().getAttribute('aria-label')).toBe('pages.dataBrowser.sortHeader.sortDescending');

    sortDescending$.next(true);
    fixture.detectChanges();

    expect(header().getAttribute('aria-sort')).toBe('descending');
    expect(direction().getAttribute('aria-label')).toBe('pages.dataBrowser.sortHeader.sortAscending');
  });

  it('toggles direction while keeping the property', () => {
    sortPredicateIri$.next(CREATOR);
    fixture.detectChanges();

    direction().click();

    expect(setSort).toHaveBeenCalledWith(CREATOR, true);
  });

  it('keeps the direction when the property changes', () => {
    sortDescending$.next(true);
    fixture.detectChanges();

    fixture.componentInstance.selectProperty(CREATOR);

    // Switching property is not a reason to silently re-sort ascending under the user.
    expect(setSort).toHaveBeenCalledWith(CREATOR, true);
  });

  it('keeps focus on the direction toggle across the re-render', () => {
    direction().focus();
    sortDescending$.next(true);
    fixture.detectChanges();

    expect(document.activeElement).toBe(direction());
  });
});
