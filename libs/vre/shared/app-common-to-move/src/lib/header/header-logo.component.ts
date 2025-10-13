import { Component } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { RouteConstants } from '@dasch-swiss/vre/core/config';

@Component({
  selector: 'app-header-logo',
  template: `
    <a class="logo" [routerLink]="homeLink">
      <mat-icon matPrefix svgIcon="dasch_mosaic_icon_color" />
    </a>
  `,
  styles: [
    `
      .logo {
        display: flex;
        margin-right: 4px;
        height: 100%;
        column-gap: 10px;
        cursor: pointer;
        padding: 4px;
        border-radius: 8px;

        .mat-icon {
          height: 32px;
          width: 32px;
        }

        &:hover {
          background-color: #e8e9eb;
        }
      }
    `,
  ],
  standalone: false,
})
export class HeaderLogoComponent {
  homeLink = RouteConstants.home;

  constructor(
    private _matIconRegistry: MatIconRegistry,
    private _domSanitizer: DomSanitizer
  ) {
    this._matIconRegistry.addSvgIcon(
      'dasch_mosaic_icon_color',
      this._domSanitizer.bypassSecurityTrustResourceUrl('/assets/images/dasch-mosaic-icon-color.svg')
    );
  }
}
