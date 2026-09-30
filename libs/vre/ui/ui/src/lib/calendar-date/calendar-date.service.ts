import { inject, Injectable } from '@angular/core';
import { KnoraDate, KnoraPeriod, Precision } from '@dasch-swiss/dsp-js';
import {
  CALENDAR_SYSTEMS,
  CalendarDate,
  CalendarSystem,
  convertCalendarResult,
  createDate,
  getCalendar,
  isEqual,
} from '@dasch-swiss/vre/shared/calendar';
import { TranslateService } from '@ngx-translate/core';

/**
 * A date value seen through a calendar other than the one it is stored in.
 *
 * `end` is present only when the source covers a range in the target calendar — a Julian year
 * straddling two Gregorian ones, say. Keeping it optional is what stops a caller printing a single
 * date for something the source never pinned down that precisely.
 */
export interface ConvertedKnoraDate {
  readonly start: KnoraDate;
  readonly end?: KnoraDate;
}

/** One month laid out for a day grid: `0` is a leading blank, everything else is a day number. */
export interface MonthGrid {
  readonly weeks: number[][];
}

/**
 * Every calendar question the date picker asks, in one place.
 *
 * This exists because the arithmetic used to live inside a 988-line component that also rendered a
 * popover, implemented `ControlValueAccessor`, and knew what a period was. Conversions written
 * against component fields could disagree with the same component's form state, and three
 * successive fixes for one relabelling bug each passed their tests and each failed in a browser.
 *
 * Nothing here holds state or touches a component. Given the same arguments it returns the same
 * answer, which is what makes it testable at the level the defect actually lived at.
 *
 * The arithmetic itself belongs to `@dasch-swiss/vre/shared/calendar`; this service adapts it to
 * `KnoraDate` — precision, era, and the astronomical-year convention — and formats the result.
 */
@Injectable({ providedIn: 'root' })
export class CalendarDateService {
  /**
   * The translate service, when there is an injector to ask for one.
   *
   * `{ optional: true }` is not enough on its own: it covers a missing *provider*, but `inject()`
   * still throws NG0203 when called outside an injection context at all — which is exactly the case
   * this has to survive, because the date viewer constructs this service's consumers with `new`.
   * Hence the try/catch. Without a service the calendar name falls back to title case, as it
   * rendered before translation existed.
   */
  private readonly _translate = CalendarDateService._injectTranslateIfPossible();

  private static _injectTranslateIfPossible(): TranslateService | null {
    try {
      return inject(TranslateService, { optional: true });
    } catch {
      return null;
    }
  }

  // ---------------------------------------------------------------------------------------------
  // Converting
  // ---------------------------------------------------------------------------------------------

  /**
   * the same day, expressed in another calendar.
   *
   * `undefined` where the target cannot express it — an Islamic reading of a date before the Hijra.
   * A range comes back with both ends when the source covers one: a Julian year is two Gregorian
   * ones, and reporting only the first would claim a precision the source never had.
   */
  convertKnoraDateTo(date: KnoraDate, calendar: CalendarSystem): ConvertedKnoraDate | undefined {
    const result = convertCalendarResult(this.createJDNCalendarDateFromKnoraDate(date), calendar);

    if (result.kind === 'refused') {
      return undefined;
    }
    if (result.kind === 'exact') {
      return { start: this.createKnoraDateFromCalendarDate(result.date) };
    }
    return {
      start: this.createKnoraDateFromCalendarDate(result.start),
      end: this.createKnoraDateFromCalendarDate(result.end),
    };
  }

  /**
   * which calendars a date value can be shown in.
   *
   * The stored calendar is always among them. A period is representable only where both of its ends
   * are, because a period carries one calendar for the whole value.
   */
  availableCalendarsFor(value: KnoraDate | KnoraPeriod): CalendarSystem[] {
    const dates = value instanceof KnoraPeriod ? [value.start, value.end] : [value];

    return CALENDAR_SYSTEMS.filter(calendar =>
      dates.every(date => this.convertKnoraDateTo(date, calendar) !== undefined)
    );
  }

  /**
   * today, in the calendar asked for.
   *
   * Today is a Gregorian fact — that is what the system clock reports — and every other calendar is
   * reached by the same conversion as everything else. That matters more than it looks: a previous
   * implementation derived Islamic today from `Intl.DateTimeFormat`'s observational calendar while
   * the rest of the app used the tabular civil one, and on roughly 0.9% of days produced a date
   * with no cell in the picker's own grid.
   */
  today(calendar: CalendarSystem): KnoraDate | undefined {
    const now = new Date();
    const gregorian = new KnoraDate('GREGORIAN', 'CE', now.getFullYear(), now.getMonth() + 1, now.getDate());

    return calendar === 'GREGORIAN' ? gregorian : this.convertKnoraDateTo(gregorian, calendar)?.start;
  }

  // ---------------------------------------------------------------------------------------------
  // Comparing
  // ---------------------------------------------------------------------------------------------

  /**
   * whether two dates denote the same instant, whatever calendar represents them.
   *
   * Converting a date rewrites every field while meaning the same day: 15.06.2024 Gregorian and
   * 02.06.2024 Julian are one instant. Comparing fields therefore reports a change the user never
   * made, which is why a calendar switch must be measured this way — the save gate depends on it.
   *
   * Precision is part of what a date says, so a year and a day inside it are not the same instant.
   */
  knoraDatesDenoteSameInstant(a: KnoraDate, b: KnoraDate): boolean {
    if (a.precision !== b.precision) {
      return false;
    }
    return isEqual(this.createJDNCalendarDateFromKnoraDate(a), this.createJDNCalendarDateFromKnoraDate(b));
  }

  /** the same question for a whole value, which may be a period. */
  dateValuesDenoteSameInstant(
    a: KnoraDate | KnoraPeriod | null | undefined,
    b: KnoraDate | KnoraPeriod | null | undefined
  ): boolean {
    if (a == null || b == null) {
      return a == null && b == null;
    }
    if (a instanceof KnoraPeriod !== b instanceof KnoraPeriod) {
      return false;
    }
    if (a instanceof KnoraPeriod && b instanceof KnoraPeriod) {
      return this.knoraDatesDenoteSameInstant(a.start, b.start) && this.knoraDatesDenoteSameInstant(a.end, b.end);
    }
    return this.knoraDatesDenoteSameInstant(a as KnoraDate, b as KnoraDate);
  }

  // ---------------------------------------------------------------------------------------------
  // Months and grids
  // ---------------------------------------------------------------------------------------------

  /** how many days a month holds, in the calendar and year given. */
  daysInMonth(calendar: string, year: number, month: number): number {
    const calendarSystem = calendar.toUpperCase() as CalendarSystem;
    return getCalendar(calendarSystem).daysInMonth(year, month);
  }

  /**
   * one month laid out for a day grid, as rows of seven.
   *
   * `0` pads the first row so the 1st lands under its weekday, in every calendar and every era.
   *
   * October 1582 is a special case with a special cause: the Gregorian reform deleted ten days, so
   * that month runs 1–4 then 15–31 and holds 21 days. It applies only to GREGORIAN/CE — the Julian
   * calendar had no reform, and a BCE October is untouched.
   */
  monthGrid(calendar: string, era: string, year: number, month: number): MonthGrid {
    const yearAstro = this.convertHistoricalYearToAstronomicalYear(year, era);
    const calendarSystem = calendar.toUpperCase() as CalendarSystem;
    let days = this.daysInMonth(calendarSystem, yearAstro, month);

    const cells: number[] = [];

    for (let i = 1; i < this._firstWeekdayOfMonth(calendarSystem, yearAstro, month); i++) {
      cells.push(0);
    }

    for (let i = 1; i <= days; i++) {
      if (calendar === 'GREGORIAN' && year === 1582 && month === 10 && i === 5 && era === 'CE') {
        i = 15;
        days = 31;
      }
      cells.push(i);
    }

    const weeks: number[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7));
    }
    return { weeks };
  }

  /**
   * which weekday the 1st falls on, 1 = Monday.
   *
   * Counted from the Julian Day Number, which is a continuous day count: JDN 0 was a Monday, so
   * `jdn % 7` is the weekday with no calendar knowledge of its own. Every calendar the library
   * supports already converts to JDN — it is how conversion and comparison work — so this needs no
   * rule per calendar, no branch at the Gregorian reform, and no special case for BCE or for a
   * calendar without an era.
   *
   * It replaces hand-written Zeller-style arithmetic that was fed the *historical* year while the
   * day count beside it used the astronomical one, and whose caller skipped padding entirely
   * unless the era was CE. A BCE month therefore started every row on Monday, and 20.09.100 BCE
   * Julian — a Wednesday — was drawn as a Saturday (DEV-7372).
   *
   * `year` is astronomical here, as the library expects: 100 BCE is -99.
   */
  private _firstWeekdayOfMonth(calendar: CalendarSystem, yearAstro: number, month: number): number {
    const firstOfMonth = createDate(
      calendar,
      yearAstro,
      month,
      1,
      calendar === 'ISLAMIC' ? 'NONE' : yearAstro <= 0 ? 'BCE' : 'CE'
    );
    const jdn = getCalendar(calendar).toJDN(firstOfMonth);

    // JavaScript's % keeps the sign of the dividend, and a proleptic date can land on a negative
    // JDN, so the result is normalised into 0..6 before being shifted to 1 = Monday.
    return (((jdn % 7) + 7) % 7) + 1;
  }

  // ---------------------------------------------------------------------------------------------
  // Years and eras
  // ---------------------------------------------------------------------------------------------

  /**
   * the astronomical year for a historical one.
   *
   * Historical reckoning has no year zero, so 1 BCE is astronomical 0 and 44 BCE is −43. Getting
   * this inverse backwards took down the adapter removed in #3441.
   */
  convertHistoricalYearToAstronomicalYear(year: number, era: string): number {
    return era === 'BCE' ? year * -1 + 1 : year;
  }

  /** the historical year and era for an astronomical one; Islamic has no era at all. */
  convertAstronomicalYearToHistoricalYear(yearAstro: number, calendar: CalendarSystem): { year: number; era: string } {
    if (calendar === 'ISLAMIC') {
      return { year: yearAstro, era: 'noEra' };
    }
    return yearAstro <= 0 ? { year: yearAstro * -1 + 1, era: 'BCE' } : { year: yearAstro, era: 'CE' };
  }

  // ---------------------------------------------------------------------------------------------
  // Crossing between KnoraDate and the calendar library
  // ---------------------------------------------------------------------------------------------

  /** a `KnoraDate` as the calendar library's own date, at whatever precision it carries. */
  createJDNCalendarDateFromKnoraDate(date: KnoraDate): CalendarDate {
    const yearAstro = this.convertHistoricalYearToAstronomicalYear(date.year, date.era);
    const calendarSystem = date.calendar.toUpperCase() as CalendarSystem;
    const era = date.era === 'BCE' ? 'BCE' : date.era === 'noEra' ? 'NONE' : 'CE';

    if (date.precision === Precision.dayPrecision) {
      return createDate(calendarSystem, yearAstro, date.month!, date.day!, era as never);
    }
    if (date.precision === Precision.monthPrecision) {
      return createDate(calendarSystem, yearAstro, date.month!, undefined, era as never);
    }
    if (date.precision === Precision.yearPrecision) {
      return createDate(calendarSystem, yearAstro, undefined, undefined, era as never);
    }
    throw Error('Invalid precision');
  }

  /**
   * the inverse.
   *
   * The two type systems spell the absent era differently — `NONE` there, `noEra` in `KnoraDate` —
   * so the mapping is explicit rather than incidental.
   */
  createKnoraDateFromCalendarDate(date: CalendarDate): KnoraDate {
    const { year, era } = this.convertAstronomicalYearToHistoricalYear(date.year, date.calendar);
    return new KnoraDate(date.calendar, era, year, date.month, date.day);
  }

  // ---------------------------------------------------------------------------------------------
  // Formatting
  // ---------------------------------------------------------------------------------------------

  /** a date as text, optionally carrying its era, its calendar, or both. */
  format(
    date: KnoraDate,
    formatPattern?: string,
    displayOptions?: 'era' | 'calendar' | 'calendarOnly' | 'gravsearch' | 'all'
  ): string {
    if (!(date instanceof KnoraDate)) {
      return '';
    }

    const formatted = this.formatPattern(date, formatPattern);
    return displayOptions ? this.addDisplayOptions(date, formatted, displayOptions) : formatted;
  }

  /** the numerals alone, in the requested pattern, at the date's own precision. */
  formatPattern(date: KnoraDate, format: string | undefined): string {
    const d = this._pad(date.day);
    const m = this._pad(date.month);

    switch (format) {
      case 'dd-MM-YYYY':
        if (date.precision === 2) return `${d}-${m}-${date.year}`;
        if (date.precision === 1) return `${m}-${date.year}`;
        return `${date.year}`;
      case 'MM/dd/YYYY':
        if (date.precision === 2) return `${m}/${d}/${date.year}`;
        if (date.precision === 1) return `${m}/${date.year}`;
        return `${date.year}`;
      case 'YYYY-MM-dd':
        if (date.precision === 2) return `${date.year}-${m}-${d}`;
        if (date.precision === 1) return `${date.year}-${m}`;
        return `${date.year}`;
      case 'dd.MM.YYYY':
      default:
        if (date.precision === 2) return `${d}.${m}.${date.year}`;
        if (date.precision === 1) return `${m}.${date.year}`;
        return `${date.year}`;
    }
  }

  /**
   * appends the era, the calendar, or both.
   *
   * `gravsearch` is not a display option despite living here: it emits the literal dsp-api parses,
   * so its calendar name stays bare and untranslated. Putting a human-readable name in that branch
   * would break every date query in the app.
   */
  addDisplayOptions(date: KnoraDate, value: string, options: string): string {
    switch (options) {
      case 'era':
        return value + (date.era === 'noEra' ? '' : date.era === 'BCE' || date.era === 'AD' ? ` ${date.era}` : '');
      case 'calendar':
        return `${value} ${this.calendarName(date.calendar)}`;
      case 'calendarOnly':
        return this.calendarName(date.calendar);
      case 'gravsearch':
        return `${date.calendar}:${value}${date.era === 'BCE' ? ' BCE' : ''}`;
      case 'all':
        return `${value + (date.era === 'noEra' ? '' : date.era === 'BCE' ? ` ${date.era}` : '')} ${this.calendarName(date.calendar)}`;
      default:
        return '';
    }
  }

  /**
   * the calendar's name as a reader should see it.
   *
   * Translated rather than title-cased: the name was English in every language before, and the
   * Islamic entry states *which* Islamic calendar this is — there are several and they disagree by
   * a day or two, so a bare "Islamic" claims more than the app can back (DEV-7429).
   */
  calendarName(calendar: string): string {
    const key = `ui.calendarMarker.calendars.${calendar.toUpperCase()}`;
    const translated = this._translate?.instant(key);
    return translated && translated !== key ? translated : this._titleCase(calendar);
  }

  private _pad(value: number | undefined): string {
    return value !== undefined ? `0${value}`.slice(-2) : '';
  }

  private _titleCase(str: string): string {
    return str
      .split(' ')
      .map(w => w[0].toUpperCase() + w.substring(1).toLowerCase())
      .join(' ');
  }
}
