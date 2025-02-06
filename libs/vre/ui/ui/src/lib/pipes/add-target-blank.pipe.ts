import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'addTargetBlank',
})
export class AddTargetBlankPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: null | string | SafeHtml): SafeHtml | null {
    if (value === null) {
      return value; // Return as is if value is empty or null
    }

    const htmlString = typeof value === 'string' ? value : value['changingThisBreaksApplicationSecurity'];

    // Create a temporary DOM element to manipulate the HTML string
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlString;

    // Find all <a> tags and add `target="_blank"` if it doesn't exist
    const links = tempDiv.querySelectorAll('a');
    links.forEach((link: HTMLAnchorElement) => {
      if (!link.hasAttribute('target')) {
        link.setAttribute('target', '_blank');
      }
    });

    // Return the modified HTML string
    return this.sanitizer.bypassSecurityTrustHtml(tempDiv.innerHTML);
  }
}
