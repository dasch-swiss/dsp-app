import { Component, Input, OnChanges } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ProjectLicenseDto } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { isPlaceholderValue } from '@dasch-swiss/vre/shared/app-common';
import { TranslatePipe } from '@ngx-translate/core';
import { LicensesLogoMapping } from './licenses-logo-mapping';

@Component({
  selector: 'app-resource-legal-license',
  template: `
    @if (isPlaceholder) {
      <div
        data-cy="placeholder-license"
        class="placeholder-text"
        style="display: flex; align-items: center; color: white">
        {{ 'resourceEditor.legal.placeholder.license' | translate }}
      </div>
    } @else if (license) {
      @if (licenseLogo) {
        <a [href]="license.uri" target="_blank"><img [src]="licenseLogo" alt="license" style="width: 110px" /></a>
      } @else {
        <a style="display: flex; align-items: center; color: white" [href]="license.uri" target="_blank">
          <span style="color: white">{{ license.labelEn }} </span>
          <mat-icon style="font-size: 18px">open_in_new</mat-icon>
        </a>
      }
    }
  `,
  styles: ['.placeholder-text { font-style: italic }'],
  imports: [MatIconModule, TranslatePipe],
})
export class ResourceLegalLicenseComponent implements OnChanges {
  @Input() license?: ProjectLicenseDto;
  licenseLogo?: string;

  get isPlaceholder(): boolean {
    return !this.license || isPlaceholderValue(this.license.id);
  }

  ngOnChanges() {
    this.licenseLogo = this.license ? (LicensesLogoMapping.get(this.license.id) ?? undefined) : undefined;
  }
}
