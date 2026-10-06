import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { KnoraDate, KnoraPeriod } from '@dasch-swiss/dsp-js';
import { provideTranslateService } from '@ngx-translate/core';

import { DateValueComponent } from './date-value.component';

/**
 * Renders the component the way the resource editor does: through a `formControl` that is empty at
 * first render and filled when the resource loads.
 *
 * Every test that missed the original defect drove the component directly and set its inputs by
 * hand — a state the app never reaches. These assert the value the control holds, which is what is
 * actually saved.
 */
@Component({
  imports: [DateValueComponent, ReactiveFormsModule],
  template: `<app-date-value [formControl]="control" />`,
})
class EditorHost {
  readonly control = new FormControl<KnoraDate | KnoraPeriod | null>(null);
}

describe('DateValueComponent, as the resource editor renders it', () => {
  let fixture: ComponentFixture<EditorHost>;
  let host: EditorHost;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        EditorHost,
        BrowserAnimationsModule,
        MatButtonModule,
        MatButtonToggleModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatSelectModule,
        MatTooltipModule,
        ReactiveFormsModule,
      ],
      providers: [provideTranslateService()],
    }).compileComponents();

    fixture = TestBed.createComponent(EditorHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  const component = () =>
    fixture.debugElement.queryAll(d => d.componentInstance instanceof DateValueComponent)[0]
      .componentInstance as DateValueComponent;

  /** Loads a stored value the way the resource does: after the first render. */
  const load = (value: KnoraDate | KnoraPeriod) => {
    host.control.setValue(value);
    fixture.detectChanges();
  };

  const switchTo = (calendar: string) => {
    (component() as never as { onCalendarChange: (c: string) => void }).onCalendarChange(calendar);
    fixture.detectChanges();
  };

  const value = () => host.control.value;
  const asDate = () => value() as KnoraDate;
  const el = (hook: string) => (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(`[data-cy="${hook}"]`);

  // Every switch converts from the base — the stored value, or what the user entered — never from
  // the previous switch's result: converting a conversion drifted, and a year counted down by one
  // with each round trip through Islamic.
  describe('the conversion base', () => {
    const typeStart = (date: KnoraDate | null) => {
      (component() as never as { onStartChange: (d: KnoraDate | null) => void }).onStartChange(date);
      fixture.detectChanges();
    };
    const available = () => (component() as never as { availableCalendars: () => string[] }).availableCalendars();
    const fieldText = () =>
      (fixture.nativeElement as HTMLElement).querySelector('[data-cy="date-field-value"]')?.textContent?.trim();

    it('keeps an entered year through any number of round trips', () => {
      load(new KnoraDate('GREGORIAN', 'CE', 2024));
      typeStart(new KnoraDate('GREGORIAN', 'CE', 2025));

      for (const calendar of ['JULIAN', 'ISLAMIC', 'JULIAN', 'GREGORIAN', 'JULIAN', 'ISLAMIC', 'JULIAN', 'GREGORIAN']) {
        switchTo(calendar);
      }

      expect([asDate().calendar, asDate().year]).toEqual(['GREGORIAN', 2025]);
    });

    it('shows the value the form holds after a round trip', () => {
      load(new KnoraDate('GREGORIAN', 'CE', 2024));
      typeStart(new KnoraDate('GREGORIAN', 'CE', 2025));
      switchTo('ISLAMIC');
      switchTo('GREGORIAN');

      expect(fieldText()).toBe('2025');
      expect(asDate().year).toBe(2025);
    });

    it('keeps the stored calendar on offer, and returns to it exactly', () => {
      load(new KnoraDate('ISLAMIC', 'noEra', 1, 1));
      switchTo('GREGORIAN');

      expect(available()).toContain('ISLAMIC');
      switchTo('ISLAMIC');
      expect([asDate().calendar, asDate().year, asDate().month]).toEqual(['ISLAMIC', 1, 1]);
    });

    it('leaves a cleared start cleared when the calendar changes', () => {
      load(new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15));
      typeStart(null);
      switchTo('JULIAN');

      expect(value()).toBeNull();
    });

    it('does not let an added end drift through Islamic', () => {
      load(new KnoraDate('GREGORIAN', 'CE', 2024));
      (component() as never as { onTogglePeriod: (e: Event) => void }).onTogglePeriod(new Event('click'));
      fixture.detectChanges();
      switchTo('ISLAMIC');
      switchTo('GREGORIAN');

      const period = value() as KnoraPeriod;
      expect([period.start.year, period.end.year]).toEqual([2024, 2025]);
    });

    // A day converts while a month keeps its numbers, so Julian 25.12.1600 – 12.1600 would become
    // Gregorian 04.01.1601 – 12.1600: out of order, from a calendar switch alone.
    it('does not offer a switch that would put a period out of order', () => {
      load(new KnoraPeriod(new KnoraDate('JULIAN', 'CE', 1600, 12, 25), new KnoraDate('JULIAN', 'CE', 1600, 12)));

      expect(available()).not.toContain('GREGORIAN');
      switchTo('GREGORIAN');
      expect(host.control.valid).toBe(true);
      expect((value() as KnoraPeriod).start.calendar).toBe('JULIAN');
    });
  });

  describe('switching the calendar on a stored single date', () => {
    // The reported bug: a stored 01.04.2020 Gregorian stayed 01.04.2020 when switched to Julian —
    // relabelled rather than converted — and became 19.03.2020 on the way back.
    beforeEach(() => load(new KnoraDate('GREGORIAN', 'CE', 2020, 4, 1)));

    it('converts rather than relabelling', () => {
      switchTo('JULIAN');

      expect(asDate().calendar).toBe('JULIAN');
      expect([asDate().day, asDate().month, asDate().year]).toEqual([19, 3, 2020]);
    });

    it('never leaves the numerals unchanged under a new calendar', () => {
      switchTo('JULIAN');

      const relabelled = asDate().day === 1 && asDate().month === 4;
      expect(relabelled).toBe(false);
    });

    it('returns to exactly the stored date', () => {
      switchTo('JULIAN');
      switchTo('GREGORIAN');

      expect([asDate().day, asDate().month, asDate().year]).toEqual([1, 4, 2020]);
    });

    it('converts to Islamic and back without drift', () => {
      switchTo('ISLAMIC');
      expect([asDate().day, asDate().month, asDate().year]).toEqual([7, 8, 1441]);

      switchTo('GREGORIAN');
      expect([asDate().day, asDate().month, asDate().year]).toEqual([1, 4, 2020]);
    });

    it('measures from the stored value rather than the last conversion', () => {
      switchTo('JULIAN');
      switchTo('ISLAMIC');
      switchTo('GREGORIAN');

      expect([asDate().day, asDate().month, asDate().year]).toEqual([1, 4, 2020]);
    });
  });

  // The reported bug: for a value that is not stored yet, switching the calendar converted the
  // value underneath but left the picker's field showing the pre-conversion date.
  describe('switching the calendar on a value that is not stored yet', () => {
    const pickerField = () =>
      (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('[data-cy="date-field"]');

    beforeEach(() => {
      fixture.detectChanges();
      // Entered through the picker, as a user does. Arriving via `writeValue` instead would be
      // captured as a stored value, which is what this case is not.
      (component() as never as { onStartChange: (d: KnoraDate) => void }).onStartChange(
        new KnoraDate('GREGORIAN', 'CE', 2026, 9, 3)
      );
      fixture.detectChanges();
    });

    it('converts the value', () => {
      switchTo('JULIAN');

      expect([asDate().day, asDate().month, asDate().year]).toEqual([21, 8, 2026]);
    });

    it('shows the converted date in the field, not the one before the switch', () => {
      switchTo('JULIAN');

      expect(pickerField()!.textContent).toContain('21.08.2026');
      expect(pickerField()!.textContent).not.toContain('03.09.2026');
    });

    it('does not claim a stored value it never had', () => {
      switchTo('JULIAN');

      expect(el('stored-value-line')).toBeNull();
    });
  });

  describe('knowing what is stored', () => {
    beforeEach(() => load(new KnoraDate('GREGORIAN', 'CE', 2020, 4, 1)));

    it('captures the stored value even though it arrived after first render', () => {
      expect(el('stored-value-line')).not.toBeNull();
    });

    it('says the day is unchanged and names the calendar it is now expressed in', () => {
      switchTo('JULIAN');

      // No translation catalogue in jsdom, so the key is what renders; the Storybook test asserts
      // the translated copy.
      expect(el('converted-from')?.textContent).toContain('convertedStoredSameDay');
    });

    // The hint is about the converted stored date, so an end added beside it does not make it false.
    it('keeps the hint when an end is added to the converted date', () => {
      switchTo('JULIAN');
      const c = component() as never as { onTogglePeriod: (e: Event) => void; onEndChange: (d: KnoraDate) => void };
      c.onTogglePeriod(new Event('click'));
      c.onEndChange(new KnoraDate('JULIAN', 'CE', 2020, 3, 25));
      fixture.detectChanges();

      expect(el('converted-from')?.textContent).toContain('convertedStoredSameDay');
    });

    it('calls a converted period the same period', () => {
      load(
        new KnoraPeriod(new KnoraDate('GREGORIAN', 'CE', 2025, 5, 23), new KnoraDate('GREGORIAN', 'CE', 2025, 6, 2))
      );
      switchTo('JULIAN');

      expect(el('converted-from')?.textContent).toContain('convertedStoredSamePeriod');
    });

    // A year or month is restated by a fixed rule, not converted, so there is nothing to state.
    it('shows no hint for a year between Julian and Gregorian', () => {
      load(new KnoraDate('JULIAN', 'CE', 1585));
      switchTo('GREGORIAN');

      expect(el('converted-from')).toBeNull();
    });

    // Only the day was converted; the year is kept without comment.
    it('names only the converted day of a period whose other end is a year', () => {
      load(new KnoraPeriod(new KnoraDate('GREGORIAN', 'CE', 1600, 3, 15), new KnoraDate('GREGORIAN', 'CE', 1601)));
      switchTo('JULIAN');

      const hint = el('converted-from')?.textContent;
      expect(hint).toContain('convertedStoredSameDay');
      expect((component() as never as { conversionHint: () => unknown }).conversionHint()).toEqual(
        expect.objectContaining({ from: '15.03.1600 Gregorian', to: '05.03.1600 Julian' })
      );
    });

    it('shows no hint for a month restated in Islamic', () => {
      load(new KnoraDate('GREGORIAN', 'CE', 1600, 7));
      switchTo('ISLAMIC');

      expect(el('converted-from')).toBeNull();
    });

    it('names only the converted day of a period whose other end is a month, in Islamic too', () => {
      load(new KnoraPeriod(new KnoraDate('GREGORIAN', 'CE', 1600, 3, 15), new KnoraDate('GREGORIAN', 'CE', 1600, 7)));
      switchTo('ISLAMIC');

      expect(el('converted-from')?.textContent).toContain('convertedStoredSameDay');
    });

    // A user who has just picked a different day can see that it differs; saying so read as a
    // warning about something they did deliberately.
    // "Converted from the stored value to this" would describe a conversion that never happened.
    it('shows no hint once the user picks a different day after a switch', () => {
      switchTo('JULIAN');
      (component() as never as { onStartChange: (d: KnoraDate) => void }).onStartChange(
        new KnoraDate('JULIAN', 'CE', 2021, 8, 9)
      );
      fixture.detectChanges();

      expect(el('converted-from')).toBeNull();
    });

    it('says nothing while the value is in its stored calendar', () => {
      expect(el('converted-from')).toBeNull();
    });
  });

  describe('adding a value, where nothing is stored', () => {
    it('shows no stored-value line', () => {
      expect(el('stored-value-line')).toBeNull();
    });

    it('does not mistake the user’s own entry for a stored value', () => {
      // The entry travels back through writeValue after onChange reports it; taking that for a
      // stored value put a stored-value line on a form where nothing was stored.
      (component() as never as { onStartChange: (d: KnoraDate) => void }).onStartChange(
        new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15)
      );
      fixture.detectChanges();

      expect(el('stored-value-line')).toBeNull();
    });
  });

  describe('periods', () => {
    beforeEach(() => load(new KnoraPeriod(new KnoraDate('JULIAN', 'CE', 1580), new KnoraDate('JULIAN', 'CE', 1585))));

    it('converts both ends together', () => {
      switchTo('GREGORIAN');

      const period = value() as KnoraPeriod;
      expect(period.start.calendar).toBe('GREGORIAN');
      expect(period.end.calendar).toBe('GREGORIAN');
    });

    it('keeps the years of an imprecise period between Julian and Gregorian', () => {
      switchTo('GREGORIAN');

      const period = value() as KnoraPeriod;
      expect([period.start.year, period.end.year]).toEqual([1580, 1585]);
    });

    it('returns to exactly the stored period', () => {
      switchTo('GREGORIAN');
      switchTo('JULIAN');

      const period = value() as KnoraPeriod;
      expect([period.start.year, period.end.year]).toEqual([1580, 1585]);
    });

    it('offers one calendar control for the whole value', () => {
      expect((fixture.nativeElement as HTMLElement).querySelectorAll('app-calendar-selector').length).toBe(1);
    });
  });

  // Someone who entered "July 1600" or "1600" still means July 1600 or 1600 in the other calendar.
  describe('a year or a month across calendars', () => {
    const shape = (d: KnoraDate) => [d.calendar, d.era, d.year, d.month, d.day];

    it('keeps a month between Gregorian and Julian', () => {
      load(new KnoraDate('GREGORIAN', 'CE', 1600, 7));
      switchTo('JULIAN');

      expect(shape(asDate())).toEqual(['JULIAN', 'CE', 1600, 7, undefined]);
    });

    it('keeps a year between Julian and Gregorian, BCE included', () => {
      load(new KnoraDate('JULIAN', 'BCE', 44));
      switchTo('GREGORIAN');

      expect(shape(asDate())).toEqual(['GREGORIAN', 'BCE', 44, undefined, undefined]);
    });

    it('takes the Islamic month that contains the first day of the month', () => {
      // 01.07.1600 Gregorian falls in Dhu al-Hijjah 1008; Muharram 1009 begins later that month.
      load(new KnoraDate('GREGORIAN', 'CE', 1600, 7));
      switchTo('ISLAMIC');

      expect(shape(asDate())).toEqual(['ISLAMIC', 'noEra', 1008, 12, undefined]);
    });

    it('takes the Islamic year that contains the first day of the year', () => {
      load(new KnoraDate('GREGORIAN', 'CE', 1600));
      switchTo('ISLAMIC');

      expect(shape(asDate())).toEqual(['ISLAMIC', 'noEra', 1008, undefined, undefined]);
    });

    // An end added beside a stored single date — its preset included — is not an edit of it.
    it('restores a stored month exactly after an end is added in Islamic', () => {
      load(new KnoraDate('GREGORIAN', 'CE', 1600, 7));
      switchTo('ISLAMIC');
      (component() as never as { onTogglePeriod: (e: Event) => void }).onTogglePeriod(new Event('click'));
      fixture.detectChanges();
      switchTo('GREGORIAN');

      expect(shape((value() as KnoraPeriod).start)).toEqual(['GREGORIAN', 'CE', 1600, 7, undefined]);
    });

    // The first day of Gregorian 07.622 lies before the Hijra, so no Islamic month contains it.
    it('does not offer Islamic for a month that straddles the Hijra', () => {
      load(new KnoraDate('GREGORIAN', 'CE', 622, 7));

      expect((component() as never as { availableCalendars: () => string[] }).availableCalendars()).not.toContain(
        'ISLAMIC'
      );
    });

    it('still converts a day', () => {
      load(new KnoraDate('GREGORIAN', 'CE', 1600, 7, 15));
      switchTo('JULIAN');

      expect(shape(asDate())).toEqual(['JULIAN', 'CE', 1600, 7, 5]);
    });
  });

  // Stored as given, in the proleptic Gregorian calendar, and said so rather than passed off.
  describe('a day the Gregorian reform skipped', () => {
    it('is noted when the user picks one', () => {
      (component() as never as { onStartChange: (d: KnoraDate) => void }).onStartChange(
        new KnoraDate('GREGORIAN', 'CE', 1582, 10, 5)
      );
      fixture.detectChanges();

      expect(el('reform-gap')?.textContent).toContain('reformGapNote');
      expect([asDate().calendar, asDate().day, asDate().month]).toEqual(['GREGORIAN', 5, 10]);
    });

    it('is noted when a conversion produces one', () => {
      load(new KnoraDate('JULIAN', 'CE', 1582, 9, 25));
      switchTo('GREGORIAN');

      expect([asDate().day, asDate().month]).toEqual([5, 10]);
      expect(el('reform-gap')).not.toBeNull();
    });

    it('is not noted for the days around it', () => {
      load(new KnoraDate('GREGORIAN', 'CE', 1582, 10, 15));

      expect(el('reform-gap')).toBeNull();
    });
  });

  // An imprecise start has no day to pick, so the end is filled in with the next month or year.
  describe('adding an end to an imprecise start', () => {
    const toggle = () =>
      (component() as never as { onTogglePeriod: (e: Event) => void }).onTogglePeriod(new Event('click'));
    const end = () => (value() as KnoraPeriod).end;

    it('presets the next month', () => {
      load(new KnoraDate('GREGORIAN', 'CE', 1600, 7));
      toggle();

      expect([end().year, end().month, end().day]).toEqual([1600, 8, undefined]);
      expect(host.control.valid).toBe(true);
    });

    it('rolls a December over into January of the next year', () => {
      load(new KnoraDate('ISLAMIC', 'noEra', 1008, 12));
      toggle();

      expect([end().calendar, end().year, end().month]).toEqual(['ISLAMIC', 1009, 1]);
    });

    it('presets the next year', () => {
      load(new KnoraDate('JULIAN', 'CE', 1600));
      toggle();

      expect([end().year, end().month]).toEqual([1601, undefined]);
    });

    it('counts across the turn of the era, which has no year 0', () => {
      load(new KnoraDate('GREGORIAN', 'BCE', 1));
      toggle();

      expect([end().era, end().year]).toEqual(['CE', 1]);
    });

    it('presets the next day, across the end of a year', () => {
      load(new KnoraDate('GREGORIAN', 'CE', 1600, 12, 31));
      toggle();

      expect([end().calendar, end().year, end().month, end().day]).toEqual(['GREGORIAN', 1601, 1, 1]);
      expect(host.control.valid).toBe(true);
    });

    it('presets the next day in a leap February, by the Julian rule', () => {
      // 1700 is a leap year in Julian and not in Gregorian.
      load(new KnoraDate('JULIAN', 'CE', 1700, 2, 28));
      toggle();

      expect([end().month, end().day]).toEqual([2, 29]);
    });
  });

  describe('asking for an end date does not discard the start', () => {
    // Found in review. Clicking "add end date" on a complete date used to empty the form: the
    // value became null and the control invalid, before the user had picked anything. Asking for
    // an end date is a statement of intent, not a retraction of what is already entered.
    const toggle = () =>
      (component() as never as { onTogglePeriod: (e: Event) => void }).onTogglePeriod(new Event('click'));
    const pickEnd = (date: KnoraDate) =>
      (component() as never as { onEndChange: (d: KnoraDate) => void }).onEndChange(date);

    beforeEach(() => load(new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15)));

    it('keeps the start date when a period is asked for', () => {
      toggle();
      fixture.detectChanges();

      const start = (value() as KnoraPeriod).start;
      expect([start.day, start.month, start.year]).toEqual([15, 6, 2024]);
    });

    it('becomes a period once there are two ends to make one from', () => {
      toggle();
      pickEnd(new KnoraDate('GREGORIAN', 'CE', 2024, 12, 31));
      fixture.detectChanges();

      const period = value() as KnoraPeriod;
      expect(period).toBeInstanceOf(KnoraPeriod);
      expect([period.start.day, period.end.day]).toEqual([15, 31]);
    });

    it('recovers the single date when the period is toggled back off', () => {
      toggle();
      pickEnd(new KnoraDate('GREGORIAN', 'CE', 2024, 12, 31));
      fixture.detectChanges();
      toggle();
      fixture.detectChanges();

      expect([asDate().day, asDate().month, asDate().year]).toEqual([15, 6, 2024]);
    });
  });

  describe('what validation reports', () => {
    const toggle = () =>
      (component() as never as { onTogglePeriod: (e: Event) => void }).onTogglePeriod(new Event('click'));

    it('reports nothing entered on an empty form', () => {
      expect(host.control.errors).toEqual({ required: true });
    });

    it('reports nothing wrong with a complete date', () => {
      load(new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15));

      expect(host.control.valid).toBe(true);
    });

    it('reports a half-built period as missing its end, not as missing everything', () => {
      // `required` would be a lie: a date has plainly been entered. Saving half a period would
      // store a single date under a user's stated intent to store a range, so it is still invalid.
      load(new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15));

      toggle();
      (component() as never as { onEndChange: (d: KnoraDate | null) => void }).onEndChange(null);
      fixture.detectChanges();

      expect(host.control.errors).toEqual({ endRequired: true });
    });

    // The stored value has no end, so converting from it on a calendar switch dropped the end the
    // user had just added and reported a period missing its end.
    it('converts an end added to a stored single date, rather than dropping it', () => {
      load(new KnoraDate('JULIAN', 'CE', 2025, 5, 10));

      toggle();
      (component() as never as { onEndChange: (d: KnoraDate) => void }).onEndChange(
        new KnoraDate('JULIAN', 'CE', 2025, 5, 20)
      );
      fixture.detectChanges();
      switchTo('GREGORIAN');

      expect(host.control.errors).toBeNull();
      const period = value() as KnoraPeriod;
      expect(period).toBeInstanceOf(KnoraPeriod);
      expect([period.start.calendar, period.start.day, period.start.month]).toEqual(['GREGORIAN', 23, 5]);
      expect([period.end.calendar, period.end.day, period.end.month]).toEqual(['GREGORIAN', 2, 6]);
    });

    // The mirror case: converting from the stored period brought back the end the user had removed.
    describe('an end removed from a stored period stays removed across a calendar switch', () => {
      beforeEach(() =>
        load(new KnoraPeriod(new KnoraDate('JULIAN', 'CE', 2025, 5, 10), new KnoraDate('JULIAN', 'CE', 2025, 5, 20)))
      );

      it('when the end is cleared', () => {
        (component() as never as { onEndChange: (d: KnoraDate | null) => void }).onEndChange(null);
        fixture.detectChanges();
        switchTo('GREGORIAN');

        expect(value()).not.toBeInstanceOf(KnoraPeriod);
        expect(host.control.errors).toEqual({ endRequired: true });
      });

      it('when the period is turned off and on again', () => {
        toggle();
        fixture.detectChanges();
        switchTo('GREGORIAN');
        toggle();
        fixture.detectChanges();

        // The new end is the preset — the day after the start — not the removed 02.06.2025.
        const period = value() as KnoraPeriod;
        expect([period.start.day, period.start.month]).toEqual([23, 5]);
        expect([period.end.day, period.end.month]).toEqual([24, 5]);
      });
    });

    it('reports a period whose ends are out of order', () => {
      load(new KnoraPeriod(new KnoraDate('JULIAN', 'CE', 1585), new KnoraDate('JULIAN', 'CE', 1580)));

      expect(host.control.errors).toEqual({ periodStartEnd: true });
    });

    // dsp-api accepts an imprecise end that contains the start, which is how projects record
    // uncertain historical dates, so such values may already be stored and must stay editable.
    describe('an imprecise end that contains the start', () => {
      it('accepts a day to its own month', () => {
        load(new KnoraPeriod(new KnoraDate('GREGORIAN', 'CE', 1850, 3, 15), new KnoraDate('GREGORIAN', 'CE', 1850, 3)));

        expect(host.control.valid).toBe(true);
      });

      it('accepts a month to its own year', () => {
        load(new KnoraPeriod(new KnoraDate('GREGORIAN', 'CE', 1850, 5), new KnoraDate('GREGORIAN', 'CE', 1850)));

        expect(host.control.valid).toBe(true);
      });

      it('still rejects an imprecise end that lies wholly before the start', () => {
        load(new KnoraPeriod(new KnoraDate('GREGORIAN', 'CE', 1850, 5, 15), new KnoraDate('GREGORIAN', 'CE', 1850, 4)));

        expect(host.control.errors).toEqual({ periodStartEnd: true });
      });
    });

    it('compares those ends through JDN, so two calendars still order correctly', () => {
      // Deliberately a case where the two comparisons disagree. Julian 01.04.2020 is Gregorian
      // 14.04.2020, four days AFTER the Gregorian end — so the period is out of order. Comparing
      // fields would see day 1 against day 10 in the same month, call it ordered, and accept a
      // period that runs backwards. An earlier version of this test used numerals that both
      // comparisons rejected, so it passed without proving anything.
      load(new KnoraPeriod(new KnoraDate('JULIAN', 'CE', 2020, 4, 1), new KnoraDate('GREGORIAN', 'CE', 2020, 4, 10)));

      expect(host.control.errors).toEqual({ periodStartEnd: true });
    });

    it('accepts a cross-calendar period that is genuinely in order', () => {
      // The other half: Julian 01.04.2020 is Gregorian 14.04.2020, before the Gregorian end.
      load(new KnoraPeriod(new KnoraDate('JULIAN', 'CE', 2020, 4, 1), new KnoraDate('GREGORIAN', 'CE', 2020, 4, 20)));

      expect(host.control.valid).toBe(true);
    });

    it('stays valid across a calendar switch, which changes no instant', () => {
      load(new KnoraDate('GREGORIAN', 'CE', 2020, 4, 1));

      switchTo('JULIAN');

      expect(host.control.valid).toBe(true);
    });
  });

  describe('being reused for a second value', () => {
    // The editor binds this component to an input rather than recreating it per value, so a second
    // resource arrives as another writeValue on the same instance. Capturing the stored value only
    // once left the "converted from" hint measured against the first resource's date.
    it('re-anchors on the newly loaded value', () => {
      load(new KnoraDate('GREGORIAN', 'CE', 2020, 4, 1));
      load(new KnoraDate('GREGORIAN', 'CE', 1999, 1, 15));

      // The rendered line interpolates through translate, which has no catalogue here, so the
      // stored text itself is what this asserts.
      expect((component() as never as { storedText: () => string }).storedText()).toContain('15.01.1999');
    });

    it('measures conversions from the new value, not the old one', () => {
      load(new KnoraDate('GREGORIAN', 'CE', 2020, 4, 1));
      switchTo('JULIAN');
      load(new KnoraDate('GREGORIAN', 'CE', 1999, 1, 15));

      switchTo('JULIAN');
      switchTo('GREGORIAN');

      expect([asDate().day, asDate().month, asDate().year]).toEqual([15, 1, 1999]);
    });

    it('forgets that the previous value had been edited', () => {
      load(new KnoraDate('GREGORIAN', 'CE', 2020, 4, 1));
      (component() as never as { onStartChange: (d: KnoraDate) => void }).onStartChange(
        new KnoraDate('GREGORIAN', 'CE', 2020, 5, 5)
      );
      fixture.detectChanges();

      load(new KnoraDate('GREGORIAN', 'CE', 1999, 1, 15));
      switchTo('JULIAN');

      // "(stored value)" must refer to 1999, which means the base was re-anchored.
      expect(el('converted-from')?.textContent).toContain('convertedStoredSameDay');
    });
  });

  describe('being cleared', () => {
    it('keeps the period shape the user asked for when the form is reset', () => {
      // Angular calls writeValue(null) on reset. Dropping isPeriod here silently turned a range
      // back into a single date with nothing to notice it.
      load(new KnoraPeriod(new KnoraDate('JULIAN', 'CE', 1580), new KnoraDate('JULIAN', 'CE', 1585)));

      component().writeValue(null);
      fixture.detectChanges();

      expect((component() as never as { state: () => { isPeriod: boolean } }).state().isPeriod).toBe(true);
    });

    it('clears the dates themselves', () => {
      load(new KnoraPeriod(new KnoraDate('JULIAN', 'CE', 1580), new KnoraDate('JULIAN', 'CE', 1585)));

      component().writeValue(null);
      fixture.detectChanges();

      const state = (component() as never as { state: () => { start: unknown; end: unknown } }).state();
      expect([state.start, state.end]).toEqual([null, null]);
    });
  });

  describe('one user action, one emission', () => {
    it('emits once for one calendar switch', () => {
      load(new KnoraDate('GREGORIAN', 'CE', 2020, 4, 1));
      let emissions = 0;
      host.control.valueChanges.subscribe(() => emissions++);

      switchTo('JULIAN');

      expect(emissions).toBe(1);
    });

    it('emits nothing when a value is written in from outside', () => {
      let emissions = 0;
      host.control.valueChanges.subscribe(() => emissions++);

      component().writeValue(new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15));
      fixture.detectChanges();

      expect(emissions).toBe(0);
    });
  });

  describe('it holds no second copy and no guard flags', () => {
    it('has no FormGroup', () => {
      expect((component() as unknown as { form?: unknown }).form).toBeUndefined();
    });

    it('leaves the stored value object untouched', () => {
      const stored = new KnoraDate('GREGORIAN', 'CE', 2020, 4, 1);
      load(stored);

      switchTo('JULIAN');

      expect([stored.day, stored.month, stored.calendar]).toEqual([1, 4, 'GREGORIAN']);
    });
  });
});
