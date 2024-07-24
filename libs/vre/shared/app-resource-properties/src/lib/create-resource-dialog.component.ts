import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface CreateResourceDialogProps {
  resourceType: string;
  resourceClassIri: string;
  projectIri: string;
}

@Component({
  selector: 'app-create-resource-dialog',
  template: `
    <app-dialog-header [title]="'Create new resource of type: ' + data.resourceType"></app-dialog-header>
    <div mat-dialog-content>
      <app-create-resource-form
        [resourceType]="data.resourceType"
        [resourceClassIri]="data.resourceClassIri"
        [projectIri]="data.projectIri"
        (createdResourceIri)="onCreatedResource($event)"></app-create-resource-form>
    </div>
  `,
})
export class CreateResourceDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: CreateResourceDialogProps,
    private _dialogRef: MatDialogRef<CreateResourceDialogComponent>
  ) {}

  onCreatedResource(resourceIri: string) {
    this._dialogRef.close(resourceIri);
  }
}
