import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  ListInfoResponse,
  ListNodeInfo,
  ListResponse,
  StringLiteral,
  UpdateListInfoRequest,
} from '@dasch-swiss/dsp-js';
import { ListApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { ProjectPageService } from '@dasch-swiss/vre/pages/project/project';
import { atLeastOneStringRequired } from '@dasch-swiss/vre/shared/app-common';
import { DEFAULT_MULTILANGUAGE_FORM } from '@dasch-swiss/vre/ui/string-literal';
import { switchMap } from 'rxjs';
import { ListInfoForm } from './list-info-form.type';

@Component({
  selector: 'app-list-info-form',
  template: `
    <app-dialog-header title="" [subtitle]="title" />
    <div mat-dialog-content>
      <app-multi-language-input
        [formArray]="form.controls.labels"
        placeholder="Controlled vocabulary label"
        [isRequired]="true"
        data-cy="label-input" />

      <app-multi-language-textarea
        [formArray]="form.controls.comments"
        placeholder="Controlled vocabulary description"
        [isRequired]="true"
        data-cy="comments-input" />
      <div mat-dialog-actions align="end">
        <button mat-button mat-dialog-close>Cancel</button>
        <button
          mat-raised-button
          type="submit"
          color="primary"
          [disabled]="form.invalid"
          (click)="submitForm()"
          appLoadingButton
          [isLoading]="loading"
          data-cy="submit-button">
          {{ 'ui.form.action.submit' | translate }}
        </button>
      </div>
    </div>
  `,
})
export class ListInfoFormComponent implements OnInit {
  form!: ListInfoForm;

  loading = false;

  get title() {
    return this.data ? 'Edit controlled vocabulary info' : 'Create new controlled vocabulary';
  }

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: ListNodeInfo,
    private _fb: FormBuilder,
    private _listApiService: ListApiService,
    private _projectPageService: ProjectPageService,
    public dialogRef: MatDialogRef<ListInfoFormComponent, ListResponse | ListInfoResponse>
  ) {}

  ngOnInit() {
    this._buildForm();
  }

  _buildForm() {
    this.form = this._fb.group({
      labels: DEFAULT_MULTILANGUAGE_FORM(
        this.data ? this.data.labels : [],
        [Validators.maxLength(2000)],
        [atLeastOneStringRequired('value')]
      ),
      comments: DEFAULT_MULTILANGUAGE_FORM(
        this.data ? this.data.comments : [],
        [Validators.maxLength(2000)],
        [atLeastOneStringRequired('value')]
      ),
    });
  }

  submitForm() {
    this.loading = true;
    if (this.data) {
      this.submitEditList();
    } else {
      this.submitCreateList();
    }
  }

  submitCreateList() {
    this._listApiService
      .create({
        projectIri: this._projectPageService.currentProjectId,
        labels: this.form.value.labels as StringLiteral[],
        comments: this.form.value.comments as StringLiteral[],
      })
      .subscribe(response => {
        this.loading = false;
        this.dialogRef.close(response);
      });
  }

  submitEditList() {
    const listInfoUpdateData: UpdateListInfoRequest = new UpdateListInfoRequest();
    listInfoUpdateData.projectIri = this.data.projectIri;
    listInfoUpdateData.listIri = this.data.id;
    listInfoUpdateData.labels = this.form.value.labels as StringLiteral[];
    listInfoUpdateData.comments = this.form.value.comments as StringLiteral[];

    this._listApiService.updateInfo(listInfoUpdateData.listIri, listInfoUpdateData).subscribe(response => {
      this.loading = false;
      this.dialogRef.close(response);
    });
  }
}
