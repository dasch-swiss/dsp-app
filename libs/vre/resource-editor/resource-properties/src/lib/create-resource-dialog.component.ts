import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ProjectsSelectors } from '@dasch-swiss/vre/core/state';
import { Store } from '@ngxs/store';

export interface CreateResourceDialogProps {
  resourceType: string;
  resourceClassIri: string;
}

@Component({
  selector: 'app-create-resource-dialog',
  template: `
    <app-dialog-header [title]="'Create new resource of type: ' + data.resourceType" />
    <div mat-dialog-content>
      <app-create-resource-form
        [resourceClassIri]="data.resourceClassIri"
        [projectIri]="project.id"
        [projectShortcode]="project.shortcode"
        (createdResourceIri)="onCreatedResource($event)" />
    </div>
  `,
})
export class CreateResourceDialogComponent {
  project = this._store.selectSnapshot(ProjectsSelectors.currentProject)!;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: CreateResourceDialogProps,
    private _dialogRef: MatDialogRef<CreateResourceDialogComponent>,
    private _store: Store
  ) {}

  onCreatedResource(resourceIri: string) {
    this._dialogRef.close(resourceIri);
  }
}
