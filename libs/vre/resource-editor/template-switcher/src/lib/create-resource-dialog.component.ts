import { Component, Inject, OnInit, Optional } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AppError } from '@dasch-swiss/vre/core/error-handler';
import { ProjectPageService } from '@dasch-swiss/vre/pages/project/project';
import { ResourceFetcherService } from '@dasch-swiss/vre/resource-editor/representations';
import { map, Observable } from 'rxjs';

export interface CreateResourceDialogProps {
  resourceType: string;
  resourceClassIri: string;
}

@Component({
  selector: 'app-create-resource-dialog',
  template: `
    <app-dialog-header [title]="'Create new resource of type: ' + data.resourceType" />
    <div mat-dialog-content>
      @if (projectShortcode$ | async; as projectShortcode) {
        @if (projectIri$ | async; as projectIri) {
          <app-create-resource-form
            [resourceClassIri]="data.resourceClassIri"
            [projectIri]="projectIri"
            [projectShortcode]="projectShortcode"
            (createdResourceIri)="onCreatedResource($event)" />
        }
      }
    </div>
  `,
})
export class CreateResourceDialogComponent implements OnInit {
  projectShortcode$!: Observable<string>;
  projectIri$!: Observable<string>;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: CreateResourceDialogProps,
    private _dialogRef: MatDialogRef<CreateResourceDialogComponent>,
    @Optional() private _resourceFetcherService: ResourceFetcherService,
    @Optional() private _projectPageService: ProjectPageService
  ) {}

  ngOnInit() {
    if (this._resourceFetcherService) {
      this.projectShortcode$ = this._resourceFetcherService.projectShortcode$;
      this.projectIri$ = this._resourceFetcherService.projectIri$;
    } else if (this._projectPageService) {
      this.projectShortcode$ = this._projectPageService.currentProject$.pipe(map(project => project.shortcode));
      this.projectIri$ = this._projectPageService.currentProject$.pipe(map(project => project.id));
    } else {
      throw new AppError('Either ResourceFetcherService or ProjectPageService must be provided');
    }
  }

  onCreatedResource(resourceIri: string) {
    this._dialogRef.close(resourceIri);
  }
}
