import { JsonObject, JsonProperty } from 'json2typescript';
import { Constants } from '../../../Constants';
import { IBaseDateValue } from '../type-specific-interfaces/base-date-value';
import { ReadValue } from './read-value';

/**
 * @category Internal
 */
@JsonObject('ReadDateValue')
export class ParseReadDateValue extends ReadValue implements IBaseDateValue {
  @JsonProperty(Constants.ValueAsString, String)
  datestring: string = '';

  @JsonProperty(Constants.DateValueHasCalendar, String)
  calendar: string = '';

  @JsonProperty(Constants.DateValueHasStartDay, Number, true)
  startDay?: number = undefined;

  @JsonProperty(Constants.DateValueHasStartMonth, Number, true)
  startMonth?: number = undefined;

  @JsonProperty(Constants.DateValueHasStartYear, Number)
  startYear: number = 0;

  @JsonProperty(Constants.DateValueHasStartEra, String, true)
  startEra?: string = undefined;

  @JsonProperty(Constants.DateValueHasEndDay, Number, true)
  endDay?: number = undefined;

  @JsonProperty(Constants.DateValueHasEndMonth, Number, true)
  endMonth?: number = undefined;

  @JsonProperty(Constants.DateValueHasEndYear, Number)
  endYear: number = 0;

  @JsonProperty(Constants.DateValueHasEndEra, String, true)
  endEra?: string = undefined;
}

/**
 * Precision of a date.
 *
 * @category Model V2
 */
export enum Precision {
  /**
   * Year precision (first to last day of the year).
   */
  yearPrecision,

  /**
   * Month precision (first to last day of the month).
   */
  monthPrecision,

  /**
   * Day precision.
   */
  dayPrecision,
}

/**
 * Represents a Salsah date object with a precision information.
 *
 * @category Model V2
 */
export class KnoraDate {
  // TODO: support instantiation of a JDNConvertibleCalendar subclass, e.g., GregorianCalendarDate

  private static separator = '-';

  readonly precision: Precision;

  constructor(
    readonly calendar: string,
    readonly era: string,
    readonly year: number,
    readonly month?: number,
    readonly day?: number
  ) {
    if (this.month === undefined) {
      // year precision
      this.precision = Precision.yearPrecision;
    } else if (this.day === undefined) {
      // month precision
      this.precision = Precision.monthPrecision;
    } else {
      // day precision
      this.precision = Precision.dayPrecision;
    }
  }
}

/**
 * Represents a period (with start date and end date).
 *
 * @category Model V2
 */
export class KnoraPeriod {
  constructor(
    readonly start: KnoraDate,
    readonly end: KnoraDate
  ) {}
}

/**
 * @category Model V2
 */
export class ReadDateValue extends ReadValue {
  date: KnoraDate | KnoraPeriod;

  constructor(date: ParseReadDateValue) {
    super(
      date.id,
      date.type,
      date.attachedToUser,
      date.arkUrl,
      date.versionArkUrl,
      date.valueCreationDate,
      date.hasPermissions,
      date.userHasPermission,
      date.uuid,
      date.propertyLabel,
      date.propertyComment,
      date.property,
      date.datestring,
      date.valueHasComment
    );

    if (
      date.startYear === date.endYear &&
      date.startMonth === date.endMonth &&
      date.startDay === date.endDay &&
      date.startEra === date.endEra
    ) {
      // single date

      this.date = new KnoraDate(
        date.calendar,
        this.handleEra(date.startEra),
        date.startYear,
        date.startMonth,
        date.startDay
      );
    } else {
      // date period

      this.date = new KnoraPeriod(
        new KnoraDate(date.calendar, this.handleEra(date.startEra), date.startYear, date.startMonth, date.startDay),
        new KnoraDate(date.calendar, this.handleEra(date.endEra), date.endYear, date.endMonth, date.endDay)
      );
    }
  }

  /**
   * Determines if an era is given.
   * Returns "noEra" in case none is given (the given calendar date does not have an era).
   *
   * @param era given era, if any.
   */
  private handleEra(era?: string): string {
    // determine era
    if (era !== undefined) {
      return era;
    } else {
      return 'noEra';
    }
  }
}
