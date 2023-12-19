import { isPlatformBrowser } from '@angular/common';
import {
  Directive,
  HostBinding,
  Inject,
  Input,
  OnChanges,
  PLATFORM_ID,
} from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

/* eslint-disable */
@Directive({
    selector: 'a[href]',
})
/* eslint-enable */
export class ExternalLinksDirective implements OnChanges {
  @Input() href: string;
  @HostBinding('attr.rel') relAttr = '';
  @HostBinding('attr.target') targetAttr = '';
  @HostBinding('attr.href') hrefAttr: SafeUrl;
  @HostBinding('class') class = 'external-link';

  // to check if we are running on the server, give a token value
  constructor(
    @Inject(PLATFORM_ID) private platformId: string,
    private _sanitizer: DomSanitizer
  ) {}

  ngOnChanges() {
    this.hrefAttr = this._sanitizer.bypassSecurityTrustUrl(this.href);

    if (this._isLinkExternal()) {
      // makes sure that the new browser tab does not run on the same process and prevent it from accessing window.opener
      this.relAttr = 'noopener';
      // open the page in a new tab
      this.targetAttr = '_blank';
    }
  }

  /**
   * check if the link opens an external page
   */
  private _isLinkExternal() {
    return (
      // get a token value from platformId to run the code only on the client and prevents errors
      isPlatformBrowser(this.platformId) &&
      !this.href.includes(location.hostname)
    );
  }
}
