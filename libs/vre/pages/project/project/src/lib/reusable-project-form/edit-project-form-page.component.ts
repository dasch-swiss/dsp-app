import { Component } from '@angular/core';
import { UpdateProjectRequest } from '@dasch-swiss/dsp-js';
import { ProjectApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { MultiLanguages } from '@dasch-swiss/vre/ui/string-literal';
import { map, switchMap, take } from 'rxjs';
import { ProjectPageService } from '../project-page.service';
import { ProjectForm } from './project-form.type';

@Component({
  selector: 'app-edit-project-form-page',
  template: `
    <app-reusable-project-form
      *ngIf="formData$ | async as formData"
      [formData]="formData"
      (afterFormInit)="form = $event" />

    <div style="display: flex; justify-content: space-between">
      <button
        mat-raised-button
        type="submit"
        color="primary"
        (click)="onSubmit()"
        appLoadingButton
        [isLoading]="loading"
        data-cy="submit-button">
        {{ 'ui.form.action.submit' | translate }}
      </button>
    </div>
  `,
})
export class EditProjectFormPageComponent {
  form!: ProjectForm;
  loading = false;
  formData$ = this._projectPageService.currentProject$.pipe(
    map(project => {
      return {
        shortcode: project.shortcode,
        shortname: project.shortname,
        longname: project.longname,
        description: project.description as MultiLanguages,
        keywords: project.keywords,
      };
    })
  );

  constructor(
    private _projectPageService: ProjectPageService,
    private _projectApiService: ProjectApiService,
    private _notification: NotificationService
  ) {}

  onSubmit() {
    const projectData: UpdateProjectRequest = {
      longname: this.form.value.longname,
      description: this.form.getRawValue().description,
      keywords: this.form.value.keywords,
    };

    this._projectPageService.currentProject$
      .pipe(
        take(1),
        switchMap(project => this._projectApiService.update(project.id, projectData))
      )
      .subscribe(() => {
        this._projectPageService.reloadProject();
        this._notification.openSnackBar('Project updated');
      });
  }
}
