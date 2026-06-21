import { AsyncPipe } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ProjectApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { DspResource, PaginatedApiService } from '@dasch-swiss/vre/shared/app-common';
import { ResourceRightsStatementComponent } from '@dasch-swiss/vre/ui/ui';
import { map, Observable, of, switchMap } from 'rxjs';
import {
  ResourceAuthorshipEditDialogComponent,
  ResourceAuthorshipEditDialogProps,
} from './resource-authorship-edit-dialog.component';
import { ResourceLegalService } from './resource-legal.service';

interface DataRights {
  licenseLabel?: string;
  licenseUrl?: string;
  copyrightHolder?: string;
  authorship: string[];
}

/**
 * Viewer wrapper for the data-side Resource Rights Statement: resolves the project's data-side legal
 * info (license label/deed URL, holder, default authorship) and renders the per-resource statement,
 * with an inline authorship edit for users with Modify rights.
 */
@Component({
  selector: 'app-resource-rights-statement-container',
  template: `
    @if (dataRights$ | async; as rights) {
      <app-resource-rights-statement
        perResource
        [licenseLabel]="rights.licenseLabel"
        [licenseUrl]="rights.licenseUrl"
        [copyrightHolder]="rights.copyrightHolder"
        [authorship]="rights.authorship"
        [resourceAuthorship]="resource.res.resourceAuthorship"
        [canEditAuthorship]="canEditAuthorship"
        (editAuthorship)="onEditAuthorship()" />
    }
  `,
  imports: [AsyncPipe, ResourceRightsStatementComponent],
})
export class ResourceRightsStatementContainerComponent implements OnInit {
  @Input({ required: true }) resource!: DspResource;

  dataRights$!: Observable<DataRights>;

  // TODO(verify-locally): confirm userHasPermission codes that imply Modify rights.
  get canEditAuthorship(): boolean {
    return ['M', 'D', 'CR'].includes(this.resource.res.userHasPermission);
  }

  constructor(
    private readonly _dialog: MatDialog,
    private readonly _paginatedApi: PaginatedApiService,
    private readonly _projectApi: ProjectApiService,
    private readonly _resourceLegal: ResourceLegalService
  ) {}

  ngOnInit(): void {
    this.dataRights$ = this._projectApi.get(this.resource.res.attachedToProject).pipe(
      switchMap(response => {
        const project = response.project;
        const base = {
          copyrightHolder: project.dataCopyrightHolder,
          authorship: project.dataAuthorship ?? [],
        };
        if (!project.dataLicense) {
          return of({ ...base, licenseLabel: undefined, licenseUrl: undefined } as DataRights);
        }
        return this._paginatedApi.getLicenses(project.shortcode).pipe(
          map(licenses => {
            const license = licenses.find(l => l.id === project.dataLicense);
            return { ...base, licenseLabel: license?.labelEn, licenseUrl: license?.uri } as DataRights;
          })
        );
      })
    );
  }

  onEditAuthorship(): void {
    this._dialog
      .open<ResourceAuthorshipEditDialogComponent, ResourceAuthorshipEditDialogProps, string[] | undefined>(
        ResourceAuthorshipEditDialogComponent,
        { data: { authorship: this.resource.res.resourceAuthorship ?? [] } }
      )
      .afterClosed()
      .subscribe(result => {
        if (result === undefined) {
          return;
        }
        this._resourceLegal
          .updateResourceAuthorship(this.resource.res.id, this.resource.res.type, result, this.resource.res.lastModificationDate)
          .subscribe(() => {
            // Optimistic local update so the viewer reflects the change immediately.
            // TODO(verify-locally): trigger a proper resource reload instead of mutating in place.
            this.resource.res.resourceAuthorship = result;
          });
      });
  }
}
