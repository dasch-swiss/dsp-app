import { Pipe, PipeTransform } from '@angular/core';

interface DisplayTypes {
  value: string;
  viewValue: string;
}

@Pipe({
  name: 'formattedBoolean',
})
export class FormattedBooleanPipe implements PipeTransform {
  displayTypes: DisplayTypes[] = [
    { value: 'true-false', viewValue: 'True/False' },
    { value: 'yes-no', viewValue: 'Yes/No' },
    { value: 'on-off', viewValue: 'On/Off' },
  ];

  transform(value: boolean, format?: string): string {
    switch (format) {
      case 'true-false':
        return value ? 'true' : 'false';
      case 'yes-no':
        return value ? 'yes' : 'no';
      case 'on-off':
        return value ? 'on' : 'off';
      default:
        return value ? 'true' : 'false';
    }
  }
}
