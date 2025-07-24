import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { ReadProject } from '@dasch-swiss/dsp-js';
import { AdminProjectsLegalInfoApiService, ProjectLicenseDto } from '@dasch-swiss/vre/3rd-party-services/open-api';

@Component({
  selector: 'app-licenses-enabled-table',
  template: `
    <table style="width: 100%">
      <tr>
        <th>{{ label }}</th>
        <th>{{ 'pages.project.legalSettings.enabled' | translate }} ({{ enabledLicensesNumber }})</th>
      </tr>

      @for (license of licenses; track license) {
        <tr>
          <td>
            {{ license.labelEn }}
            <a [href]="license.uri" target="_blank">
              <mat-icon>launch</mat-icon>
            </a>
          </td>
          <td>
            <mat-checkbox
              [checked]="license.isEnabled"
              (change)="$event.checked ? enable(license.id) : disable(license.id)" />
          </td>
        </tr>
      }
    </table>
  `,
  styles: [
    `
      table {
        border: 1px solid #f2f2f2;
      }

      tr {
        &:nth-child(odd) {
          background-color: #f2f2f2;
        }

        td,
        th {
          text-align: left;
          padding: 8px;
        }

        th {
          background-color: #dedede;
        }

        td:nth-of-type(2) {
          width: 90px;
          text-align: center;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LicensesEnabledTableComponent {
  @Input({ required: true }) licenses!: ProjectLicenseDto[];
  @Input({ required: true }) project!: ReadProject;
  @Input({ required: true }) label!: string;
  @Output() refresh = new EventEmitter<void>();

  get enabledLicensesNumber() {
    return this.licenses.filter(license => license.isEnabled).length;
  }

  constructor(private _copyrightApi: AdminProjectsLegalInfoApiService) {}

  enable(licenseIri: string) {
    this._copyrightApi
      .putAdminProjectsShortcodeProjectshortcodeLegalInfoLicensesLicenseiriEnable(this.project.shortcode, licenseIri)
      .subscribe(() => {
        this.refresh.emit();
      });
  }

  disable(licenseIri: string) {
    this._copyrightApi
      .putAdminProjectsShortcodeProjectshortcodeLegalInfoLicensesLicenseiriDisable(this.project.shortcode, licenseIri)
      .subscribe(() => {
        this.refresh.emit();
      });
  }
}
