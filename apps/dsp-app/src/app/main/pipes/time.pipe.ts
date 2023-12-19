import { Pipe, PipeTransform } from '@angular/core';

/**
 * the TimePipe transforms n seconds to hh:mm:ss
 * or in case of zero hours to mm:ss
 */
@Pipe({
  name: 'appTime',
})
export class TimePipe implements PipeTransform {
  transform(value: number): string {
    const dateObj: Date = new Date(value * 1000);
    const hours: number = dateObj.getUTCHours();
    const minutes = dateObj.getUTCMinutes();
    const seconds = dateObj.getSeconds();

    if (hours === 0) {
      return minutes.toString().padStart(2, '0') + ':' + seconds.toString().padStart(2, '0');
    } else {
      return (
        hours.toString().padStart(2, '0') +
        ':' +
        minutes.toString().padStart(2, '0') +
        ':' +
        seconds.toString().padStart(2, '0')
      );
    }
  }
}
