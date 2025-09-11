import { Pipe, PipeTransform } from '@angular/core';
import { ValidatorError } from '@dasch-swiss/vre/ui/ui';

@Pipe({
  name: 'humanReadableError',
  standalone: true,
})
export class HumanReadableErrorPipe implements PipeTransform {
  transform(error: object, params: ValidatorError[] | null = null): string {
    if (error.hasOwnProperty('required')) {
      return 'This field is required';
    }

    if (error.hasOwnProperty('minlength')) {
      return `The length must be greater than or equal to ${
        (
          error as {
            minlength: {
              requiredLength: number;
            };
          }
        ).minlength.requiredLength
      }`;
    }

    if (error.hasOwnProperty('maxlength')) {
      return `The length must be less than or equal to ${
        (error as { maxlength: { requiredLength: number } }).maxlength.requiredLength
      }`;
    }

    if (error.hasOwnProperty('min')) {
      return `The value must be greater than or equal to ${
        (
          error as {
            min: {
              min: number;
            };
          }
        ).min.min
      }`;
    }

    if (error.hasOwnProperty('max')) {
      return `The value must be less than or equal to ${
        (
          error as {
            max: {
              max: number;
            };
          }
        ).max.max
      }`;
    }

    if (error.hasOwnProperty('existingName')) {
      return 'This name is already taken by another entity';
    }

    if (error.hasOwnProperty('whitespace')) {
      return 'This field should not contain whitespace';
    }

    if (params) {
      for (const { errorKey, message } of params) {
        if (error.hasOwnProperty(errorKey)) return message;
      }
    }

    throw Error(`Form control error "${Object.keys(error)[0]}" is not handled`);
  }
}
