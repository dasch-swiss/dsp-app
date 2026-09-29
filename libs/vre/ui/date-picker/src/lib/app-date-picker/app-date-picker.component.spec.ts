import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { KnoraDate, Precision } from '@dasch-swiss/dsp-js';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { CalendarDateService } from '../calendar-date/calendar-date.service';
import { AppDatePickerComponent } from './app-date-picker.component';

describe('DatePickerComponent', () => {
  let component: AppDatePickerComponent;
  let fixture: ComponentFixture<AppDatePickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AppDatePickerComponent,
        BrowserAnimationsModule,
        MatButtonModule,
        MatButtonToggleModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatMenuModule,
        MatSelectModule,
        ReactiveFormsModule,
      ],
      providers: [Subject, provideTranslateService(), TranslateService],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppDatePickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('switching the calendar (DEV-7372)', () => {
    // Before this, switching the calendar kept the numerals and relabelled them: 15.06.2024
    // Gregorian became 15.06.2024 Julian, a different day, saved with no warning.
    const switchTo = (calendar: string) => {
      component.form.controls['calendar'].setValue(calendar);
      fixture.detectChanges();
    };

    it('converts the entered date to the same day in the new calendar', () => {
      component.value = new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15);

      switchTo('JULIAN');

      expect(component.value?.calendar).toBe('JULIAN');
      expect(component.value?.year).toBe(2024);
      expect(component.value?.month).toBe(6);
      expect(component.value?.day).toBe(2);
    });

    it('does not merely relabel the entered numerals', () => {
      component.value = new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15);

      switchTo('JULIAN');

      expect(component.value?.day).not.toBe(15);
    });

    it('round-trips back to the original day when switched back', () => {
      component.value = new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15);

      switchTo('JULIAN');
      switchTo('GREGORIAN');

      expect(component.value?.day).toBe(15);
      expect(component.value?.month).toBe(6);
      expect(component.value?.year).toBe(2024);
    });

    it('converts into the Islamic calendar', () => {
      component.value = new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15);

      switchTo('ISLAMIC');

      expect(component.value?.calendar).toBe('ISLAMIC');
      expect(component.value?.year).toBe(1445);
      expect(component.value?.month).toBe(12);
      expect(component.value?.day).toBe(8);
    });

    it('keeps a year-precision date year-precision, taking the start of the span', () => {
      component.value = new KnoraDate('JULIAN', 'CE', 1582);

      switchTo('GREGORIAN');

      expect(component.value?.year).toBe(1582);
      expect(component.value?.month).toBeUndefined();
      expect(component.value?.day).toBeUndefined();
    });

    it('preserves BCE across a conversion', () => {
      component.value = new KnoraDate('JULIAN', 'BCE', 44, 3, 15);

      switchTo('GREGORIAN');

      expect(component.value?.era).toBe('BCE');
      expect(component.value?.year).toBe(44);
    });

    it('leaves an empty picker alone, since there is nothing to convert', () => {
      switchTo('JULIAN');

      expect(component.form.controls['calendar'].value).toBe('JULIAN');
    });
  });

  describe('what a calendar switch converts from (DEV-7372)', () => {
    const switchTo = (calendar: string) => {
      component.form.controls['calendar'].setValue(calendar);
      fixture.detectChanges();
    };

    /** Editing an existing value: the picker is told what is stored. */
    const editExisting = (stored: KnoraDate) => {
      component.storedValue = stored;
      component.ngOnChanges({ storedValue: { currentValue: stored, previousValue: null, firstChange: true } } as never);
      component.value = stored;
      fixture.detectChanges();
    };

    describe('editing an existing value', () => {
      it('restores the stored date exactly when the user switches away and back', () => {
        // The round trip is the whole reason the base exists. Julian 1582 covers Gregorian
        // 1582/1583; converting the displayed Gregorian 1582 back to Julian lands on 1581, so a
        // user who merely looked at another calendar would have silently edited the value.
        editExisting(new KnoraDate('JULIAN', 'CE', 1582));

        switchTo('GREGORIAN');
        switchTo('JULIAN');

        expect(component.value?.year).toBe(1582);
        expect(component.value?.calendar).toBe('JULIAN');
      });

      it('restores the stored precision, not the start of a span', () => {
        editExisting(new KnoraDate('JULIAN', 'CE', 1582));

        switchTo('GREGORIAN');
        switchTo('JULIAN');

        expect(component.value?.month).toBeUndefined();
        expect(component.value?.day).toBeUndefined();
      });

      it('measures a second switch from the stored value rather than from the first conversion', () => {
        editExisting(new KnoraDate('JULIAN', 'CE', 1582, 6, 15));

        switchTo('GREGORIAN');
        const afterFirst = component.value;
        switchTo('ISLAMIC');
        switchTo('GREGORIAN');

        expect(component.value?.day).toBe(afterFirst?.day);
        expect(component.value?.month).toBe(afterFirst?.month);
        expect(component.value?.year).toBe(afterFirst?.year);
      });

      it('reports that conversions still measure from the stored value', () => {
        editExisting(new KnoraDate('JULIAN', 'CE', 1582, 6, 15));

        switchTo('GREGORIAN');

        expect(component.isBaseTheStoredValue()).toBe(true);
      });

      it('measures from the user entry once they edit a date field', () => {
        editExisting(new KnoraDate('JULIAN', 'CE', 1582, 6, 15));
        switchTo('GREGORIAN');

        component.form.controls['year'].setValue(1600);
        fixture.detectChanges();

        expect(component.isBaseTheStoredValue()).toBe(false);
      });

      it('does not undo that edit on the next switch', () => {
        // Without the rebase, switching after an edit would convert the stored 1582 again and
        // throw the user's 1600 away.
        editExisting(new KnoraDate('JULIAN', 'CE', 1582, 6, 15));
        switchTo('GREGORIAN');
        component.form.controls['year'].setValue(1600);
        fixture.detectChanges();

        switchTo('JULIAN');

        expect(component.value?.year).not.toBe(1582);
      });
    });

    describe('adding a new value', () => {
      it('converts from the current entry, drift included', () => {
        // No stored value to measure from: the user is choosing the date, so each switch converts
        // what is on screen and the round trip genuinely shifts an imprecise date.
        component.value = new KnoraDate('JULIAN', 'CE', 1582);
        fixture.detectChanges();

        switchTo('GREGORIAN');
        switchTo('JULIAN');

        expect(component.value?.year).toBe(1581);
      });

      it('has no stored value to report as the conversion basis', () => {
        component.value = new KnoraDate('JULIAN', 'CE', 1582);
        fixture.detectChanges();

        expect(component.isBaseTheStoredValue()).toBe(false);
      });
    });

    describe('the status line', () => {
      it('reads unchanged while only the calendar was switched', () => {
        // This has to agree with the save gate, which compares instants: a calendar switch alone
        // must not promise a save the gate will then refuse (REQ-3.9).
        editExisting(new KnoraDate('JULIAN', 'CE', 1582, 6, 15));

        switchTo('GREGORIAN');

        expect(component.isUnchangedFromStored()).toBe(true);
      });

      it('reads changed once the user edits a date field', () => {
        editExisting(new KnoraDate('JULIAN', 'CE', 1582, 6, 15));

        component.form.controls['year'].setValue(1600);
        fixture.detectChanges();

        expect(component.isUnchangedFromStored()).toBe(false);
      });

      it('reports nothing about a stored value while adding', () => {
        component.value = new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15);
        fixture.detectChanges();

        expect(component.isUnchangedFromStored()).toBe(false);
      });
    });
  });

  describe('today (DEV-7372)', () => {
    it('enters today in the calendar selected, via the same conversion as everything else', () => {
      // Previously derived from `Intl`'s Umm al-Qura calendar, which is astronomical where this
      // app's Islamic calendar is tabular — "Today" entered a date two days from the one the
      // viewer would display back for it.
      const now = new Date();
      component.calendar = 'ISLAMIC';

      component.setToday();

      const service = TestBed.inject(CalendarDateService);
      const expected = service.convertKnoraDateTo(
        new KnoraDate('GREGORIAN', 'CE', now.getFullYear(), now.getMonth() + 1, now.getDate()),
        'ISLAMIC'
      )?.start;
      expect(component.year).toBe(expected?.year);
      expect(component.month).toBe(expected?.month);
      expect(component.day).toBe(expected?.day);
    });

    it('enters the system date unchanged for Gregorian', () => {
      const now = new Date();
      component.calendar = 'GREGORIAN';

      component.setToday();

      expect(component.year).toBe(now.getFullYear());
      expect(component.month).toBe(now.getMonth() + 1);
      expect(component.day).toBe(now.getDate());
    });

    it('drops the era for Islamic, which has none', () => {
      component.calendar = 'ISLAMIC';

      component.setToday();

      expect(component.era).toBe('noEra');
    });
  });

  describe('the calendar input an owner drives (DEV-7372)', () => {
    // A period's calendar belongs to the whole value, so the handler renders one control and pushes
    // the result down through `[calendar]`. That input used to write the new calendar over the
    // existing numerals — relabelling 01.04.2020 Gregorian as 01.04.2020 Julian, a different day.
    // It was harmless while the input only arrived alongside an already-converted value; once both
    // ends of a period took their calendar from one control, the ordering was not guaranteed.

    const driveCalendar = (calendar: string) => {
      component.calendar = calendar;
      component.ngOnChanges({
        calendar: { currentValue: calendar, previousValue: null, firstChange: false },
      } as never);
      fixture.detectChanges();
    };

    beforeEach(() => {
      component.disableCalendarSelector = true;
    });

    it('converts the date rather than relabelling it', () => {
      component.value = new KnoraDate('GREGORIAN', 'CE', 2020, 4, 1);
      fixture.detectChanges();

      driveCalendar('JULIAN');

      expect(component.value?.calendar).toBe('JULIAN');
      expect([component.value?.day, component.value?.month]).toEqual([19, 3]);
    });

    it('leaves the numerals changed, which is what distinguishes a conversion from a relabel', () => {
      component.value = new KnoraDate('GREGORIAN', 'CE', 2020, 4, 1);
      fixture.detectChanges();

      driveCalendar('JULIAN');

      const relabelled = component.value?.day === 1 && component.value?.month === 4;
      expect(relabelled).toBe(false);
    });

    it('converts to Islamic rather than relabelling', () => {
      component.value = new KnoraDate('GREGORIAN', 'CE', 2020, 4, 1);
      fixture.detectChanges();

      driveCalendar('ISLAMIC');

      expect(component.value?.calendar).toBe('ISLAMIC');
      expect(component.value?.year).toBe(1441);
    });

    it('does nothing when the calendar it is told is the one it already shows', () => {
      component.value = new KnoraDate('GREGORIAN', 'CE', 2020, 4, 1);
      fixture.detectChanges();

      driveCalendar('GREGORIAN');

      expect([component.value?.day, component.value?.month, component.value?.year]).toEqual([1, 4, 2020]);
    });

    it('survives being told a calendar before it holds a value', () => {
      // The period's end picker is rendered before an end date exists.
      expect(() => driveCalendar('JULIAN')).not.toThrow();
    });
  });

  describe('a day the month cannot hold (DEV-7372)', () => {
    // The picker used to keep a stranded day while rendering an empty grid, and save it. dsp-api
    // accepts such a date and silently shifts it into the next month (DEV-7428), so an impossible
    // date could be entered, stored as a different day, and read back changed, unreported.
    //
    // It is cleared rather than moved: 31 January is not evidence the user meant 28 February.

    it('clears a day when the month no longer holds it', () => {
      component.value = new KnoraDate('GREGORIAN', 'CE', 2024, 1, 31);
      fixture.detectChanges();

      component.form.controls['month'].setValue(2);
      fixture.detectChanges();

      expect(component.value?.day).toBeUndefined();
      expect(component.value?.month).toBe(2);
    });

    it('degrades to month precision rather than leaving a stale day', () => {
      component.value = new KnoraDate('GREGORIAN', 'CE', 2024, 1, 31);
      fixture.detectChanges();

      component.form.controls['month'].setValue(2);
      fixture.detectChanges();

      expect(component.value?.precision).toBe(Precision.monthPrecision);
    });

    it('clears a leap day when the year is no longer a leap year', () => {
      component.value = new KnoraDate('GREGORIAN', 'CE', 2024, 2, 29);
      fixture.detectChanges();

      component.form.controls['year'].setValue(2025);
      fixture.detectChanges();

      expect(component.value?.day).toBeUndefined();
    });

    it('clears an Islamic day the month cannot hold', () => {
      // Islamic months alternate 30/29, so month 2 has 29 days.
      component.value = new KnoraDate('ISLAMIC', 'noEra', 1445, 1, 30);
      fixture.detectChanges();

      component.form.controls['month'].setValue(2);
      fixture.detectChanges();

      expect(component.value?.day).toBeUndefined();
    });

    it('clears a day written in impossible, with no edit at all', () => {
      // 5 CE is not a leap year. This arrives already impossible rather than being made so by an
      // edit, and was the case the first guard missed: `value` reads back from the form, which
      // still held the day the grid had already rejected.
      component.value = new KnoraDate('GREGORIAN', 'CE', 5, 2, 29);
      fixture.detectChanges();

      expect(component.value?.day).toBeUndefined();
      expect(component.value?.month).toBe(2);
    });

    it('keeps a day the new month can hold', () => {
      // The guard must not clear more than it must.
      component.value = new KnoraDate('GREGORIAN', 'CE', 2024, 1, 29);
      fixture.detectChanges();

      component.form.controls['month'].setValue(3);
      fixture.detectChanges();

      expect(component.value?.day).toBe(29);
    });

    it('keeps a legal day written straight in', () => {
      component.value = new KnoraDate('GREGORIAN', 'CE', 2024, 2, 29);
      fixture.detectChanges();

      expect(component.value?.day).toBe(29);
    });

    it('never produces a day outside its month when converting', () => {
      // Conversion goes through JDN, so it cannot strand a day. Pinned so a future change to the
      // conversion path cannot quietly acquire the defect the edit path had.
      for (const month of [1, 3, 5, 7, 9, 11]) {
        component.value = new KnoraDate('GREGORIAN', 'CE', 2024, month, 28);
        fixture.detectChanges();
        component.form.controls['calendar'].setValue('ISLAMIC');
        fixture.detectChanges();

        const converted = component.value!;
        const daysInMonth = component.calculateDaysInMonth('ISLAMIC', converted.year, converted.month!);
        expect(converted.day!).toBeLessThanOrEqual(daysInMonth);

        component.form.controls['calendar'].setValue('GREGORIAN');
        fixture.detectChanges();
      }
    });
  });

  describe('naming the calendar (DEV-7372)', () => {
    // The app implements the tabular Islamic calendar, and so does dsp-api, but neither says so.
    // A bare "Islamic" presents one of several normative schemes as *the* Islamic date, which for
    // historical material is a claim the software cannot back (DEV-7429).
    const ISLAMIC_KEY = 'ui.calendarMarker.calendars.ISLAMIC';

    beforeEach(() => {
      const translate = TestBed.inject(TranslateService);
      translate.setTranslation('en', {
        ui: { calendarMarker: { calendars: { ISLAMIC: 'Islamic (tabular)', GREGORIAN: 'Gregorian' } } },
      });
      translate.use('en');
    });

    it('names the Islamic scheme when stating a date with its calendar', () => {
      const date = new KnoraDate('ISLAMIC', 'noEra', 1445, 12, 8);

      expect(component.transform(date, 'dd.MM.YYYY', 'all')).toContain('Islamic (tabular)');
    });

    it('names the scheme when stating the calendar alone', () => {
      const date = new KnoraDate('ISLAMIC', 'noEra', 1445, 12, 8);

      expect(component.transform(date, 'dd.MM.YYYY', 'calendarOnly')).toBe('Islamic (tabular)');
    });

    it('leaves a gravsearch literal bare, because dsp-api parses it', () => {
      // The single most dangerous line in this change: the bracketed name in a query literal would
      // break every date search in the app.
      const date = new KnoraDate('ISLAMIC', 'noEra', 1445, 12, 8);

      const literal = component.transform(date, 'YYYY-MM-dd', 'gravsearch');

      expect(literal).toContain('ISLAMIC:');
      expect(literal).not.toContain('tabular');
      expect(literal).not.toContain('(');
    });

    it('leaves a Gregorian gravsearch literal bare too', () => {
      const date = new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15);

      expect(component.transform(date, 'YYYY-MM-dd', 'gravsearch')).toContain('GREGORIAN:');
    });

    it('translates the calendar name rather than printing English in every language', () => {
      // This line was title-cased English regardless of locale, for all three calendars.
      const date = new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15);

      expect(component.transform(date, 'dd.MM.YYYY', 'calendarOnly')).toBe('Gregorian');
    });

    it('falls back to title case when a calendar has no translation', () => {
      // Guards the fallback: a missing key must not surface a raw i18n path to a reader.
      expect(component.calendarName('JULIAN')).toBe('Julian');
      expect(component.calendarName('JULIAN')).not.toContain(ISLAMIC_KEY);
      expect(component.calendarName('JULIAN')).not.toContain('ui.');
    });
  });

  describe('what the panel states (DEV-7372)', () => {
    // The panel lives in a mat-menu, so it is not in the component's own DOM until the menu is
    // opened and Material has attached it to the overlay container.
    const openPanel = () => {
      fixture.detectChanges();
      component.popover.openMenu();
      fixture.detectChanges();
    };
    const panelText = () => {
      openPanel();
      return document.querySelector('.date-picker-content')?.textContent ?? '';
    };
    const query = (hook: string) => {
      openPanel();
      return document.querySelector(`[data-cy="${hook}"]`);
    };

    it('says nothing about a stored value while adding', () => {
      component.value = new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15);

      expect(query('stored-value-line')).toBeNull();
      expect(query('save-status')).toBeNull();
    });

    it('holds back "will be stored as" until a date is entered', () => {
      // The add path opens on an empty picker; promising to store something before the user has
      // chosen anything states a value that does not exist.
      expect(query('will-be-stored')).toBeNull();
    });

    it('states what will be stored once a date is entered', () => {
      component.value = new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15);

      expect(query('will-be-stored')).not.toBeNull();
    });

    it('offers the calendar on a standalone picker, as advanced search renders it', () => {
      // Advanced search renders `app-date-picker` bare, with no `disableCalendarSelector`, so the
      // control has to stay in the picker and be suppressed for a period rather than moved out.
      component.value = new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15);

      expect(query('calendar-select')).not.toBeNull();
      expect(query('calendar-tag')).toBeNull();
    });

    it('states the calendar instead of offering it where the value owns it', () => {
      // A period carries one calendar for the whole value, so the handler renders one control
      // above both ends and each picker only names it.
      component.disableCalendarSelector = true;
      component.value = new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15);

      expect(query('calendar-select')).toBeNull();
      expect(query('calendar-tag')).not.toBeNull();
    });

    it('opens the menu so the panel can be asserted at all', () => {
      // Guards the assumption the rest of this block rests on: these hooks live inside the
      // mat-menu, and the "absent" assertions above would pass vacuously if it never rendered.
      // Asserts the day grid rather than the date text — no translation catalogue is loaded here,
      // so interpolated strings render as bare keys.
      component.value = new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15);

      expect(panelText()).toContain('Jun');
    });
  });
});
