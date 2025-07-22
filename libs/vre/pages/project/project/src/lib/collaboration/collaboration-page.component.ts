import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ProjectsSelectors } from '@dasch-swiss/vre/core/state';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { Store } from '@ngxs/store';
import { filter, first, map, tap } from 'rxjs';
import { CollaborationPageService } from './collaboration-page.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-collaboration-page',
  template: `
    <div *ngIf="isAdmin$ | async" class="content large middle">
      <ng-container *ngIf="project$ | async as project">
        <app-add-user *ngIf="project.status && (isAdmin$ | async) === true" [projectUuid]="projectUuid$ | async" />
      </ng-container>

      <ng-container *ngIf="activeProjectMembers$ | async as activeProjectMembers">
        <ng-container *ngIf="inactiveProjectMembers$ | async as inactiveProjectMembers">
          <div style="display: flex; justify-content: center; margin: 16px 0">
            <app-double-chip-selector
              [options]="[
                'Active users (' + activeProjectMembers.length + ')',
                'Inactive users (' + inactiveProjectMembers.length + ')',
              ]"
              [(value)]="showActiveUsers" />
          </div>

          <app-project-members *ngIf="showActiveUsers" [users]="activeProjectMembers" />
          <app-project-members *ngIf="!showActiveUsers" [users]="inactiveProjectMembers" />
        </ng-container>
      </ng-container>
    </div>

    <div *ngIf="(isAdmin$ | async) === false" class="content large middle">
      <app-status [status]="403" />
    </div>
  `,
  styleUrls: ['./collaboration-page.component.scss'],
  providers: [CollaborationPageService],
})
export class CollaborationPageComponent {
  project$ = this._store.select(ProjectsSelectors.currentProject);
  isAdmin$ = this._store.select(ProjectsSelectors.isCurrentProjectAdminOrSysAdmin);

  projectUuid$ = this.project$.pipe(
    tap(p => {
      this._titleService.setTitle(`Project ${p?.shortname} | Collaboration`);
    }),
    map(p => {
      return ProjectService.IriToUuid(p?.id || '');
    }),
    filter(uuid => !!uuid),
    first()
  );

  showActiveUsers = true;

  activeProjectMembers$ = this.collaborationPageService.projectMembers$.pipe(
    map(members => (members ?? []).filter(v => v.status === true))
  );
  inactiveProjectMembers$ = this.collaborationPageService.projectMembers$.pipe(
    map(members => (members ?? []).filter(v => v.status === false))
  );

  constructor(
    private _store: Store,
    protected _titleService: Title,
    public collaborationPageService: CollaborationPageService
  ) {}
}
