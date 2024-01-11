import { Component } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ProjectApiService } from '@dasch-swiss/vre/shared/app-api';

@Component({
  selector: 'app-create-project-form-page',
  template: `
    <dasch-swiss-centered-layout>
      <app-reusable-project-form
        [formData]="{
          shortcode: '',
          shortname: '',
          longname: '',
          description: [],
          keywords: []
        }"
        (formValueChange)="form = $event"></app-reusable-project-form>

      <div style="display: flex; justify-content: space-between">
        <button color="primary" mat-button type="reset" [routerLink]="['..']">
          {{ 'appLabels.form.action.cancel' | translate }}
        </button>

        <button
          mat-raised-button
          type="submit"
          color="primary"
          [disabled]="!form || !form.valid"
          (click)="submitForm()"
          appLoadingButton
          [isLoading]="loading">
          {{ 'appLabels.form.action.submit' | translate }}
        </button>
      </div>
    </dasch-swiss-centered-layout>
  `,
})
export class CreateProjectFormPageComponent {
  form: FormGroup;
  loading = false;

  constructor(private _projectApiService: ProjectApiService) {}

  submitForm() {
    this.loading = true;
    this._projectApiService
      .create({
        shortcode: this.form.get('shortcode').value,
        shortname: this.form.get('shortname').value,
        longname: this.form.get('longname').value,
        description: this.form.get('description').value,
        keywords: this.form.get('keywords').value,
        logo: '',
        selfjoin: true,
        status: true,
      })
      .subscribe(() => {
        this.loading = false;
      });
  }
}
