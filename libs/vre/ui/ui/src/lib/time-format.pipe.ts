import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeFormat',
})
export class TimeFormatPipe implements PipeTransform {
  transform(value: number): string {
    if (value < 60) {
      return `${value} secs`;
    }
    const minutes = Math.floor(value / 60);

    if (minutes > 2) {
      return `~${minutes} mins`;
    }
    const seconds = value % 60;
    return seconds === 0 ? `${minutes} mins` : `${minutes} mins ${seconds} secs`;
  }
}
