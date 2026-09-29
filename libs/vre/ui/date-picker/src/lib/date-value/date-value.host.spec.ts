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

  describe('knowing what is stored', () => {
    beforeEach(() => load(new KnoraDate('GREGORIAN', 'CE', 2020, 4, 1)));

    it('captures the stored value even though it arrived after first render', () => {
      expect(el('stored-value-line')).not.toBeNull();
    });

    it('reports the value as unchanged after a calendar switch alone', () => {
      switchTo('JULIAN');

      // No translation catalogue in jsdom, so the key is what renders; the Storybook test asserts
      // the translated copy.
      expect(el('save-status')?.textContent).toContain('sameAsStored');
    });

    it('says the conversion came from the stored value', () => {
      switchTo('JULIAN');

      expect(el('converted-from')?.textContent).toContain('convertedFromStored');
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

    it('does not shrink an imprecise period', () => {
      // Julian 1580–1585 covers Gregorian 1580–1586: the end takes the last day of its span.
      switchTo('GREGORIAN');

      const period = value() as KnoraPeriod;
      expect(period.start.year).toBe(1580);
      expect(period.end.year).toBe(1586);
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

      expect(asDate()).not.toBeNull();
      expect([asDate().day, asDate().month, asDate().year]).toEqual([15, 6, 2024]);
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
      fixture.detectChanges();

      expect(host.control.errors).toEqual({ endRequired: true });
    });

    it('reports a period whose ends are out of order', () => {
      load(new KnoraPeriod(new KnoraDate('JULIAN', 'CE', 1585), new KnoraDate('JULIAN', 'CE', 1580)));

      expect(host.control.errors).toEqual({ periodStartEnd: true });
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
    // once left every later judgement — "nothing to save", "converted from" — measured against the
    // first resource's date.
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

      // "(Stored value)" must refer to 1999, which means the base was re-anchored.
      expect(el('converted-from')?.textContent).toContain('convertedFromStored');
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
