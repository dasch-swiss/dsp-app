import { Component, Input, OnInit } from '@angular/core';
import { ReadUser } from '@dasch-swiss/dsp-js';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';
import { GetAttachedProjectAction, GetAttachedUserAction, ResourceSelectors } from '@dasch-swiss/vre/shared/app-state';
import { Actions, ofActionSuccessful, Store } from '@ngxs/store';
import { filter, map, take } from 'rxjs/operators';

@Component({
  selector: 'app-resource-info-bar',
  template: `
    <div class="infobar mat-caption" *ngIf="project$ | async as project">
      Resource of the project
      <a class="link" [title]="project.longname" (click)="openProject(project)">
        <strong>{{ project?.shortname }}</strong></a
      ><span *ngIf="resourceAttachedUser || resource.res.creationDate"
        >, created
        <span *ngIf="resourceAttachedUser"
          >by
          {{
            resourceAttachedUser.username
              ? resourceAttachedUser.username
              : resourceAttachedUser.givenName + ' ' + resourceAttachedUser.familyName
          }}</span
        >
        <span *ngIf="resource.res.creationDate"> on {{ resource.res.creationDate | date }}</span>
      </span>
    </div>
  `,
})
export class ResourceInfoBarComponent implements OnInit {
  @Input({ required: true }) resource!: DspResource;

  resourceAttachedUser: ReadUser | undefined;

  project$ = this._store.select(ResourceSelectors.attachedProjects).pipe(
    filter(attachedProjects => attachedProjects[this.resource.res.id]?.value?.length > 0),
    map(attachedProjects =>
      attachedProjects[this.resource.res.id].value.find(u => u.id === this.resource.res.attachedToProject)
    )
  );

  constructor(
    private _store: Store,
    private _actions$: Actions
  ) {}

  ngOnInit() {
    this._getResourceAttachedData(this.resource);
  }

  openProject(project: any) {}

  private _getResourceAttachedData(resource: DspResource): void {
    this._actions$
      .pipe(ofActionSuccessful(GetAttachedUserAction))
      .pipe(take(1))
      .subscribe(() => {
        const attachedUsers = this._store.selectSnapshot(ResourceSelectors.attachedUsers);
        this.resourceAttachedUser = attachedUsers[resource.res.id].value.find(
          u => u.id === resource.res.attachedToUser
        );
      });
    this._store.dispatch([
      new GetAttachedUserAction(resource.res.id, resource.res.attachedToUser),
      new GetAttachedProjectAction(resource.res.id, resource.res.attachedToProject),
    ]);
  }
}
