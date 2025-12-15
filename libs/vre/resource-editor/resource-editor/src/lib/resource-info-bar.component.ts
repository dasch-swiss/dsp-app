import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReadProject, ReadResource } from '@dasch-swiss/dsp-js';
import { ProjectApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { TranslatePipe } from '@ngx-translate/core';
import { map, Observable } from 'rxjs';
import { ResourceFetcherService } from './representations/resource-fetcher.service';

@Component({
  selector: 'app-resource-info-bar',
  template: `
    @if (project$ | async; as project) {
      <div class="infobar mat-caption">
        {{ 'resourceEditor.infoBar.resourceOfProject' | translate }}
        <a
          [routerLink]="[RouteConstants.projectRelative, getProjectUuid(project.id)]"
          class="link"
          [title]="project.longname">
          <strong>{{ project?.shortname }}</strong></a
        >,
        @if (resourceAttachedUser$ | async; as resourceAttachedUser) {
          <span>
            {{ 'resourceEditor.infoBar.created' | translate }}
            @if (resourceAttachedUser) {
              <span
                >{{ 'resourceEditor.infoBar.by' | translate }}
                {{
                  resourceAttachedUser?.givenName || resourceAttachedUser?.familyName
                    ? resourceAttachedUser?.givenName + ' ' + resourceAttachedUser?.familyName
                    : resourceAttachedUser?.username
                }}</span
              >
            }
            @if (resource.creationDate) {
              <span> {{ 'resourceEditor.infoBar.on' | translate }} {{ resource.creationDate | date }}</span>
            }
          </span>
        }
      </div>
    }
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
  imports: [AsyncPipe, DatePipe, RouterLink, TranslatePipe],
})
export class ResourceInfoBarComponent implements OnChanges {
  @Input({ required: true }) resource!: ReadResource;

  resourceAttachedUser$ = this._resourceFetcherService.attachedUser$;

  project$!: Observable<ReadProject>;

  readonly RouteConstants = RouteConstants;

  constructor(
    private readonly _resourceFetcherService: ResourceFetcherService,
    private readonly _projectApiService: ProjectApiService
  ) {}

  ngOnChanges() {
    this.project$ = this._projectApiService
      .get(this.resource.attachedToProject)
      .pipe(map(response => response.project));
  }

  getProjectUuid(projectIri: string): string {
    return ProjectService.IriToUuid(projectIri);
  }
}
