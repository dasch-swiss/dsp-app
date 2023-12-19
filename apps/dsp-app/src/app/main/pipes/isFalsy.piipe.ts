import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'isFalsy',
  pure: false,
})
export class IsFalsyPipe implements PipeTransform {
  transform(value: any): any {
    return value ? false : true;
  }
}
