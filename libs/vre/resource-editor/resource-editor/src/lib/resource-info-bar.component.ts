import { Component, Input, OnChanges } from '@angular/core';
import { Router } from '@angular/router';
import { ReadProject, ReadResource } from '@dasch-swiss/dsp-js';
import { ProjectApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { ResourceFetcherService } from '@dasch-swiss/vre/resource-editor/representations';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { map, Observable } from 'rxjs';

@Component({
  selector: 'app-resource-info-bar',
  template: `
    <div class="infobar mat-caption" *ngIf="project$ | async as project">
      Resource of the project
      <a (click)="openProject(project)" class="link" [title]="project.longname">
        <strong>{{ project?.shortname }}</strong></a
      >,<span *ngIf="resourceAttachedUser$ | async as resourceAttachedUser">
        created
        <span *ngIf="resourceAttachedUser"
          >by
          {{
            resourceAttachedUser?.givenName || resourceAttachedUser?.familyName
              ? resourceAttachedUser?.givenName + ' ' + resourceAttachedUser?.familyName
              : resourceAttachedUser?.username
          }}</span
        >
        <span *ngIf="resource.creationDate"> on {{ resource.creationDate | date }}</span>
      </span>
    </div>
  `,
  styles: [
    `
      .infobar {
        box-sizing: border-box;
        white-space: nowrap;
        color: rgba(0, 0, 0, 0.87);
      }
    `,
  ],
})
export class ResourceInfoBarComponent implements OnChanges {
  @Input({ required: true }) resource!: ReadResource;

  resourceAttachedUser$ = this._resourceFetcherService.attachedUser$;

  project$!: Observable<ReadProject>;

  constructor(
    private router: Router,
    private _resourceFetcherService: ResourceFetcherService,
    private _projectApiService: ProjectApiService
  ) {}

  ngOnChanges() {
    this.project$ = this._projectApiService
      .get(this.resource.attachedToProject)
      .pipe(map(response => response.project));
  }

  openProject(project: ReadProject) {
    this.router.navigate([RouteConstants.projectRelative, ProjectService.IriToUuid(project.id)]);
  }
}
