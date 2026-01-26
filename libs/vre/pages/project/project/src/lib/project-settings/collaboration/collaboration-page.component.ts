import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { DoubleChipSelectorComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslatePipe } from '@ngx-translate/core';
import { map, tap } from 'rxjs';
import { ProjectPageService } from '../../project-page.service';
import { AddUserComponent } from './add-user/add-user.component';
import { CollaborationPageService } from './collaboration-page.service';
import { ProjectMembersComponent } from './project-members.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-collaboration-page',
  template: `
    @if (project$ | async; as project) {
      @if (project.status) {
        <app-add-user [projectUuid]="projectUuid" />
      }
    }
    @if (activeProjectMembers$ | async; as activeProjectMembers) {
      @if (inactiveProjectMembers$ | async; as inactiveProjectMembers) {
        <div style="display: flex; justify-content: center; margin: 16px 0">
          <app-double-chip-selector
            [options]="[
              ('pages.project.collaboration.activeUsers' | translate) + ' (' + activeProjectMembers.length + ')',
              ('pages.project.collaboration.inactiveUsers' | translate) + ' (' + inactiveProjectMembers.length + ')',
            ]"
            [(value)]="showActiveUsers" />
        </div>
        @if (showActiveUsers) {
          <app-project-members [users]="activeProjectMembers" />
        }
        @if (!showActiveUsers) {
          <app-project-members [users]="inactiveProjectMembers" />
        }
      }
    }
  `,
  providers: [CollaborationPageService],
  imports: [AsyncPipe, TranslatePipe, DoubleChipSelectorComponent, AddUserComponent, ProjectMembersComponent],
})
export class CollaborationPageComponent {
  project$ = this._projectPageService.currentProject$.pipe(
    tap(project => {
      this.titleService.setTitle(`Project ${project.shortname} | Collaboration`);
    })
  );
  get projectUuid() {
    return this._projectPageService.currentProjectUuid;
  }

  showActiveUsers = true;

  activeProjectMembers$ = this.collaborationPageService.projectMembers$.pipe(
    map(members => (members ?? []).filter(v => v.status === true))
  );
  inactiveProjectMembers$ = this.collaborationPageService.projectMembers$.pipe(
    map(members => (members ?? []).filter(v => v.status === false))
  );

  constructor(
    protected titleService: Title,
    public collaborationPageService: CollaborationPageService,
    private readonly _projectPageService: ProjectPageService
  ) {}
}
