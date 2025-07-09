import { Component, Input, OnInit } from '@angular/core';
import { ProjectLicenseDto } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { CreateResourceFormLegal } from '@dasch-swiss/vre/resource-editor/representations';
import { finalize, map, Observable } from 'rxjs';
import { PaginatedApiService } from './paginated-api.service';

@Component({
  selector: 'app-resource-form-legal',
  template: `
    <app-create-resource-form-row [label]="'Copyright holder'">
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

    <app-create-resource-form-row [label]="'License'">
      <mat-form-field>
        <mat-select placeholder="Choose" [formControl]="formGroup.controls.license" data-cy="license-select">
          <mat-option *ngIf="licensesLoading">Loading...</mat-option>
          <mat-option *ngIf="!licensesLoading" [value]="undefined">None</mat-option>
          <mat-option *ngFor="let license of licenses$ | async" [value]="license">{{ license.labelEn }}</mat-option>
        </mat-select>
      </mat-form-field>
    </app-create-resource-form-row>

    <app-create-resource-form-row [label]="'Authorship'">
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
  licenses$!: Observable<ProjectLicenseDto[]>;
  authorship$!: Observable<string[]>;

  constructor(private _paginatedApi: PaginatedApiService) {}

  ngOnInit() {
    this.copyrightHolders$ = this._paginatedApi.getCopyrightHolders(this.projectShortcode).pipe(
      finalize(() => {
        this.copyrightHoldersLoading = false;
      })
    );

    this.licenses$ = this._paginatedApi.getLicenses(this.projectShortcode).pipe(
      map(data => data.filter(license => license.isEnabled)),
      finalize(() => {
        this.licensesLoading = false;
      })
    );

    this.authorship$ = this._paginatedApi.getAuthorships(this.projectShortcode);
  }
}
