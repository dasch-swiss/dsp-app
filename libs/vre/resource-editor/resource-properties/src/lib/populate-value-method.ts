import { CreateDateValue, KnoraDate, KnoraPeriod, UpdateDateValue } from '@dasch-swiss/dsp-js';

export function populateValue(value: UpdateDateValue | CreateDateValue, dateOrPeriod: KnoraDate | KnoraPeriod) {
  if (dateOrPeriod instanceof KnoraDate) {
    value.calendar = dateOrPeriod.calendar;
    value.startEra = dateOrPeriod.era !== 'noEra' ? dateOrPeriod.era : undefined;
    value.startDay = dateOrPeriod.day;
    value.startMonth = dateOrPeriod.month;
    value.startYear = dateOrPeriod.year;

    value.endEra = value.startEra;
    value.endDay = value.startDay;
    value.endMonth = value.startMonth;
    value.endYear = value.startYear;
  } else if (dateOrPeriod instanceof KnoraPeriod) {
    value.calendar = dateOrPeriod.start.calendar;

    value.startEra = dateOrPeriod.start.era !== 'noEra' ? dateOrPeriod.start.era : undefined;
    value.startDay = dateOrPeriod.start.day;
    value.startMonth = dateOrPeriod.start.month;
    value.startYear = dateOrPeriod.start.year;

    value.endEra = dateOrPeriod.end.era !== 'noEra' ? dateOrPeriod.end.era : undefined;
    value.endDay = dateOrPeriod.end.day;
    value.endMonth = dateOrPeriod.end.month;
    value.endYear = dateOrPeriod.end.year;
  }
}
