import { Component, Input, OnInit } from '@angular/core';
import { ReadFileValue } from '@dasch-swiss/dsp-js';
import { AdminAPIApiService, ProjectLicenseDto } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { TranslateModule } from '@ngx-translate/core';
import { switchMap, take } from 'rxjs';
import { ResourceFetcherService } from './representations/resource-fetcher.service';
import { ResourceLegalLicenseComponent } from './resource-legal-license.component';

@Component({
  selector: 'app-resource-legal',
  template: `
    @if (fileValue.copyrightHolder || fileValue.authorship?.length > 0 || fileValue.license) {
      <div
        class="mat-caption"
        style="border: 1px solid #292929;
    background: #292929; border-radius: 8px;
    color: #e4e9ed; padding: 8px; padding-bottom: 16px; margin-top: 8px; position: relative; top: 12px">
        <div style="display: flex; justify-content: space-between">
          <div>
            @if (fileValue.copyrightHolder) {
              <div>
                <span class="label">{{ 'resourceEditor.legal.copyrightHolder' | translate }}</span
                >{{ fileValue.copyrightHolder }}
              </div>
            }
            @if (fileValue.authorship.length > 0) {
              <div style="display: flex">
                <span class="label">{{ 'resourceEditor.legal.authorship' | translate }}</span>
                <div style="max-width: 400px">
                  @for (author of fileValue.authorship; track author; let last = $last) {
                    <span>{{ author }}{{ last ? '' : ', ' }}</span>
                  }
                </div>
              </div>
            }
          </div>
          <div style="display: flex; justify-content: flex-end">
            @if (license) {
              <app-resource-legal-license [license]="license" />
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: ['.label { display: inline-block; width: 170px; font-weight: bold}'],
  standalone: true,
  imports: [TranslateModule, ResourceLegalLicenseComponent],
})
export class ResourceLegalComponent implements OnInit {
  @Input({ required: true }) fileValue!: ReadFileValue;

  licenses: ProjectLicenseDto[] = [];

  get license() {
    return this.licenses.find(license => license.id === this.fileValue.license?.id);
  }

  constructor(
    private readonly _adminApiService: AdminAPIApiService,
    private readonly _resourceFetcher: ResourceFetcherService
  ) {}

  ngOnInit() {
    this._fetchLicense();
  }

  private _fetchLicense() {
    this._resourceFetcher.projectShortcode$
      .pipe(
        switchMap(projectShortcode =>
          this._adminApiService.getAdminProjectsShortcodeProjectshortcodeLegalInfoLicenses(projectShortcode)
        ),
        take(1)
      )
      .subscribe(data => {
        this.licenses = data.data;
      });
  }
}
