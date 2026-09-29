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
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';

import { AppDatePickerComponent } from './app-date-picker.component';

/**
 * Characterisation tests: what the calendar arithmetic does **today**.
 *
 * These are written against the current implementation before it moves into a service, so the move
 * can be proved to change nothing. They describe behaviour rather than endorse it — where today's
 * answer looks surprising, the test records the surprise rather than correcting it. A failure here
 * after the extraction means the extraction altered behaviour, which is the one thing it must not
 * do.
 *
 * Two things they pin that had no coverage at all: the hand-written weekday offset with its 1582
 * branch, and the ten-day gap in October 1582 — different code doing different things, either of
 * which a rewrite could silently change.
 */
describe('calendar arithmetic, as it behaves today (characterisation)', () => {
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
        MatIconModule,
        MatInputModule,
        MatMenuModule,
        MatSelectModule,
        ReactiveFormsModule,
      ],
      providers: [Subject, provideTranslateService(), TranslateService],
    }).compileComponents();

    fixture = TestBed.createComponent(AppDatePickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  /**
   * `_setDays` is private; it is reached the way the component reaches it.
   *
   * It returns `weeks` only. `this.days` is **drained** while the weeks are built — the
   * implementation splices out of the same array it filled — so reading `component.days` afterwards
   * always yields an empty list. That is surprising enough to pin here: anything relying on `days`
   * after a render is relying on an empty array.
   */
  const setDays = (calendar: string, era: string, year: number, month: number) => {
    (component as unknown as { _setDays: (c: string, e: string, y: number, m: number) => void })._setDays(
      calendar,
      era,
      year,
      month
    );
    return { weeks: component.weeks, daysAfter: component.days, cells: component.weeks.flat() };
  };

  describe('month lengths', () => {
    it.each([
      ['GREGORIAN', 2024, 1, 31],
      ['GREGORIAN', 2024, 2, 29],
      ['GREGORIAN', 2025, 2, 28],
      ['GREGORIAN', 2024, 4, 30],
      ['GREGORIAN', 1900, 2, 28],
      ['GREGORIAN', 2000, 2, 29],
      ['JULIAN', 1900, 2, 29],
      ['JULIAN', 2024, 2, 29],
      ['ISLAMIC', 1445, 1, 30],
      ['ISLAMIC', 1445, 2, 29],
      ['ISLAMIC', 1445, 12, 30],
    ])('%s %i-%i has %i days', (calendar, year, month, expected) => {
      expect(component.calculateDaysInMonth(calendar as string, year as number, month as number)).toBe(expected);
    });

    it('differs between Julian and Gregorian on a century year, which is the whole point of the two', () => {
      expect(component.calculateDaysInMonth('JULIAN', 1900, 2)).toBe(29);
      expect(component.calculateDaysInMonth('GREGORIAN', 1900, 2)).toBe(28);
    });
  });

  describe('historical to astronomical year', () => {
    it.each([
      [2024, 'CE', 2024],
      [1, 'CE', 1],
      [1, 'BCE', 0],
      [44, 'BCE', -43],
      [754, 'BCE', -753],
    ])('%i %s is astronomical %i', (year, era, expected) => {
      expect(component.convertHistoricalYearToAstronomicalYear(year as number, era as string)).toBe(expected);
    });

    it('has no year zero in the historical reckoning, so 1 BCE is astronomical 0', () => {
      expect(component.convertHistoricalYearToAstronomicalYear(1, 'BCE')).toBe(0);
    });
  });

  describe('the day list', () => {
    /** Real day numbers, with the leading-blank padding zeros removed. */
    const dayNumbers = (cells: number[]) => cells.filter(d => d > 0);

    it('leaves `days` empty, because building the weeks drains it', () => {
      const { daysAfter } = setDays('GREGORIAN', 'CE', 2024, 6);

      expect(daysAfter).toEqual([]);
    });

    it('runs 1..n for an ordinary month', () => {
      const { cells } = setDays('GREGORIAN', 'CE', 2024, 6);
      const d = dayNumbers(cells);

      expect(d[0]).toBe(1);
      expect(d[d.length - 1]).toBe(30);
      expect(d.length).toBe(30);
    });

    it('skips ten days in October 1582, the Gregorian reform', () => {
      // The month jumps 4 -> 15. This is a different behaviour from the weekday branch below, and
      // a test that only names "the 1582 boundary" would cover one and miss this.
      const d = dayNumbers(setDays('GREGORIAN', 'CE', 1582, 10).cells);

      expect(d).toContain(4);
      expect(d).not.toContain(5);
      expect(d).not.toContain(14);
      expect(d).toContain(15);
    });

    it('renders October 1582 with 21 days rather than 31', () => {
      const d = dayNumbers(setDays('GREGORIAN', 'CE', 1582, 10).cells);

      expect(d.length).toBe(21);
    });

    it('does not skip those days in the Julian calendar, which had no reform', () => {
      const d = dayNumbers(setDays('JULIAN', 'CE', 1582, 10).cells);

      expect(d).toContain(5);
      expect(d.length).toBe(31);
    });

    it('does not skip them in a BCE October 1582 either, since the rule is era-specific', () => {
      const d = dayNumbers(setDays('GREGORIAN', 'BCE', 1582, 10).cells);

      expect(d).toContain(5);
    });
  });

  describe('the weekday offset', () => {
    // Hand-written arithmetic with a branch at the reform. Pinned by outcome: the number of leading
    // blanks in the first week is what positions the month in the grid.
    const leadingBlanks = (weeks: number[][]) => weeks[0].filter(d => d === 0).length;

    it('positions an ordinary modern month', () => {
      // 1 June 2024 was a Saturday, so five blanks precede it in a Monday-first grid.
      const { weeks } = setDays('GREGORIAN', 'CE', 2024, 6);

      expect(leadingBlanks(weeks)).toBe(5);
    });

    it('takes the pre-reform branch for an early Gregorian date', () => {
      const { weeks } = setDays('GREGORIAN', 'CE', 1500, 3);

      expect(leadingBlanks(weeks)).toBe(6);
    });

    it('takes that same branch for a Julian date of any year', () => {
      // Four blanks, not the five the Gregorian June 2024 grid gets: the Julian 1st falls on a
      // different weekday, which is exactly what the branch exists to express.
      const { weeks } = setDays('JULIAN', 'CE', 2024, 6);

      expect(leadingBlanks(weeks)).toBe(4);
    });

    it('omits the leading blanks entirely for a BCE date', () => {
      // The padding loop is gated on `era === 'CE'`, so a BCE month starts flush.
      const { weeks } = setDays('GREGORIAN', 'BCE', 44, 3);

      expect(leadingBlanks(weeks)).toBe(0);
    });

    it('builds a grid for an Islamic month', () => {
      const { weeks } = setDays('ISLAMIC', 'noEra', 1445, 1);

      expect(weeks.length).toBeGreaterThan(0);
      expect(weeks.flat().filter(d => d > 0).length).toBe(30);
    });
  });

  describe('a day the month cannot hold is cleared, not clamped', () => {
    it('drops a 31st when the month has 30 days', () => {
      component.day = 31;

      setDays('GREGORIAN', 'CE', 2024, 6);

      expect(component.day).toBeUndefined();
    });

    it('drops a 29 February when the year is not a leap year', () => {
      component.day = 29;

      setDays('GREGORIAN', 'CE', 2025, 2);

      expect(component.day).toBeUndefined();
    });

    it('keeps a day the month can hold', () => {
      component.day = 29;

      setDays('GREGORIAN', 'CE', 2024, 2);

      expect(component.day).toBe(29);
    });
  });
});
