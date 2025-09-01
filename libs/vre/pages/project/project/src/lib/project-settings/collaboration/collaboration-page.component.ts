import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { map, tap } from 'rxjs';
import { ProjectPageService } from '../../project-page.service';
import { CollaborationPageService } from './collaboration-page.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-collaboration-page',
  template: `
    <div *ngIf="hasProjectAdminRights$ | async">
      <ng-container *ngIf="project$ | async as project">
        <app-add-user
          *ngIf="project.status && (hasProjectAdminRights$ | async) && (projectUuid$ | async) as projectUuid"
          [projectUuid]="projectUuid" />
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

    <app-status [status]="403" *ngIf="(hasProjectAdminRights$ | async) === false" />
  `,
  styleUrls: ['./collaboration-page.component.scss'],
  providers: [CollaborationPageService],
})
export class CollaborationPageComponent {
  project$ = this._projectPageService.currentProject$.pipe(
    tap(project => {
      this._titleService.setTitle(`Project ${project.shortname} | Collaboration`);
    })
  );
  hasProjectAdminRights$ = this._projectPageService.hasProjectAdminRights$;

  projectUuid$ = this._projectPageService.currentProjectUuid$;

  showActiveUsers = true;

  activeProjectMembers$ = this.collaborationPageService.projectMembers$.pipe(
    map(members => (members ?? []).filter(v => v.status === true))
  );
  inactiveProjectMembers$ = this.collaborationPageService.projectMembers$.pipe(
    map(members => (members ?? []).filter(v => v.status === false))
  );

  constructor(
    protected _titleService: Title,
    public collaborationPageService: CollaborationPageService,
    private _projectPageService: ProjectPageService
  ) {}
}
