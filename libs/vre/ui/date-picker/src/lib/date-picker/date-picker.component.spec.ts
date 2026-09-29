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
  });

  const show = (date: KnoraDate | null, calendar = 'GREGORIAN') => {
    fixture.componentRef.setInput('date', date);
    fixture.componentRef.setInput('calendar', calendar);
    fixture.detectChanges();
  };

  const el = (hook: string) => (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(`[data-cy="${hook}"]`);
  const dayCells = () =>
    Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('[data-cy^="day-"]')).map(e =>
      Number(e.textContent?.trim())
    );
  const selectedDay = () =>
    (fixture.nativeElement as HTMLElement).querySelector('.day.selected .selectable')?.textContent?.trim();

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
    it('skips the ten days the Gregorian reform deleted', () => {
      show(new KnoraDate('GREGORIAN', 'CE', 1582, 10, 1));

      expect(dayCells()).toContain(4);
      expect(dayCells()).not.toContain(5);
      expect(dayCells()).toContain(15);
    });

    it('shows Islamic month names when the calendar is Islamic', () => {
      show(new KnoraDate('ISLAMIC', 'noEra', 1445, 1, 1), 'ISLAMIC');

      expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Jan');
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
