import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
} from '@angular/material/dialog';
import { StringLiteralV2 } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { ProjectPageService } from '@dasch-swiss/vre/pages/project/project';
import { DefaultClass } from '@dasch-swiss/vre/shared/app-helper-services';
import { LoadingButtonDirective } from '@dasch-swiss/vre/ui/progress-indicator';
import { DialogHeaderComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslatePipe } from '@ngx-translate/core';
import { OntologyEditService } from '../../services/ontology-edit.service';
import { ResourceClassFormComponent } from './resource-class-form.component';
import { ResourceClassForm, ResourceClassFormData } from './resource-class-form.type';

@Component({
  selector: 'app-create-resource-class-dialog',
  template: `
    <app-dialog-header
      [title]="data.label"
      [subtitle]="'pages.ontology.resourceClassForm.createSubtitle' | translate" />
    <div mat-dialog-content>
      <app-resource-class-form [formData]="formData" (afterFormInit)="afterFormInit($event)" />
    </div>
    <div mat-dialog-actions align="end">
      <button data-cy="cancel-button" mat-button mat-dialog-close>{{ 'ui.common.actions.cancel' | translate }}</button>
      <button
        data-cy="submit-button"
        mat-raised-button
        color="primary"
        appLoadingButton
        [isLoading]="loading"
        [disabled]="form?.invalid"
        (click)="onSubmit()">
        {{ 'ui.common.actions.create' | translate }}
      </button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DialogHeaderComponent,
    LoadingButtonDirective,
    MatButton,
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    ResourceClassFormComponent,
    TranslatePipe,
  ],
})
export class CreateResourceClassDialogComponent {
  loading = false;
  form!: ResourceClassForm;
  formData: ResourceClassFormData = {
    name: '',
    labels: [],
    comments: [],
  };

  lastModificationDate!: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DefaultClass,
    public dialogRef: MatDialogRef<CreateResourceClassDialogComponent>,
    private _projectPageService: ProjectPageService,
    private _oes: OntologyEditService
  ) {}

  afterFormInit(form: ResourceClassForm) {
    this.form = form;
  }

  onSubmit() {
    this.loading = true;

    this._oes
      .createResourceClass$(
        {
          name: this.form.controls.name.value,
          labels: this.form.controls.labels.value as StringLiteralV2[],
          comments: this.form.controls.comments.value as StringLiteralV2[],
        },
        this.data.iri
      )
      .subscribe(() => {
        this.loading = false;
        this._projectPageService.reloadProject();
        this.dialogRef.close();
      });
  }
}
