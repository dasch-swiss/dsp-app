import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'isFalsy',
  pure: false,
  standalone: false,
})
export class IsFalsyPipe implements PipeTransform {
  transform(value: any): any {
    return !value;
  }
}
