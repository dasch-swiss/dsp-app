import { Component, Input, OnInit } from '@angular/core';
import { ReadFileValue } from '@dasch-swiss/dsp-js';
import { AdminAPIApiService, ProjectLicenseDto } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { isPlaceholderAuthorship, isPlaceholderValue } from '@dasch-swiss/vre/shared/app-common';
import { TranslatePipe } from '@ngx-translate/core';
import { switchMap, take } from 'rxjs';
import { ResourceFetcherService } from './representations/resource-fetcher.service';
import { ResourceLegalLicenseComponent } from './resource-legal-license.component';

@Component({
  selector: 'app-resource-legal',
  template: `
    @if (fileValue.copyrightHolder || (fileValue.authorship?.length ?? 0) > 0 || fileValue.license) {
      <div
        class="mat-caption"
        style="border: 1px solid #292929; text-align: left;
    background: #292929; border-radius: 8px;
    color: #e4e9ed; padding: 8px; padding-bottom: 16px; margin-top: 8px; position: relative; top: 12px">
        <div style="display: flex; justify-content: space-between">
          <div>
            @if (fileValue.copyrightHolder) {
              @if (isPlaceholderValue(fileValue.copyrightHolder)) {
                <div data-cy="placeholder-copyright-holder">
                  <span class="label">{{ 'resourceEditor.legal.copyrightHolder' | translate }}</span
                  ><span class="placeholder-text">{{
                    'resourceEditor.legal.placeholder.copyrightHolder' | translate
                  }}</span>
                </div>
              } @else {
                <div>
                  <span class="label">{{ 'resourceEditor.legal.copyrightHolder' | translate }}</span
                  >{{ fileValue.copyrightHolder }}
                </div>
              }
            }
            @if ((fileValue.authorship?.length ?? 0) > 0) {
              @if (isPlaceholderAuthorship(fileValue.authorship)) {
                <div data-cy="placeholder-authorship">
                  <span class="label">{{ 'resourceEditor.legal.authorship' | translate }}</span
                  ><span class="placeholder-text">{{ 'resourceEditor.legal.placeholder.authorship' | translate }}</span>
                </div>
              } @else {
                <div style="display: flex">
                  <span class="label">{{ 'resourceEditor.legal.authorship' | translate }}</span>
                  <div style="max-width: 400px">
                    @for (author of fileValue.authorship; track author; let last = $last) {
                      <span>{{ author }}{{ last ? '' : ', ' }}</span>
                    }
                  </div>
                </div>
              }
            }
          </div>
          <div style="display: flex; justify-content: flex-end">
            @if (isPlaceholderValue(fileValue.license?.id)) {
              <app-resource-legal-license />
            } @else if (license) {
              <app-resource-legal-license [license]="license" />
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    '.label { display: inline-block; width: 170px; font-weight: bold}',
    '.placeholder-text { font-style: italic }',
  ],
  imports: [TranslatePipe, ResourceLegalLicenseComponent],
})
export class ResourceLegalComponent implements OnInit {
  @Input({ required: true }) fileValue!: ReadFileValue;

  licenses: ProjectLicenseDto[] = [];

  protected readonly isPlaceholderValue = isPlaceholderValue;
  protected readonly isPlaceholderAuthorship = isPlaceholderAuthorship;

  get license() {
    return this.licenses.find(license => license.id === this.fileValue.license?.id);
  }

  constructor(
    private readonly _adminApiService: AdminAPIApiService,
    private readonly _resourceFetcher: ResourceFetcherService
  ) {}

  ngOnInit() {
    if (isPlaceholderValue(this.fileValue.license?.id)) {
      // No need to fetch licenses — placeholder license renders without DTO lookup.
      return;
    }
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
