import { OverlayContainer } from '@angular/cdk/overlay';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { KnoraDate } from '@dasch-swiss/dsp-js';
import { provideTranslateService } from '@ngx-translate/core';

import { DatePickerComponent } from './date-picker.component';

describe('DatePickerComponent', () => {
  let fixture: ComponentFixture<DatePickerComponent>;
  let component: DatePickerComponent;
  let emitted: (KnoraDate | null)[];
  let overlayContainer: OverlayContainer;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        DatePickerComponent,
        BrowserAnimationsModule,
        MatButtonModule,
        MatButtonToggleModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatSelectModule,
      ],
      providers: [provideTranslateService()],
    }).compileComponents();

    fixture = TestBed.createComponent(DatePickerComponent);
    component = fixture.componentInstance;
    emitted = [];
    component.dateChange.subscribe(d => emitted.push(d));
    overlayContainer = TestBed.inject(OverlayContainer);
  });

  afterEach(() => overlayContainer.ngOnDestroy());

  /**
   * Shows a date with the panel open.
   *
   * The panel is closed at rest and rendered in the CDK overlay container, so every test about what
   * the panel contains has to open it first — which is also the interaction a user performs.
   */
  const show = (date: KnoraDate | null, calendar = 'GREGORIAN') => {
    fixture.componentRef.setInput('date', date);
    fixture.componentRef.setInput('calendar', calendar);
    fixture.detectChanges();
    if (!panel()) {
      field()?.click();
      fixture.detectChanges();
    }
  };

  /** The panel lives in the overlay container, outside the fixture's own element. */
  const overlay = () => overlayContainer.getContainerElement();
  const panel = () => overlay().querySelector<HTMLElement>('[data-cy="date-picker-panel"]');
  const field = () => (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('[data-cy="date-field"]');

  const el = (hook: string) =>
    (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(`[data-cy="${hook}"]`) ??
    overlay().querySelector<HTMLElement>(`[data-cy="${hook}"]`);
  const dayCells = () =>
    Array.from(overlay().querySelectorAll('[data-cy^="day-"]')).map(e => Number(e.textContent?.trim()));
  const selectedDay = () => overlay().querySelector('.day-cell.is-selected')?.textContent?.trim();

  /** What a click on the grid does. */
  const clickDay = (day: number) => {
    el(`day-${day}`)?.click();
    fixture.detectChanges();
  };

  describe('showing the date it is given', () => {
    it('renders the month it was handed', () => {
      show(new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15));

      expect(dayCells()).toContain(30);
      expect(dayCells()).not.toContain(31);
    });

    it('marks the given day as selected', () => {
      show(new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15));

      expect(selectedDay()).toBe('15');
    });

    it('renders the calendar it was told, not one it chose', () => {
      show(new KnoraDate('JULIAN', 'CE', 2024, 6, 15), 'JULIAN');

      expect(el('calendar-tag')?.textContent).toContain('JULIAN');
    });
  });

  describe('it never changes the calendar', () => {
    // The defect this component exists to make unreachable. It has no code path that writes a
    // calendar: whatever it emits carries the calendar it was given.
    it('emits in the calendar it was told, whatever the user does', () => {
      show(new KnoraDate('JULIAN', 'CE', 2024, 6, 15), 'JULIAN');

      clickDay(20);

      expect(emitted.at(-1)?.calendar).toBe('JULIAN');
    });

    it('does not convert when the calendar input changes — that is the owner’s job', () => {
      show(new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15));
      const before = emitted.length;

      fixture.componentRef.setInput('calendar', 'JULIAN');
      fixture.detectChanges();

      // No emission, and no silent rewriting of the numerals under a new name.
      expect(emitted.length).toBe(before);
    });
  });

  describe('it emits only on user intent', () => {
    it('says nothing when its inputs change', () => {
      show(new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15));

      expect(emitted.length).toBe(0);
    });

    it('emits once for one click', () => {
      show(new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15));

      clickDay(20);

      expect(emitted.length).toBe(1);
    });

    it('emits once when a new date is pushed in and then edited', () => {
      show(new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15));
      show(new KnoraDate('GREGORIAN', 'CE', 2024, 7, 1));

      clickDay(5);

      expect(emitted.length).toBe(1);
    });
  });

  describe('a day the month cannot hold', () => {
    // Derived rather than stored, so it is never displayed and never emitted — there is no guard
    // to forget, because there is no writable "selected day" to go stale.
    it('is not shown as selected', () => {
      show(new KnoraDate('GREGORIAN', 'CE', 2024, 1, 31));
      fixture.componentRef.setInput('date', new KnoraDate('GREGORIAN', 'CE', 2024, 2, 31));
      fixture.detectChanges();

      expect(selectedDay()).toBeUndefined();
    });

    it('degrades to month precision rather than inventing a different day', () => {
      show(new KnoraDate('GREGORIAN', 'CE', 2024, 1, 31));

      el('month-select');
      component['onMonthChange'](2);
      fixture.detectChanges();

      expect(emitted.at(-1)?.day).toBeUndefined();
      expect(emitted.at(-1)?.month).toBe(2);
    });

    it('keeps a day the new month can hold', () => {
      show(new KnoraDate('GREGORIAN', 'CE', 2024, 1, 29));

      component['onMonthChange'](3);
      fixture.detectChanges();

      expect(emitted.at(-1)?.day).toBe(29);
    });
  });

  describe('precision', () => {
    it('drops to month precision when the user asks for no day', () => {
      show(new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15));

      // June 2024 ends on a Sunday, so the affordance is in the overflow row rather than the last
      // week — which is exactly why both placements exist.
      (el('no-day') ?? el('no-day-overflow'))?.click();
      fixture.detectChanges();

      expect(emitted.at(-1)?.day).toBeUndefined();
      expect(emitted.at(-1)?.month).toBe(6);
    });

    it('drops to year precision, day included, when the user asks for year precision', () => {
      show(new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15));

      el('year-precision')!.click();
      fixture.detectChanges();

      expect([emitted.at(-1)?.year, emitted.at(-1)?.month, emitted.at(-1)?.day]).toEqual([2024, undefined, undefined]);
    });

    // The button sits in the day-grid block that year precision removes.
    it('keeps focus in the panel when dropping to year precision', () => {
      show(new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15));

      el('year-precision')!.click();
      fixture.detectChanges();

      expect(document.activeElement).toBe(overlay().querySelector('[data-cy="month-select"]'));
    });

    it('offers year precision only while there is a month to drop', () => {
      show(new KnoraDate('GREGORIAN', 'CE', 2024));

      expect(el('year-precision')).toBeNull();
    });

    it('asks for the year before the month', () => {
      show(new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15));

      const year = el('year-input')!;
      const month = el('month-select')!;
      expect(year.compareDocumentPosition(month) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('offers a no-day affordance even when the month fills its last row', () => {
      // A month ending on a Sunday leaves no spare cell, so the affordance needs its own row.
      show(new KnoraDate('GREGORIAN', 'CE', 2024, 3, 1));

      expect(el('no-day') ?? el('no-day-overflow')).not.toBeNull();
    });
  });

  describe('era', () => {
    it('offers the era toggle for Gregorian', () => {
      show(new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15));

      expect(el('era-toggle')).not.toBeNull();
    });

    it('omits it for Islamic, which has no era', () => {
      show(new KnoraDate('ISLAMIC', 'noEra', 1445, 12, 8), 'ISLAMIC');

      expect(el('era-toggle')).toBeNull();
    });

    it('emits noEra for an Islamic date', () => {
      show(new KnoraDate('ISLAMIC', 'noEra', 1445, 12, 8), 'ISLAMIC');

      clickDay(10);

      expect(emitted.at(-1)?.era).toBe('noEra');
    });

    it('replaces the weekday header with the BCE warning', () => {
      show(new KnoraDate('JULIAN', 'BCE', 44, 3, 15), 'JULIAN');

      expect(el('bce-warning')).not.toBeNull();
    });
  });

  describe('the grid it renders', () => {
    // Proleptic, as in dsp-api: the ten days the reform skipped can be picked, and are marked.
    it('offers and marks the ten days the Gregorian reform skipped', () => {
      show(new KnoraDate('GREGORIAN', 'CE', 1582, 10, 1));

      expect(dayCells()).toContain(5);
      expect(el('day-5')!.classList).toContain('is-reform-gap');
      expect(el('day-14')!.classList).toContain('is-reform-gap');
      expect(el('day-4')!.classList).not.toContain('is-reform-gap');
      expect(el('day-15')!.classList).not.toContain('is-reform-gap');
    });

    it('marks nothing in the Julian October 1582', () => {
      show(new KnoraDate('JULIAN', 'CE', 1582, 10, 1), 'JULIAN');

      expect(el('day-5')!.classList).not.toContain('is-reform-gap');
    });

    it('shows Islamic month names when the calendar is Islamic', () => {
      show(new KnoraDate('ISLAMIC', 'noEra', 1445, 1, 1), 'ISLAMIC');

      expect(panel()!.textContent).not.toContain('Jan');
    });
  });

  // The panel used to render inline and always open. Two of them stacked into a column, and low in
  // a property list the lower one ran off the bottom of the screen.
  describe('opening and closing', () => {
    const openPanel = () => {
      field()!.click();
      fixture.detectChanges();
    };

    it('shows no panel until the field is clicked', () => {
      fixture.detectChanges();

      expect(panel()).toBeNull();
    });

    it('opens the panel on a click on the field', () => {
      fixture.detectChanges();
      openPanel();

      expect(panel()).not.toBeNull();
    });

    it('closes again on a second click', () => {
      fixture.detectChanges();
      openPanel();
      openPanel();

      expect(panel()).toBeNull();
    });

    it('closes on Done', () => {
      show(new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15));

      el('done-button')!.click();
      fixture.detectChanges();

      expect(panel()).toBeNull();
    });

    // Today is a commit, not a navigation, so it ends the interaction like Done does.
    it('closes on Today', () => {
      show(new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15));

      el('today-button')!.click();
      fixture.detectChanges();

      expect(panel()).toBeNull();
    });

    it('does not open while disabled', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();

      field()!.click();
      fixture.detectChanges();

      expect(panel()).toBeNull();
    });
  });

  // An empty picker shows the current year and month, in the grid and in the controls, without
  // entering them: a seeded draft is indistinguishable from an entry, so an era switch would publish
  // a date nobody typed.
  describe('opening an empty picker', () => {
    const openEmpty = () => {
      fixture.detectChanges();
      field()!.click();
      fixture.detectChanges();
    };

    const monthSelect = () => overlay().querySelector<HTMLSelectElement>('[data-cy="month-select"]');

    it('offers a month grid straight away', () => {
      openEmpty();

      expect(dayCells().length).toBeGreaterThan(0);
    });

    it('emits nothing, because the user has not chosen a date', () => {
      openEmpty();

      expect(emitted).toEqual([]);
    });

    it('selects no day, leaving that to the user', () => {
      openEmpty();

      expect(selectedDay()).toBeUndefined();
    });

    it('leaves the field showing its placeholder', () => {
      openEmpty();

      expect(field()!.querySelector('.is-placeholder')).not.toBeNull();
    });

    // The controls name the month the grid is offering, so the panel is transparent about it.
    const today = () => new Date();

    it('shows the current month in the select', () => {
      openEmpty();

      expect(monthSelect()!.value).toBe(String(today().getMonth() + 1));
    });

    it('shows the current year in the input', () => {
      openEmpty();

      expect(overlay().querySelector<HTMLInputElement>('[data-cy="year-input"]')!.value).toBe(
        String(today().getFullYear())
      );
    });

    it('adopts the shown year when a month is chosen', () => {
      openEmpty();

      monthSelect()!.value = '3';
      monthSelect()!.dispatchEvent(new Event('change'));
      fixture.detectChanges();

      const published = emitted[emitted.length - 1]!;
      expect([published.year, published.month, published.day]).toEqual([today().getFullYear(), 3, undefined]);
    });

    // The reported sequence: open the picker, switch to BCE, choose no day precision. The seeded
    // month and year rode along and were published as a date the user never entered.
    it('publishes nothing when only the era is switched', () => {
      openEmpty();

      el('era-BCE')!.click();
      fixture.detectChanges();

      expect(emitted).toEqual([null]);
    });

    it('marks the suggested year and month, for the eye and for a screen reader', () => {
      openEmpty();

      const year = overlay().querySelector<HTMLInputElement>('[data-cy="year-input"]')!;
      expect(year.classList).toContain('is-suggested');
      const note = document.getElementById(year.getAttribute('aria-describedby')!);
      expect(note?.textContent).toContain('suggestedMonth');
    });

    // Refilling a cleared year with the current one turned the next keystroke into "20261".
    it('does not refill a cleared year with the current one', () => {
      openEmpty();
      const year = overlay().querySelector<HTMLInputElement>('[data-cy="year-input"]')!;

      year.value = '1850';
      year.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      year.value = '';
      year.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(year.value).toBe('');
      expect(year.classList).not.toContain('is-suggested');
    });

    it('still only shows the month after an era switch', () => {
      openEmpty();

      el('era-BCE')!.click();
      fixture.detectChanges();

      expect(monthSelect()!.value).toBe(String(today().getMonth() + 1));
      expect(field()!.querySelector('.is-placeholder')).not.toBeNull();
    });

    // The fallback grid is only a starting point until a day is clicked; then it is the entry.
    it('adopts the month it was showing when a day is picked', () => {
      openEmpty();

      // `dayCells()` reads the rendered cells, which start with blanks before the first weekday.
      const firstDay = dayCells().find(d => d > 0)!;
      clickDay(firstDay);

      const published = emitted[emitted.length - 1];
      expect(published).not.toBeNull();
      expect(published!.day).toBe(firstDay);
      expect(published!.month).not.toBeUndefined();
      expect(published!.year).toBeGreaterThan(0);
    });

    it('does not overwrite a date it was given', () => {
      show(new KnoraDate('GREGORIAN', 'CE', 1999, 3, 7));

      expect(selectedDay()).toBe('7');
    });
  });

  // A year with no month is a legitimate precision, and the panel has to say so rather than
  // showing a grid for a month the user has not chosen.
  describe('a year with no month', () => {
    const openWith = (year: string) => {
      fixture.detectChanges();
      field()!.click();
      fixture.detectChanges();
      const input = overlay().querySelector<HTMLInputElement>('[data-cy="year-input"]')!;
      input.value = year;
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    };

    it('shows no day grid', () => {
      openWith('1850');

      expect(el('day-grid')!.querySelector('.day-grid')).toBeNull();
    });

    it('explains that a month is needed to pick a day', () => {
      openWith('1850');

      expect(el('year-precision-note')).not.toBeNull();
    });

    it('publishes the year on its own', () => {
      openWith('1850');

      const published = emitted[emitted.length - 1];
      expect(published!.year).toBe(1850);
      expect(published!.month).toBeUndefined();
    });
  });

  // "M T W T F S S" is English. German runs M D M D F S S and French L M M J V S D, so a
  // hardcoded header mislabels every column for most of the app's languages.
  describe('the weekday header', () => {
    it('renders seven columns', () => {
      show(new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15));

      expect(overlay().querySelectorAll('.weekday').length).toBe(7);
    });

    it('reads its labels from translation keys rather than hardcoded letters', () => {
      show(new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15));

      // No catalogue in jsdom, so the key itself renders — which is the proof that it goes
      // through translation at all. Storybook asserts the translated letters.
      const labels = Array.from(overlay().querySelectorAll('.weekday')).map(e => e.textContent?.trim());
      expect(labels[0]).toBe('ui.weekdays.monday.short');
      expect(labels[6]).toBe('ui.weekdays.sunday.short');
    });
  });

  // The owner converts a value and hands the picker a new `date`. Until this was fixed, a picker
  // the user had already typed into ignored it: `_draft` shadowed the input for the component's
  // life, so the field kept showing the pre-conversion date while the value underneath had moved.
  describe('being handed a converted date after the user has edited', () => {
    it('shows the date it was given, not the one the user typed', () => {
      show(new KnoraDate('GREGORIAN', 'CE', 2026, 9, 3));
      clickDay(3);

      // What the owner does on a calendar switch: converts and passes the result back.
      fixture.componentRef.setInput('calendar', 'JULIAN');
      fixture.componentRef.setInput('date', new KnoraDate('JULIAN', 'CE', 2026, 8, 21));
      fixture.detectChanges();

      expect(field()!.textContent).toContain('21.08.2026');
    });

    it('marks the converted day in the grid', () => {
      show(new KnoraDate('GREGORIAN', 'CE', 2026, 9, 3));
      clickDay(3);

      fixture.componentRef.setInput('calendar', 'JULIAN');
      fixture.componentRef.setInput('date', new KnoraDate('JULIAN', 'CE', 2026, 8, 21));
      fixture.detectChanges();

      expect(selectedDay()).toBe('21');
    });

    it('keeps the user editing from the converted date', () => {
      show(new KnoraDate('GREGORIAN', 'CE', 2026, 9, 3));
      clickDay(3);

      fixture.componentRef.setInput('calendar', 'JULIAN');
      fixture.componentRef.setInput('date', new KnoraDate('JULIAN', 'CE', 2026, 8, 21));
      fixture.detectChanges();

      clickDay(22);

      const published = emitted[emitted.length - 1];
      expect([published!.day, published!.month, published!.year]).toEqual([22, 8, 2026]);
    });
  });

  // A lone date inside a row of selects has nowhere to put a calendar control: stacking one above
  // the field made that column twice the height of its neighbours. The panel can hold it instead.
  describe('offering the calendar in the panel', () => {
    const selector = () => overlay().querySelector('app-calendar-selector');

    it('offers no calendar by default, since most owners keep the choice', () => {
      show(new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15));

      expect(selector()).toBeNull();
    });

    it('offers one when the owner asks for it', () => {
      fixture.componentRef.setInput('showsCalendarSelector', true);
      show(new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15));

      expect(selector()).not.toBeNull();
    });

    // The tag and the selector would otherwise name the same calendar twice.
    it('drops the calendar tag, which the selector now names', () => {
      fixture.componentRef.setInput('showsCalendarSelector', true);
      show(new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15));

      expect(el('calendar-tag')).toBeNull();
    });

    it('keeps the tag when the owner keeps the choice', () => {
      show(new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15));

      expect(el('calendar-tag')).not.toBeNull();
    });

    // The invariant the rewrite exists to protect: this component reports a calendar and is told
    // one. It must not convert, and must not write its own `calendar`.
    it('reports the choice without changing the date it holds', () => {
      fixture.componentRef.setInput('showsCalendarSelector', true);
      show(new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15));

      const reported: string[] = [];
      component.calendarChange.subscribe(c => reported.push(c));

      el('calendar-option-JULIAN')!.click();
      fixture.detectChanges();

      expect(reported).toEqual(['JULIAN']);
      // Still showing what it was given: the owner converts and hands a new date back.
      expect(selectedDay()).toBe('15');
      expect(emitted).toEqual([]);
    });
  });

  describe('the closed field', () => {
    it('shows the date it was given', () => {
      fixture.componentRef.setInput('date', new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15));
      fixture.detectChanges();

      expect(field()!.textContent).toContain('15.06.2024');
    });

    it('invites a click when there is no date yet', () => {
      fixture.detectChanges();

      expect(field()!.querySelector('.is-placeholder')).not.toBeNull();
    });

    // The two ends of a period are only distinguishable if each field says which one it is.
    it('names itself when it was given a label', () => {
      fixture.componentRef.setInput('label', 'ui.datePicker.endDate');
      fixture.detectChanges();

      expect(el('date-field-caption')).not.toBeNull();
    });

    it('carries no caption when it is the only date', () => {
      fixture.detectChanges();

      expect(el('date-field-caption')).toBeNull();
    });
  });

  describe('it holds no second copy of the date', () => {
    it('has no FormGroup', () => {
      expect((component as unknown as { form?: unknown }).form).toBeUndefined();
    });

    it('leaves the date it was given untouched', () => {
      const given = new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15);
      show(given);

      clickDay(20);

      expect(given.day).toBe(15);
    });
  });
});
