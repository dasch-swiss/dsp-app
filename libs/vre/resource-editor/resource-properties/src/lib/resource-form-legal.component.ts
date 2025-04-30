import { Component, Input, OnInit } from '@angular/core';
import { AdminProjectsLegalInfoApiService, LicenseDto } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { CreateResourceFormLegal } from './create-resource-form.interface';

@Component({
  selector: 'app-resource-form-legal',
  template: `
    <app-create-resource-form-row [label]="'Copyright holder'" [tooltip]="'Copyright holder'">
      <mat-form-field>
        <mat-select
          placeholder="Choose"
          [formControl]="formGroup.controls.copyrightHolder"
          data-cy="copyright-holder-select">
          <mat-option *ngIf="copyrightHoldersLoading">Loading...</mat-option>
          <mat-option *ngIf="!copyrightHoldersLoading" [value]="undefined">None</mat-option>
          <mat-option *ngFor="let copyrightHolder of copyrightHolders$ | async" [value]="copyrightHolder"
            >{{ copyrightHolder }}
          </mat-option>
        </mat-select>
      </mat-form-field>
    </app-create-resource-form-row>

    <app-create-resource-form-row [label]="'License'" [tooltip]="'License'">
      <mat-form-field>
        <mat-select placeholder="Choose" [formControl]="formGroup.controls.license" data-cy="license-select">
          <mat-option *ngIf="licensesLoading">Loading...</mat-option>
          <mat-option *ngIf="!licensesLoading" [value]="undefined">None</mat-option>
          <mat-option *ngFor="let license of licenses$ | async" [value]="license">{{ license.labelEn }} </mat-option>
        </mat-select>
      </mat-form-field>
    </app-create-resource-form-row>

    <app-create-resource-form-row [label]="'Authorship'" [tooltip]="'Authorship'">
      <app-authorship-form-field [control]="formGroup.controls.authorship" [projectShortcode]="projectShortcode" />
    </app-create-resource-form-row>
  `,
  styles: [
    `
      mat-form-field {
        width: 100%;
      }
    `,
  ],
})
export class ResourceFormLegalComponent implements OnInit {
  @Input({ required: true }) formGroup!: CreateResourceFormLegal;
  @Input({ required: true }) projectShortcode!: string;

  copyrightHoldersLoading = true;
  licensesLoading = true;

  copyrightHolders$!: Observable<string[]>;
  licenses$!: Observable<LicenseDto[]>;
  authorship$!: Observable<string[]>;

  constructor(private _copyrightApi: AdminProjectsLegalInfoApiService) {}

  ngOnInit() {
    this.copyrightHolders$ = this._copyrightApi
      .getAdminProjectsShortcodeProjectshortcodeLegalInfoCopyrightHolders(this.projectShortcode)
      .pipe(
        map(data => data.data),
        finalize(() => {
          this.copyrightHoldersLoading = false;
        })
      );

    this.licenses$ = this._copyrightApi
      .getAdminProjectsShortcodeProjectshortcodeLegalInfoLicenses(this.projectShortcode)
      .pipe(
        map(data => data.data),
        finalize(() => {
          this.licensesLoading = false;
        })
      );

    this.authorship$ = this._copyrightApi
      .getAdminProjectsShortcodeProjectshortcodeLegalInfoAuthorships(this.projectShortcode)
      .pipe(map(data => data.data));
  }
}
