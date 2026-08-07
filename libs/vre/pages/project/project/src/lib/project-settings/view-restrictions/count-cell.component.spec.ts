import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { CountCellComponent, normaliseCounts } from './count-cell.component';

/**
 * The API does not send one shape. `totals` arrives flat as `{hidden, restrictedView}`, while
 * `groups[].counts` still nests the figures under `resources` and `items`. A cell that understood only
 * one of them rendered a dash over live data, so both paths are pinned here.
 */
describe('normaliseCounts', () => {
  it('passes a flat payload through unchanged', () => {
    expect(normaliseCounts({ hidden: 15, restrictedView: 33 })).toEqual({ hidden: 15, restrictedView: 33 });
  });

  it('sums the two units of a nested payload, per state', () => {
    expect(
      normaliseCounts({ resources: { hidden: 7, restrictedView: 3 }, items: { hidden: 12, restrictedView: 4 } })
    ).toEqual({ hidden: 19, restrictedView: 7 });
  });

  it('treats a missing unit as zero rather than NaN', () => {
    expect(normaliseCounts({ items: { hidden: 3, restrictedView: 1 } })).toEqual({ hidden: 3, restrictedView: 1 });
    expect(normaliseCounts({ resources: { hidden: 2, restrictedView: 0 } })).toEqual({ hidden: 2, restrictedView: 0 });
  });

  it('returns undefined for a missing payload', () => {
    expect(normaliseCounts(undefined)).toBeUndefined();
  });
});

describe('CountCellComponent', () => {
  let fixture: ComponentFixture<CountCellComponent>;

  const text = () => fixture.nativeElement.textContent.replace(/\s+/g, ' ').trim();

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CountCellComponent],
      providers: [provideTranslateService()],
    }).compileComponents();
    fixture = TestBed.createComponent(CountCellComponent);
  });

  it('renders both states of a flat payload', () => {
    fixture.componentInstance.counts = { hidden: 15, restrictedView: 33 };
    fixture.detectChanges();
    expect(text()).toContain('15');
    expect(text()).toContain('33');
  });

  it('renders a nested payload rather than blanking the cell', () => {
    fixture.componentInstance.counts = {
      resources: { hidden: 7, restrictedView: 3 },
      items: { hidden: 12, restrictedView: 4 },
    };
    fixture.detectChanges();
    expect(text()).toContain('19');
    expect(text()).toContain('7');
  });

  // A zero state renders nothing at all, so a cell with one non-zero state shows exactly one figure.
  it('omits a state whose count is zero', () => {
    fixture.componentInstance.counts = { hidden: 5, restrictedView: 0 };
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.count-hidden')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.count-restricted')).toBeNull();
  });

  it('renders a dash when nothing is restricted', () => {
    fixture.componentInstance.counts = { hidden: 0, restrictedView: 0 };
    fixture.detectChanges();
    expect(text()).toBe('–');
  });
});
