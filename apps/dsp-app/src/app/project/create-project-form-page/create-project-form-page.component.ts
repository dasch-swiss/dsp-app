import { Component } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { ProjectApiService } from '@dasch-swiss/vre/shared/app-api';
import { RouteConstants } from '@dasch-swiss/vre/shared/app-config';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { LoadProjectsAction } from '@dasch-swiss/vre/shared/app-state';
import { Store } from '@ngxs/store';
import { take } from 'rxjs/operators';

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

  constructor(
    private _projectApiService: ProjectApiService,
    private _store: Store,
    private _router: Router
  ) {}

  submitForm() {
    this.loading = true;
    this._projectApiService
      .create({
        shortcode: this.form.get('shortcode').value,
        shortname: this.form.get('shortname').value,
        longname: this.form.get('longname').value,
        description: this.form.get('description').value,
        keywords: this.form.get('keywords').value,
        selfjoin: true,
        status: true,
      })
      .pipe(take(1))
      .subscribe(projectResponse => {
        const uuid = ProjectService.IriToUuid(projectResponse.project.id);
        this._store.dispatch(new LoadProjectsAction());
        this.loading = false;
        this._router
          .navigateByUrl(`${RouteConstants.projectRelative}`, { skipLocationChange: true })
          .then(() => this._router.navigate([`${RouteConstants.projectRelative}/${uuid}`]));
      });
  }
}
