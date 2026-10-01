import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';
import { DataClassLabelHeaderComponent } from '../data-class-label-header.component';
import { DataClassUrlStateService } from '../data-class-url-state.service';

describe('DataClassLabelHeaderComponent', () => {
  let fixture: ComponentFixture<DataClassLabelHeaderComponent>;
  let sortDescending$: BehaviorSubject<boolean>;
  let setSortDescending: jest.Mock;

  const header = () => fixture.nativeElement.querySelector('[role="columnheader"]') as HTMLElement;
  const button = () => fixture.nativeElement.querySelector('[data-cy="label-sort-toggle"]') as HTMLButtonElement;

  beforeEach(async () => {
    sortDescending$ = new BehaviorSubject(false);
    setSortDescending = jest.fn();

    await TestBed.configureTestingModule({
      imports: [DataClassLabelHeaderComponent, TranslateModule.forRoot()],
      providers: [{ provide: DataClassUrlStateService, useValue: { sortDescending$, setSortDescending } }],
    }).compileComponents();

    fixture = TestBed.createComponent(DataClassLabelHeaderComponent);
    fixture.detectChanges();
  });

  it('exposes the current direction as aria-sort', () => {
    expect(header().getAttribute('aria-sort')).toBe('ascending');

    sortDescending$.next(true);
    fixture.detectChanges();

    expect(header().getAttribute('aria-sort')).toBe('descending');
  });

  it('names the next action, not the current state', () => {
    // Ascending now, so activating it sorts descending. A name describing the current state would
    // tell a screen-reader user the opposite of what the button is about to do.
    expect(button().getAttribute('aria-label')).toBe('pages.dataBrowser.labelHeader.sortDescending');

    sortDescending$.next(true);
    fixture.detectChanges();

    expect(button().getAttribute('aria-label')).toBe('pages.dataBrowser.labelHeader.sortAscending');
  });

  it('toggles the direction through the URL state', () => {
    button().click();
    expect(setSortDescending).toHaveBeenCalledWith(true);

    sortDescending$.next(true);
    fixture.detectChanges();
    button().click();

    expect(setSortDescending).toHaveBeenLastCalledWith(false);
  });

  it('keeps focus on the toggle across the re-render a sort causes', () => {
    button().focus();
    expect(document.activeElement).toBe(button());

    // The direction changing re-renders the icon, the direction text and the accessible name. If the
    // button were inside the branch that swaps on re-query it would be destroyed here and focus
    // would fall back to <body>, stranding a keyboard user mid-sort.
    sortDescending$.next(true);
    fixture.detectChanges();

    expect(document.activeElement).toBe(button());
  });
});
