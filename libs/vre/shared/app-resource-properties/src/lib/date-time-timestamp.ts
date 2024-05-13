import { DatePipe } from '@angular/common';
import { CalendarDate, CalendarPeriod, GregorianCalendarDate } from '@dasch-swiss/jdnconvertiblecalendar';
import { DateTime } from './date-time';

function userInputToTimestamp(userInput: DateTime): string {
  const splitTime = userInput.time.split(':');

  // in a Javascript Date, the month is 0-based so we need to subtract 1
  const updateDate = new Date(
    userInput.date.toCalendarPeriod().periodStart.year,
    userInput.date.toCalendarPeriod().periodStart.month - 1,
    userInput.date.toCalendarPeriod().periodStart.day,
    Number(splitTime[0]),
    Number(splitTime[1])
  );

  return `${updateDate.toISOString().split('.')[0]}Z`;
}

export function dateTimeTimestamp(date: GregorianCalendarDate, time: string) {
  const userInput = new DateTime(date, time);
  return userInputToTimestamp(userInput);
}

export function convertTimestampToDateTime(timestamp: string, datePipe: DatePipe): DateTime {
  const calendarDate = new CalendarDate(
    Number(datePipe.transform(timestamp, 'y')),
    Number(datePipe.transform(timestamp, 'M')),
    Number(datePipe.transform(timestamp, 'd'))
  );

  const date = new GregorianCalendarDate(new CalendarPeriod(calendarDate, calendarDate));
  const time = datePipe.transform(timestamp, 'HH:mm');

  return new DateTime(date, time);
}
