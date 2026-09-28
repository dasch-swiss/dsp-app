import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
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

import { DateValueHandlerComponent } from './date-value-handler.component';

describe('DateValueHandlerComponent', () => {
  let component: DateValueHandlerComponent;
  let fixture: ComponentFixture<DateValueHandlerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        DateValueHandlerComponent,
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

    fixture = TestBed.createComponent(DateValueHandlerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  /** Editing an existing period: the first write is the stored value. */
  const editPeriod = (period: KnoraPeriod) => {
    component.writeValue(period);
    fixture.detectChanges();
  };

  const switchTo = (calendar: string) => {
    component.calendarControl.setValue(calendar);
    component.onCalendarSelected(calendar);
    fixture.detectChanges();
  };

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('one calendar for the whole value (DEV-7372)', () => {
    it('converts both ends together', () => {
      editPeriod(
        new KnoraPeriod(new KnoraDate('JULIAN', 'CE', 1580, 1, 1), new KnoraDate('JULIAN', 'CE', 1585, 6, 30))
      );

      switchTo('GREGORIAN');

      expect(component.startDate.value.calendar).toBe('GREGORIAN');
      expect(component.endDate.value.calendar).toBe('GREGORIAN');
    });

    it('takes the first day of the start span and the last of the end span', () => {
      // An imprecise period must never shrink: Julian 1580–1585 covers Gregorian 1580–1586, and
      // taking each span's start would end it in 1585 and silently drop a year of the period.
      editPeriod(new KnoraPeriod(new KnoraDate('JULIAN', 'CE', 1580), new KnoraDate('JULIAN', 'CE', 1585)));

      switchTo('GREGORIAN');

      expect(component.startDate.value.year).toBe(1580);
      expect(component.endDate.value.year).toBe(1586);
    });

    it('does not shrink a period that spans a calendar boundary', () => {
      const before = new KnoraPeriod(new KnoraDate('JULIAN', 'CE', 1580), new KnoraDate('JULIAN', 'CE', 1585));
      editPeriod(before);

      switchTo('GREGORIAN');

      const start = component.startDate.value as KnoraDate;
      const end = component.endDate.value as KnoraDate;
      expect(end.year - start.year).toBeGreaterThanOrEqual(1585 - 1580);
    });

    it('restores the stored period exactly when switched away and back', () => {
      editPeriod(new KnoraPeriod(new KnoraDate('JULIAN', 'CE', 1580), new KnoraDate('JULIAN', 'CE', 1585)));

      switchTo('GREGORIAN');
      switchTo('JULIAN');

      expect(component.startDate.value.year).toBe(1580);
      expect(component.endDate.value.year).toBe(1585);
    });

    it('offers a calendar only when both ends can be expressed in it', () => {
      // A period carries one calendar, so a calendar that cannot express one end cannot express
      // the value — offering it would produce a period with no Islamic form for half of itself.
      editPeriod(
        new KnoraPeriod(new KnoraDate('GREGORIAN', 'CE', 500, 1, 1), new KnoraDate('GREGORIAN', 'CE', 700, 1, 1))
      );

      expect(component.isCalendarAvailable('ISLAMIC')).toBe(false);
      expect(component.isCalendarAvailable('JULIAN')).toBe(true);
    });

    it('offers every calendar when both ends are representable', () => {
      editPeriod(
        new KnoraPeriod(new KnoraDate('GREGORIAN', 'CE', 2020, 1, 1), new KnoraDate('GREGORIAN', 'CE', 2024, 1, 1))
      );

      expect(component.isCalendarAvailable('ISLAMIC')).toBe(true);
    });

    it('reports that conversions still measure from the stored period', () => {
      editPeriod(new KnoraPeriod(new KnoraDate('JULIAN', 'CE', 1580), new KnoraDate('JULIAN', 'CE', 1585)));

      switchTo('GREGORIAN');

      expect(component.isBaseTheStoredValue).toBe(true);
    });

    it('measures from the user entry once they edit an end', () => {
      editPeriod(new KnoraPeriod(new KnoraDate('JULIAN', 'CE', 1580), new KnoraDate('JULIAN', 'CE', 1585)));

      component.endDate.setValue(new KnoraDate('JULIAN', 'CE', 1590));
      component.onEndEdited();

      expect(component.isBaseTheStoredValue).toBe(false);
    });

    it('still measures from the stored period after a conversion alone', () => {
      // A conversion moves the ends on purpose — Julian 1580–1585 becomes Gregorian 1580–1586 so
      // the period does not shrink — so moved ends are not evidence of an edit.
      editPeriod(new KnoraPeriod(new KnoraDate('JULIAN', 'CE', 1580), new KnoraDate('JULIAN', 'CE', 1585)));

      switchTo('GREGORIAN');
      component.onEndEdited();

      expect(component.isBaseTheStoredValue).toBe(true);
    });

    it('notices an edit made after a conversion', () => {
      editPeriod(new KnoraPeriod(new KnoraDate('JULIAN', 'CE', 1580), new KnoraDate('JULIAN', 'CE', 1585)));
      switchTo('GREGORIAN');

      component.endDate.setValue(new KnoraDate('GREGORIAN', 'CE', 1600));
      component.onEndEdited();

      expect(component.isBaseTheStoredValue).toBe(false);
    });
  });

  describe('a single date in the handler', () => {
    it('converts a lone start date with no end', () => {
      component.writeValue(new KnoraDate('JULIAN', 'CE', 1582, 6, 15));
      fixture.detectChanges();

      switchTo('GREGORIAN');

      expect(component.startDate.value.calendar).toBe('GREGORIAN');
      expect(component.endDate.value).toBeNull();
    });

    it('records the stored value from the first write only', () => {
      // Later writes are the user's own edits; letting them move the stored value would make the
      // conversion basis follow the edits and defeat the exact round trip.
      const stored = new KnoraDate('JULIAN', 'CE', 1582, 6, 15);
      component.writeValue(stored);
      component.writeValue(new KnoraDate('JULIAN', 'CE', 1600, 1, 1));

      expect(component.storedStartDate).toBe(stored);
    });

    it('records no stored value when adding', () => {
      component.writeValue(null);

      expect(component.storedStartDate).toBeNull();
      expect(component.isBaseTheStoredValue).toBe(false);
    });
  });
});
