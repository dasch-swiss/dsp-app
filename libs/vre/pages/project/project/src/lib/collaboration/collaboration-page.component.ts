import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ReadUser } from '@dasch-swiss/dsp-js';
import { LoadProjectMembersAction, ProjectsSelectors } from '@dasch-swiss/vre/core/state';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { Store } from '@ngxs/store';
import { combineLatest, filter, first, map, Observable, tap } from 'rxjs';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-collaboration-page',
  template: `
    <div *ngIf="isAdmin$ | async" class="content large middle">
      <app-add-user
        *ngIf="(project$ | async)?.status && (isAdmin$ | async) === true"
        [projectUuid]="projectUuid$ | async" />

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
})
export class CollaborationPageComponent implements OnInit {
  project$ = this._store.select(ProjectsSelectors.currentProject);
  projectMembers$ = this._store.select(ProjectsSelectors.projectMembers);
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

  get activeProjectMembers$(): Observable<ReadUser[]> {
    return combineLatest([this.project$, this.projectMembers$]).pipe(
      map(([currentProject, projectMembers]) => {
        if (!currentProject || !projectMembers[currentProject.id]) {
          return [];
        }
        return projectMembers[currentProject.id]?.value.filter(member => member?.status === true) || [];
      })
    );
  }

  get inactiveProjectMembers$(): Observable<ReadUser[]> {
    return combineLatest([this.project$, this.projectMembers$]).pipe(
      map(([currentProject, projectMembers]) => {
        if (!currentProject || !projectMembers[currentProject.id]) {
          return [];
        }
        return projectMembers[currentProject?.id].value.filter(member => member?.status === false) || [];
      })
    );
  }

  constructor(
    private _store: Store,
    protected _titleService: Title
  ) {}

  ngOnInit() {
    this.projectUuid$.subscribe(projectUuid => {
      if (projectUuid) {
        this._store.dispatch(new LoadProjectMembersAction(projectUuid));
      }
    });
  }
}
