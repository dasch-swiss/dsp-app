import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'internalLinkReplacer',
})
export class InternalLinkReplacerPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: null | string | SafeHtml): SafeHtml | null {
    if (value === null) {
      return value; // Return as is if value is empty or null
    }

    let htmlString = typeof value === 'string' ? value : value['changingThisBreaksApplicationSecurity'];

    // Replace href="http://rdfh/..." with href="/..."
    htmlString = htmlString.replace(
      /<a\s+href="http:\/\/rdfh\.ch\/([^"]+)".*>([^<]+)<\/a>/g,
      (_: any, path: string, content: string) => {
        const newHref = `href="/resource/${path}"`; // Replace 'rdfh/' with '/'
        return `<a ${newHref} target="_blank">${content}</a>`;
      }
    );

    // Sanitize the modified HTML string back to SafeHtml
    return this.sanitizer.bypassSecurityTrustHtml(htmlString);
  }
}
