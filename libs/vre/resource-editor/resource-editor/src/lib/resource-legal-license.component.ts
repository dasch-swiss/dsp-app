import { Component, Input, OnChanges } from '@angular/core';
import { ProjectLicenseDto } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { LicensesLogoMapping } from './licenses-logo-mapping';

@Component({
  selector: 'app-resource-legal-license',
  template: `
    @if (licenseLogo) {
      <a [href]="license.uri" target="_blank"><img [src]="licenseLogo" alt="license" style="width: 110px" /></a>
    } @else {
      <a style="display: flex; align-items: center; color: white" [href]="license.uri" target="_blank">
        <span style="color: white">{{ license.labelEn }} </span>
        <mat-icon style="font-size: 18px">open_in_new</mat-icon>
      </a>
    }
  `,
  standalone: false,
})
export class ResourceLegalLicenseComponent implements OnChanges {
  @Input({ required: true }) license!: ProjectLicenseDto;
  licenseLogo?: string;

  ngOnChanges() {
    this.licenseLogo = LicensesLogoMapping.get(this.license.id) ?? undefined;
  }
}
