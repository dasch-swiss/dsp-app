import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResourceResultService } from '@dasch-swiss/vre/shared/app-helper-services';
import { TranslateModule } from '@ngx-translate/core';
import { DataClassResultMetaComponent } from '../data-class-result-meta.component';

describe('DataClassResultMetaComponent', () => {
  let fixture: ComponentFixture<DataClassResultMetaComponent>;
  let resourceResult: ResourceResultService;

  const vm = () => fixture.componentInstance.vm() as Record<string, unknown>;
  const pagerRendered = () => !!fixture.nativeElement.querySelector('[data-cy=result-pager]');
  const buttons = () =>
    [...fixture.nativeElement.querySelectorAll('[data-cy=result-pager] button')] as HTMLButtonElement[];

  const render = (total: number | null, pageIndex = 0) => {
    resourceResult.numberOfResults = total;
    resourceResult.updatePageIndex(pageIndex);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataClassResultMetaComponent, TranslateModule.forRoot()],
      providers: [ResourceResultService],
    }).compileComponents();

    fixture = TestBed.createComponent(DataClassResultMetaComponent);
    resourceResult = TestBed.inject(ResourceResultService);
  });

  it('reports the range of the current page against the total', () => {
    render(4024, 0);
    expect(vm()).toMatchObject({ rangeStart: 1, rangeEnd: 25, total: 4024, lastPageIndex: 160 });
  });

  it('clamps the range end to the total on a partial last page', () => {
    render(4024, 160);
    // 4024 = 160 full pages + 24. Reporting 4025 here would claim a result that does not exist.
    expect(vm()).toMatchObject({ rangeStart: 4001, rangeEnd: 4024 });
  });

  it('reads 0 – 0 of 0 on an empty result set rather than 1 – 0', () => {
    render(0, 0);
    expect(vm()).toMatchObject({ rangeStart: 0, rangeEnd: 0, total: 0 });
  });

  it('omits the pager when everything fits on one page', () => {
    render(19, 0);
    expect(vm()).toMatchObject({ rangeStart: 1, rangeEnd: 19, hasPages: false });
    expect(pagerRendered()).toBe(false);
  });

  it('renders the end controls disabled rather than hiding them', () => {
    render(4024, 0);
    // A pager that changes width as you reach its edges moves the next target under the cursor.
    expect(buttons().map(b => b.disabled)).toEqual([true, true, false, false]);

    render(4024, 160);
    expect(buttons().map(b => b.disabled)).toEqual([false, false, true, true]);
  });

  it('states the count is unavailable and drops the pager when the count query failed', () => {
    render(null, 0);
    // null is "genuinely unknown", not zero: the pager cannot be sized, so paging goes away until
    // a later load returns a count.
    expect(vm()).toMatchObject({ countUnavailable: true });
    expect(fixture.nativeElement.querySelector('[data-cy=count-unavailable]')).not.toBeNull();
    expect(pagerRendered()).toBe(false);
  });

  it('pages through the shared result service so the list follows', () => {
    render(4024, 0);
    const next = buttons()[2];
    next.click();

    expect(fixture.componentInstance.vm()).toMatchObject({ pageIndex: 1 });
  });

  it('announces the row politely so a filter change is read out', () => {
    render(4024, 0);
    expect(fixture.nativeElement.querySelector('[aria-live]')?.getAttribute('aria-live')).toBe('polite');
  });
});
