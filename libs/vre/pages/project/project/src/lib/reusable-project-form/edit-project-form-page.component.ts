import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { UpdateProjectRequest } from '@dasch-swiss/dsp-js';
import { ProjectApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { LoadingButtonDirective } from '@dasch-swiss/vre/ui/progress-indicator';
import { MultiLanguages } from '@dasch-swiss/vre/ui/string-literal';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { map, switchMap, take } from 'rxjs';
import { ProjectPageService } from '../project-page.service';
import { ProjectForm } from './project-form.type';
import { ReusableProjectFormComponent } from './reusable-project-form.component';

@Component({
  selector: 'app-edit-project-form-page',
  template: `
    @if (formData$ | async; as formData) {
      <app-reusable-project-form [formData]="formData" (afterFormInit)="form = $event" />
    }

    <div style="display: flex; justify-content: space-between">
      <button
        mat-raised-button
        type="submit"
        color="primary"
        (click)="onSubmit()"
        appLoadingButton
        [isLoading]="loading"
        data-cy="submit-button">
        {{ 'ui.common.actions.submit' | translate }}
      </button>
    </div>
  `,
  imports: [AsyncPipe, MatButton, TranslateModule, LoadingButtonDirective, ReusableProjectFormComponent],
})
export class EditProjectFormPageComponent {
  form!: ProjectForm;
  loading = false;

  private _translateService = inject(TranslateService);

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
    private readonly _projectPageService: ProjectPageService,
    private readonly _projectApiService: ProjectApiService,
    private readonly _notification: NotificationService
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
        this._notification.openSnackBar(
          this._translateService.instant('pages.project.editProjectFormPage.projectUpdated')
        );
      });
  }
}
