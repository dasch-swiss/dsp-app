import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'humanReadableError',
  standalone: true,
})
export class HumanReadableErrorPipe implements PipeTransform {
  transform(error: object, params: { errorKey: string; message: string }[] = null): string {
    if (error.hasOwnProperty('required')) {
      return 'This field is required';
    }

    if (params) {
      for (const { errorKey, message } of params) {
        if (error.hasOwnProperty(errorKey)) return message;
      }
    }

    if (error.hasOwnProperty('minlength')) {
      return `Must be greater than or equal to ${
        (
          error['minlength'] as {
            requiredLength: number;
          }
        ).requiredLength
      }`;
    }

    if (error.hasOwnProperty('maxlength')) {
      return `Must be less than or equal to ${(error['maxlength'] as { requiredLength: number }).requiredLength}`;
    }

    if (error.hasOwnProperty('existingName')) {
      return 'This is already taken by another entity';
    }

    throw Error(`Form control error "${Object.keys(error)[0]}" is not handled`);
  }
}
