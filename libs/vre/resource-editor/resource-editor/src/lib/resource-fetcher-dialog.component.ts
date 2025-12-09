import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ClosingDialogComponent } from './closing-dialog.component';
import { ResourceFetcherComponent } from './resource-fetcher.component';

export interface ResourceFetcherDialogProps {
  resourceIri: string;
  index: number;
}

@Component({
  selector: 'app-resource-fetcher-dialog',
  template: `
    <app-closing-dialog data-cy="resource-dialog">
      <app-resource-fetcher [resourceIri]="data.resourceIri" />
    </app-closing-dialog>
  `,
  standalone: true,
  imports: [ClosingDialogComponent, ResourceFetcherComponent],
})
export class ResourceFetcherDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ResourceFetcherDialogProps,
    public _dialogRef: MatDialogRef<any>
  ) {}
}
