import { Component } from '@angular/core';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer, Title } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { RouteConstants } from '@dasch-swiss/vre/core/config';

@Component({
  selector: 'app-header-logo',
  imports: [MatIconModule, RouterModule],
  template: `
    <a class="logo" [routerLink]="homeLink">
      <mat-icon svgIcon="dasch_mosaic_icon_color" />
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
})
export class HeaderLogoComponent {
  homeLink = RouteConstants.home;

  constructor(
    private readonly _domSanitizer: DomSanitizer,
    private readonly _matIconRegistry: MatIconRegistry,
    private readonly _titleService: Title
  ) {
    this._matIconRegistry.addSvgIcon(
      'dasch_mosaic_icon_color',
      this._domSanitizer.bypassSecurityTrustResourceUrl('/assets/images/dasch-mosaic-icon-color.svg')
    );

    this._titleService.setTitle('DaSCH Service Platform');
  }
}
