import { Component, Input, OnChanges } from '@angular/core';
import { ReadFileValue } from '@dasch-swiss/dsp-js';
import { AdminProjectsLegalInfoApiService, ProjectLicenseDto } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { ResourceFetcherService } from '@dasch-swiss/vre/resource-editor/representations';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { LicenseLogoMappingValue, LicensesLogoMapping } from './licenses-logo-mapping';

@Component({
  selector: 'app-resource-legal',
  template: `
    <div
      *ngIf="fileValue.copyrightHolder || fileValue.authorship?.length > 0 || fileValue.license"
      class="mat-caption"
      style="border: 1px solid #292929;
    background: #292929; border-radius: 8px;
    color: #e4e9ed; padding: 8px; padding-bottom: 16px; margin-top: 8px; position: relative; top: 12px">
      <div style="display: flex; justify-content: space-between">
        <div>
          <div *ngIf="fileValue.copyrightHolder">
            <span class="label">Copyright holder</span> {{ fileValue.copyrightHolder }}
          </div>

          <div *ngIf="fileValue.authorship.length > 0" style="display: flex">
            <span class="label">Authorship</span>
            <div style="max-width: 400px">
              <span *ngFor="let author of fileValue.authorship; let last = last"
                >{{ author }}{{ last ? '' : ', ' }}</span
              >
            </div>
          </div>
        </div>
        <div>
          <div style="display: flex; justify-content: flex-end">
            <a *ngIf="licenseLogo; else licenseWithLinkTpl" [href]="licenseLogo.link" target="_blank"
              ><img [src]="licenseLogo.imageLink" alt="license" style="width: 110px"
            /></a>
          </div>

          <div>Licensed on {{ fileValue.valueCreationDate | humanReadableDate }}</div>
        </div>
      </div>
    </div>

    <ng-template #licenseWithLinkTpl>
      <a
        style="display: flex; align-items: center; color: white"
        *ngIf="license$ && license$ | async as license"
        [href]="license.id"
        target="_blank">
        <span style="color: white">{{ license.labelEn }} </span>
        <mat-icon style="font-size: 18px">open_in_new</mat-icon>
      </a></ng-template
    >
  `,
  styles: ['.label { display: inline-block; width: 120px; font-weight: bold}'],
})
export class ResourceLegalComponent implements OnChanges {
  @Input({ required: true }) fileValue!: ReadFileValue;

  licenseLogo?: LicenseLogoMappingValue;
  license$?: Observable<ProjectLicenseDto | undefined>;

  constructor(
    private _resourceFetcher: ResourceFetcherService,
    private _copyrightApi: AdminProjectsLegalInfoApiService
  ) {}

  ngOnChanges() {
    this.licenseLogo = undefined;

    if (this.fileValue.license) {
      if (LicensesLogoMapping.has(this.fileValue.license.id)) {
        this.licenseLogo = LicensesLogoMapping.get(this.fileValue.license.id);
      } else {
        this._fetchLicense();
      }
    }
  }

  private _fetchLicense() {
    this.license$ = this._resourceFetcher.projectShortcode$.pipe(
      switchMap(projectShortcode =>
        this._copyrightApi.getAdminProjectsShortcodeProjectshortcodeLegalInfoLicenses(projectShortcode)
      ),
      map(data => data.data.find(license => license.id === this.fileValue.license?.id))
    );
  }
}
