import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'humanReadableDate',
})
export class HumanReadableDatePipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';

    const date = new Date(value);
    return date.toLocaleString('ch-CH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
