import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
} from '@angular/material/dialog';
import { StringLiteralV2 } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { OntologyService } from '@dasch-swiss/vre/shared/app-helper-services';
import { LoadingButtonDirective } from '@dasch-swiss/vre/ui/progress-indicator';
import { MultiLanguages, StringifyStringLiteralPipe } from '@dasch-swiss/vre/ui/string-literal';
import { DialogHeaderComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslatePipe } from '@ngx-translate/core';
import { take } from 'rxjs';
import { OntologyEditService } from '../../services/ontology-edit.service';
import { ResourceClassFormComponent } from './resource-class-form.component';
import { ResourceClassForm, ResourceClassFormData, UpdateResourceClassData } from './resource-class-form.type';

export interface EditResourceClassDialogProps {
  labels: StringLiteralV2[];
  data: UpdateResourceClassData;
}

@Component({
  selector: 'app-edit-resource-class-dialog',
  template: `
    <app-dialog-header
      [title]="data.labels | appStringifyStringLiteral"
      [subtitle]="'pages.ontology.resourceClassForm.editSubtitle' | translate" />
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
        {{ 'ui.common.actions.update' | translate }}
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
    StringifyStringLiteralPipe,
    TranslatePipe,
  ],
})
export class EditResourceClassDialogComponent implements OnInit {
  loading = false;
  form!: ResourceClassForm;
  formData!: ResourceClassFormData;
  lastModificationDate!: string;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: EditResourceClassDialogProps,
    public dialogRef: MatDialogRef<EditResourceClassDialogComponent, UpdateResourceClassData>,
    private _oes: OntologyEditService
  ) {}

  ngOnInit() {
    this.formData = {
      name: OntologyService.getNameFromIri(this.data.data.id),
      labels: this.data.data.labels as MultiLanguages,
      comments: this.data.data.comments as MultiLanguages,
    };
  }

  afterFormInit(form: ResourceClassForm) {
    this.form = form;
    this.form.controls.name.disable();
  }

  onSubmit() {
    this.loading = true;
    const labels = this.form.controls.labels.value as StringLiteralV2[];
    const comments = this.form.controls.comments.value as StringLiteralV2[];

    this._oes
      .updateResourceClass$({ id: this.data.data.id, labels, comments } as UpdateResourceClassData)
      .pipe(take(1))
      .subscribe(res => {
        this.loading = false;
        this.dialogRef.close();
      });
  }
}
