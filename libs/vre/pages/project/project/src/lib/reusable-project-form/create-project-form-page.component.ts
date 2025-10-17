import { Location } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { AdminAPIApiService } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { UserService } from '@dasch-swiss/vre/core/session';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { finalize } from 'rxjs';
import { ProjectForm } from './project-form.type';

@Component({
  selector: 'app-create-project-form-page',
  template: `
    <app-centered-layout>
      <app-reusable-project-form
        [formData]="{
          shortcode: '',
          shortname: '',
          longname: '',
          description: [],
          keywords: [],
        }"
        (afterFormInit)="form = $event" />

      <div style="display: flex; justify-content: space-between">
        <button color="primary" mat-button type="reset" (click)="goBack()">
          {{ 'ui.form.action.cancel' | translate }}
        </button>

        <button
          mat-raised-button
          type="submit"
          color="primary"
          [disabled]="!form || !form.valid"
          (click)="submitForm()"
          appLoadingButton
          data-cy="submit-button"
          [isLoading]="loading">
          {{ 'ui.form.action.submit' | translate }}
        </button>
      </div>
    </app-centered-layout>
  `,
  standalone: false,
})
export class CreateProjectFormPageComponent {
  form!: ProjectForm;
  loading = false;

  constructor(
    private readonly _adminApiService: AdminAPIApiService,
    private readonly _location: Location,
    private readonly _projectApiService: ProjectApiService,
    private readonly _route: ActivatedRoute,
    private readonly _router: Router,
    private readonly _userService: UserService
  ) {}

  submitForm() {
    this.loading = true;
    this._projectApiService
      .create({
        shortcode: this.form.getRawValue().shortcode,
        shortname: this.form.getRawValue().shortname,
        longname: this.form.getRawValue().longname,
        description: this.form.getRawValue().description,
        keywords: this.form.getRawValue().keywords,
        selfjoin: true,
        status: true,
      })
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(projectResponse => {
        if (this._route.snapshot.queryParams[RouteConstants.assignCurrentUser]) {
          const currentUser = this._userService.currentUser!;

          this._adminApiService
            .postAdminUsersIriUseririProjectMembershipsProjectiri(currentUser.id, projectResponse.project.id)
            .subscribe();
        }

        const uuid = ProjectService.IriToUuid(projectResponse.project.id);
        this._router.navigate([RouteConstants.projectRelative, uuid]);
      });
  }

  goBack() {
    this._location.back();
  }
}
