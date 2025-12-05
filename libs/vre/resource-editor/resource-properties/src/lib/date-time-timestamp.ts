import { DatePipe } from '@angular/common';
import { DateTime } from './date-time';

function userInputToTimestamp(userInput: DateTime): string {
  const splitTime = userInput.time.split(':');

  // Create a new Date with the date and time components
  const updateDate = new Date(userInput.date);
  updateDate.setHours(Number(splitTime[0]), Number(splitTime[1]), 0, 0);

  return `${updateDate.toISOString().split('.')[0]}Z`;
}

export function dateTimeTimestamp(date: Date, time: string) {
  const userInput = new DateTime(date, time);
  return userInputToTimestamp(userInput);
}

export function convertTimestampToDateTime(timestamp: string, datePipe: DatePipe): DateTime {
  const date = new Date(timestamp);
  const time = datePipe.transform(timestamp, 'HH:mm');

  return new DateTime(date, time!);
}
