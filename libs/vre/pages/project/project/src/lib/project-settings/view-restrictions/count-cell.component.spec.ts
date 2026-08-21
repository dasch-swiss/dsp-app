import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ItemType, UnitCounts } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { provideTranslateService } from '@ngx-translate/core';
import { CountCellComponent } from './count-cell.component';

/**
 * Hosts the cell through a real template binding. The cell is `OnPush`, so assigning to the instance
 * directly never marks its view dirty — only a binding does, which is also how the page drives it when
 * the user changes the item-type chip.
 */
@Component({
  imports: [CountCellComponent],
  template: `<app-count-cell [counts]="counts" [itemType]="itemType" />`,
})
class HostComponent {
  counts: UnitCounts | undefined;
  itemType: ItemType = ItemType.All;
}

describe('CountCellComponent', () => {
  let fixture: ComponentFixture<CountCellComponent>;

  const text = () => fixture.nativeElement.textContent.replace(/\s+/g, ' ').trim();
  const render = (counts: unknown, itemType: ItemType) => {
    fixture.componentInstance.counts = counts as never;
    fixture.componentInstance.itemType = itemType;
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CountCellComponent],
      providers: [provideTranslateService()],
    }).compileComponents();
    fixture = TestBed.createComponent(CountCellComponent);
  });

  // The live payload that exposed the resources-only rule: filtering by Value returns findings in the
  // items unit and nothing in resources, so a resources-only cell rendered a dash over a real finding.
  it('reports the items unit when the filter is item-level', () => {
    render({ resources: { hidden: 0, restrictedView: 0 }, items: { hidden: 1, restrictedView: 0 } }, ItemType.Value);
    expect(text()).toContain('1');
    expect(fixture.nativeElement.querySelector('.count-hidden')).not.toBeNull();
  });

  it('reports the resources unit when the filter is Resource', () => {
    render(
      { resources: { hidden: 15, restrictedView: 4 }, items: { hidden: 99, restrictedView: 99 } },
      ItemType.Resource
    );
    expect(text()).toContain('15');
    expect(text()).toContain('4');
    // the items unit is out of scope for this filter and must not leak in
    expect(text()).not.toContain('99');
  });

  // Both units are in scope in the combined view, so both lines render — never added together.
  it('reports both units on separate lines when the filter is All', () => {
    render({ resources: { hidden: 15, restrictedView: 0 }, items: { hidden: 22, restrictedView: 0 } }, ItemType.All);
    expect(fixture.nativeElement.querySelectorAll('.count-line').length).toBe(2);
    expect(text()).toContain('15');
    expect(text()).toContain('22');
    // 37 would be the summed figure the API documents as meaningless
    expect(text()).not.toContain('37');
  });

  // Only the combined view needs to say which unit a line counts; a single-unit cell is unambiguous.
  it('labels the units in the combined view', () => {
    render({ resources: { hidden: 1, restrictedView: 0 }, items: { hidden: 1, restrictedView: 0 } }, ItemType.All);
    expect(fixture.nativeElement.querySelectorAll('.unit-icon').length).toBe(2);
  });

  it('does not label the unit when only one is in scope', () => {
    render({ resources: { hidden: 1, restrictedView: 0 }, items: { hidden: 1, restrictedView: 0 } }, ItemType.Value);
    expect(fixture.nativeElement.querySelectorAll('.unit-icon').length).toBe(0);
  });

  // A zero state renders nothing, so a cell with one non-zero state shows exactly one figure.
  it('omits a state whose count is zero', () => {
    render({ resources: { hidden: 5, restrictedView: 0 }, items: { hidden: 0, restrictedView: 0 } }, ItemType.Resource);
    expect(fixture.nativeElement.querySelector('.count-hidden')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.count-restricted')).toBeNull();
  });

  it('renders a dash when the unit in scope has nothing to report', () => {
    render({ resources: { hidden: 0, restrictedView: 0 }, items: { hidden: 4, restrictedView: 0 } }, ItemType.Resource);
    expect(text()).toBe('–');
  });

  it('renders a dash when the audience has no counts at all', () => {
    render(undefined, ItemType.All);
    expect(text()).toBe('–');
  });

  // Changing the chip must re-render the cells. The cell is OnPush, so this only holds if the filter
  // arrives as a binding — an earlier version took it through a setter and left stale numbers on screen.
  it('switches unit when the item-type filter changes', async () => {
    await TestBed.resetTestingModule()
      .configureTestingModule({ imports: [HostComponent], providers: [provideTranslateService()] })
      .compileComponents();
    const host = TestBed.createComponent(HostComponent);
    host.componentInstance.counts = {
      resources: { hidden: 15, restrictedView: 0 },
      items: { hidden: 1, restrictedView: 0 },
    };
    host.componentInstance.itemType = ItemType.Resource;
    host.detectChanges();
    const hostText = () => host.nativeElement.textContent.replace(/\s+/g, ' ').trim();
    expect(hostText()).toContain('15');

    host.componentInstance.itemType = ItemType.Value;
    host.detectChanges();
    expect(hostText()).toContain('1');
    expect(hostText()).not.toContain('15');
  });
});
