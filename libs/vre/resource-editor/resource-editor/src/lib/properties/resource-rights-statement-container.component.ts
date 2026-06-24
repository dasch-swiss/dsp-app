import { AsyncPipe } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { ProjectApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { DspResource, PaginatedApiService } from '@dasch-swiss/vre/shared/app-common';
import { ResourceRightsStatementComponent } from '@dasch-swiss/vre/ui/ui';
import { map, Observable, of, switchMap } from 'rxjs';
import { ResourceFetcherService } from '../representation/resource-fetcher.service';
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
        (saveAuthorship)="onSaveAuthorship($event)" />
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
    private readonly _paginatedApi: PaginatedApiService,
    private readonly _projectApi: ProjectApiService,
    private readonly _resourceFetcher: ResourceFetcherService,
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

  onSaveAuthorship(authorship: string[]): void {
    this._resourceLegal
      .updateResourceAuthorship(
        this.resource.res.id,
        this.resource.res.type,
        authorship,
        this.resource.res.lastModificationDate
      )
      .subscribe(() => {
        // Refetch the resource so resourceAuthorship AND lastModificationDate are re-synced from
        // the server (DSP-API optimistic locking). Mirrors how property-value edits reload; without
        // this, the stale in-memory lastModificationDate makes the next save fail. The reload pushes
        // a fresh DspResource down through the viewer tree, re-binding this component's [resource].
        this._resourceFetcher.reload();
      });
  }
}
