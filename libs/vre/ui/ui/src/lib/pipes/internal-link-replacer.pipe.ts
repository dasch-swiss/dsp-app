import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'internalLinkReplacer',
  standalone: false,
})
export class InternalLinkReplacerPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: null | string | SafeHtml): SafeHtml | null {
    if (value === null) {
      return value; // Return as is if value is empty or null
    }

    // Convert SafeHtml back to string if needed
    const htmlString = typeof value === 'string' ? value : value['changingThisBreaksApplicationSecurity'];

    // Create a temporary div element to parse and manipulate the HTML
    const div = document.createElement('div');
    div.innerHTML = htmlString;

    // Find all <a> tags
    const links = div.querySelectorAll('a');

    // Iterate over each <a> tag and modify the href
    links.forEach((link: HTMLAnchorElement) => {
      const href = link.getAttribute('href');

      // If the href starts with "http://rdfh.ch/...", replace it with "/resource/..."
      if (href && href.startsWith('http://rdfh.ch/')) {
        const path = href.replace('http://rdfh.ch/', '');
        link.setAttribute('href', `/resource/${path}`);
      }
    });

    // Get the updated HTML content
    const updatedHtml = div.innerHTML;

    // Sanitize and return the updated HTML string as SafeHtml
    return this.sanitizer.bypassSecurityTrustHtml(updatedHtml);
  }
}
