import { Component, Input, OnChanges } from '@angular/core';
import { Router } from '@angular/router';
import { ReadProject, ReadResource, ReadUser } from '@dasch-swiss/dsp-js';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { GetAttachedProjectAction, GetAttachedUserAction, ResourceSelectors } from '@dasch-swiss/vre/core/state';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { Actions, ofActionSuccessful, Store } from '@ngxs/store';
import { filter, map, take } from 'rxjs/operators';

@Component({
  selector: 'app-resource-info-bar',
  template: `
    <div class="infobar mat-caption" *ngIf="project$ | async as project">
      Resource of the project
      <a (click)="openProject(project)" class="link" [title]="project.longname">
        <strong>{{ project?.shortname }}</strong></a
      ><span *ngIf="resourceAttachedUser || resource.creationDate"
        >, created
        <span *ngIf="resourceAttachedUser"
          >by
          {{
            resourceAttachedUser.username
              ? resourceAttachedUser.username
              : resourceAttachedUser.givenName + ' ' + resourceAttachedUser.familyName
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

  resourceAttachedUser: ReadUser | undefined;

  project$ = this._store.select(ResourceSelectors.attachedProjects).pipe(
    filter(attachedProjects => attachedProjects[this.resource.id]?.value?.length > 0),
    map(attachedProjects =>
      attachedProjects[this.resource.id].value.find(u => u.id === this.resource.attachedToProject)
    )
  );

  constructor(
    private _store: Store,
    private _actions$: Actions,
    private router: Router
  ) {}

  ngOnChanges() {
    this._getResourceAttachedData(this.resource);
  }

  openProject(project: ReadProject) {
    this.router.navigate([RouteConstants.projectRelative, ProjectService.IriToUuid(project.id)]);
  }

  private _getResourceAttachedData(resource: ReadResource): void {
    this._actions$
      .pipe(ofActionSuccessful(GetAttachedUserAction))
      .pipe(take(1))
      .subscribe(() => {
        const attachedUsers = this._store.selectSnapshot(ResourceSelectors.attachedUsers);
        this.resourceAttachedUser = attachedUsers[resource.id].value.find(u => u.id === resource.attachedToUser);
      });
    this._store.dispatch([
      new GetAttachedUserAction(resource.id, resource.attachedToUser),
      new GetAttachedProjectAction(resource.id, resource.attachedToProject),
    ]);
  }
}
