import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({
  name: 'withBreaks',
})
export class WithBreaksPipe implements PipeTransform {
  constructor(private _sanitizer: DomSanitizer) {}

  transform(value: string) {
    const withBreaks = value.replace(/\n/g, '<br>');
    return this._sanitizer.bypassSecurityTrustHtml(withBreaks);
  }
}
