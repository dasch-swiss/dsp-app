import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { KnoraDate, KnoraPeriod } from '@dasch-swiss/dsp-js';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';

import { AppDatePickerComponent } from '../app-date-picker/app-date-picker.component';
import { DateValueHandlerComponent } from './date-value-handler.component';

/**
 * Drives the handler the way the resource editor does: through a `formControl`, with the value
 * arriving after the first render, and switching the calendar on the handler's own control.
 *
 * The component's own spec drove the picker directly and set `storedValue` by hand, which is not a
 * state the app ever reaches — and it hid two defects that were plainly visible in the browser.
 */
@Component({
  imports: [DateValueHandlerComponent, ReactiveFormsModule],
  template: `<app-date-value-handler [formControl]="control" />`,
})
class EditorHost {
  // Empty at first render, as the real page is before the resource loads.
  readonly control = new FormControl<KnoraDate | KnoraPeriod | null>(null);
}

describe('DateValueHandlerComponent, as the resource editor renders it', () => {
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
        MatMenuModule,
        MatSelectModule,
        MatTooltipModule,
        ReactiveFormsModule,
      ],
      providers: [Subject, provideTranslateService(), TranslateService],
    }).compileComponents();

    fixture = TestBed.createComponent(EditorHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  const handler = () =>
    fixture.debugElement.queryAll(d => d.componentInstance instanceof DateValueHandlerComponent)[0]
      .componentInstance as DateValueHandlerComponent;

  const startPicker = () =>
    fixture.debugElement.queryAll(d => d.componentInstance instanceof AppDatePickerComponent)[0]
      .componentInstance as AppDatePickerComponent;

  /** Loads a stored value the way the resource does: after the first render. */
  const load = (value: KnoraDate | KnoraPeriod) => {
    host.control.setValue(value);
    fixture.detectChanges();
  };

  /** Switches the calendar on the handler's control, which is what the user clicks. */
  const switchTo = (calendar: string) => {
    handler().calendarControl.setValue(calendar);
    handler().onCalendarSelected(calendar);
    fixture.detectChanges();
  };

  const current = () => host.control.value as KnoraDate;

  describe('switching the calendar on a stored single date', () => {
    // Reported from the deployed preview: a stored 01.04.2020 Gregorian stayed 01.04.2020 when
    // switched to Julian — relabelled rather than converted — and then became 19.03.2020 on the
    // way back, so the round trip silently changed the value.
    beforeEach(() => load(new KnoraDate('GREGORIAN', 'CE', 2020, 4, 1)));

    it('converts to Julian rather than relabelling', () => {
      switchTo('JULIAN');

      expect(current().calendar).toBe('JULIAN');
      expect([current().day, current().month, current().year]).toEqual([19, 3, 2020]);
    });

    it('returns to exactly the stored date', () => {
      switchTo('JULIAN');
      switchTo('GREGORIAN');

      expect([current().day, current().month, current().year]).toEqual([1, 4, 2020]);
    });

    it('converts to Islamic rather than relabelling', () => {
      switchTo('ISLAMIC');

      expect(current().calendar).toBe('ISLAMIC');
      expect([current().day, current().month, current().year]).toEqual([7, 8, 1441]);
    });

    it('returns from Islamic to exactly the stored date', () => {
      switchTo('ISLAMIC');
      switchTo('GREGORIAN');

      expect([current().day, current().month, current().year]).toEqual([1, 4, 2020]);
    });

    it('never relabels: the numerals must change when the calendar does', () => {
      switchTo('JULIAN');

      const unchanged = current().day === 1 && current().month === 4 && current().year === 2020;
      expect(unchanged).toBe(false);
    });
  });

  describe('knowing what is stored', () => {
    // `storedStartDate` is captured in `writeValue`, so on the first binding pass it is still null
    // and `[storedValue]` reached the picker as null — the conversion base never anchored, and the
    // stored-value line and "nothing to save" status were wrong with it.
    beforeEach(() => load(new KnoraDate('GREGORIAN', 'CE', 2020, 4, 1)));

    it('tells the picker what is stored, even though the value arrived after first render', () => {
      expect(startPicker().storedValue).not.toBeNull();
      expect(startPicker().storedValue?.year).toBe(2020);
    });

    it('reports the value as unchanged after a calendar switch alone', () => {
      switchTo('JULIAN');

      expect(startPicker().isUnchangedFromStored()).toBe(true);
    });

    it('still measures conversions from the stored value', () => {
      switchTo('JULIAN');

      expect(startPicker().isBaseTheStoredValue()).toBe(true);
    });
  });

  describe('switching the calendar on a stored period', () => {
    beforeEach(() => load(new KnoraPeriod(new KnoraDate('JULIAN', 'CE', 1580), new KnoraDate('JULIAN', 'CE', 1585))));

    it('converts both ends rather than relabelling them', () => {
      switchTo('GREGORIAN');

      const period = host.control.value as KnoraPeriod;
      expect(period.start.calendar).toBe('GREGORIAN');
      expect(period.start.year).toBe(1580);
      // The end takes the last day of its span, so the period does not shrink.
      expect(period.end.year).toBe(1586);
    });

    it('returns to exactly the stored period', () => {
      switchTo('GREGORIAN');
      switchTo('JULIAN');

      const period = host.control.value as KnoraPeriod;
      expect(period.start.year).toBe(1580);
      expect(period.end.year).toBe(1585);
    });
  });
});
