import { inject, Pipe, PipeTransform } from '@angular/core';
import { KnoraDate } from '@dasch-swiss/dsp-js';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
  name: 'knoraDate',
})
export class KnoraDatePipe implements PipeTransform {
  /**
   * Optional because this pipe is also constructed directly with `new KnoraDatePipe()` — by the
   * date viewer and by its own spec — where there is no injector. Without a translate service the
   * calendar name falls back to title case, which is what it printed before.
   */
  private readonly _translate = inject(TranslateService, { optional: true });

  /**
   * The calendar's name as a reader should see it.
   *
   * Translated rather than title-cased: the name was previously English in every language, and the
   * Islamic entry now also states which Islamic calendar this is — there are several, and they
   * disagree by a day or two, so a bare "Islamic" claims more than the app can back (DEV-7429).
   */
  private _calendarName(calendar: string): string {
    const key = `ui.calendarMarker.calendars.${calendar.toUpperCase()}`;
    const translated = this._translate?.instant(key);
    return translated && translated !== key ? translated : this._titleCase(calendar);
  }
  transform(date: KnoraDate, format?: string, displayOptions?: 'era' | 'calendar' | 'calendarOnly' | 'all'): string {
    if (!(date instanceof KnoraDate)) {
      // console.error('Non-KnoraDate provided. Expected a valid KnoraDate');
      return '';
    }

    const formattedString = this.getFormattedString(date, format!);

    if (displayOptions) {
      return this.addDisplayOptions(date, formattedString, displayOptions);
    } else {
      return formattedString;
    }
  }

  // ensures that day and month are always two digits
  leftPadding(value: number): string | null {
    if (value !== undefined) {
      return `0${value}`.slice(-2);
    } else {
      return null;
    }
  }

  // add the era, calendar, or both to the result returned by the pipe
  addDisplayOptions(date: KnoraDate, value: string, options: string): string {
    switch (options) {
      case 'era':
        // displays date with era; era only in case of BCE
        return value + (date.era === 'noEra' ? '' : date.era === 'BCE' || date.era === 'AD' ? ` ${date.era}` : '');
      case 'calendar':
        // displays date without era but with calendar type
        return `${value} ${this._calendarName(date.calendar)}`;
      case 'calendarOnly':
        // displays only the selected calendar type without any data
        return this._calendarName(date.calendar);
      case 'all':
      default:
        // displays date with era (only as BCE) and selected calendar type
        return `${value + (date.era === 'noEra' ? '' : date.era === 'BCE' ? ` ${date.era}` : '')} ${this._calendarName(
          date.calendar
        )}`;
    }
  }

  getFormattedString(date: KnoraDate, format: string): string {
    switch (format) {
      case 'dd.MM.YYYY':
        if (date.precision === 2) {
          return `${this.leftPadding(date.day!)}.${this.leftPadding(date.month!)}.${date.year}`;
        } else if (date.precision === 1) {
          return `${this.leftPadding(date.month!)}.${date.year}`;
        } else {
          return `${date.year}`;
        }
      case 'dd-MM-YYYY':
        if (date.precision === 2) {
          return `${this.leftPadding(date.day!)}-${this.leftPadding(date.month!)}-${date.year}`;
        } else if (date.precision === 1) {
          return `${this.leftPadding(date.month!)}-${date.year}`;
        } else {
          return `${date.year}`;
        }
      case 'MM/dd/YYYY':
        if (date.precision === 2) {
          return `${this.leftPadding(date.month!)}/${this.leftPadding(date.day!)}/${date.year}`;
        } else if (date.precision === 1) {
          return `${this.leftPadding(date.month!)}/${date.year}`;
        } else {
          return `${date.year}`;
        }
      default:
        if (date.precision === 2) {
          return `${this.leftPadding(date.day!)}.${this.leftPadding(date.month!)}.${date.year}`;
        } else if (date.precision === 1) {
          return `${this.leftPadding(date.month!)}.${date.year}`;
        } else {
          return `${date.year}`;
        }
    }
  }

  /**
   * returns a string in Title Case format
   * It's needed to transform a calendar name e.g. 'GREGORIAN' into 'Gregorian'
   *
   * @param str
   * @returns string
   */
  private _titleCase(str: string): string {
    return str
      .split(' ')
      .map(w => w[0].toUpperCase() + w.substring(1).toLowerCase())
      .join(' ');
  }
}
