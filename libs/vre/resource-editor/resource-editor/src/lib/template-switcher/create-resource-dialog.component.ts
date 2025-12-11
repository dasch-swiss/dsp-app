import { Component, Inject, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { DialogHeaderComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslateService } from '@ngx-translate/core';
import { CreateResourceFormComponent } from '../resource-creator/create-resource-form.component';

export interface CreateResourceDialogProps {
  resourceType: string;
  resourceClassIri: string;
  projectIri: string;
  projectShortcode: string;
}

@Component({
  selector: 'app-create-resource-dialog',
  imports: [DialogHeaderComponent, MatDialogContent, CreateResourceFormComponent],
  template: `
    <app-dialog-header
      [title]="
        _translateService.instant('resourceEditor.templateSwitcher.createResourceDialog.title', {
          type: data.resourceType,
        })
      " />
    <div mat-dialog-content style="max-height: 100%" data-cy="create-resource-dialog">
      <app-create-resource-form
        [resourceClassIri]="data.resourceClassIri"
        [projectIri]="data.projectIri"
        [projectShortcode]="data.projectShortcode"
        (createdResourceIri)="onCreatedResource($event)"
        (cancelled)="onCancel()" />
    </div>
  `,
  standalone: true,
})
export class CreateResourceDialogComponent {
  protected readonly _translateService = inject(TranslateService);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: CreateResourceDialogProps,
    private _dialogRef: MatDialogRef<CreateResourceDialogComponent>
  ) {}

  onCreatedResource(resourceIri: string) {
    this._dialogRef.close(resourceIri);
  }

  onCancel() {
    this._dialogRef.close();
  }
}
