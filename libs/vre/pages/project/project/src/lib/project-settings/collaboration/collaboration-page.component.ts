import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { StatusComponent } from '@dasch-swiss/vre/shared/app-common-to-move';
import { DoubleChipSelectorComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { map, tap } from 'rxjs';
import { ProjectPageService } from '../../project-page.service';
import { AddUserComponent } from './add-user/add-user.component';
import { CollaborationPageService } from './collaboration-page.service';
import { ProjectMembersComponent } from './project-members.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-collaboration-page',
  template: `
    @if (hasProjectAdminRights$ | async) {
      <div>
        @if (project$ | async; as project) {
          @if (project.status && (hasProjectAdminRights$ | async)) {
            <app-add-user [projectUuid]="projectUuid" />
          }
        }
        @if (activeProjectMembers$ | async; as activeProjectMembers) {
          @if (inactiveProjectMembers$ | async; as inactiveProjectMembers) {
            <div style="display: flex; justify-content: center; margin: 16px 0">
              <app-double-chip-selector
                [options]="[
                  ('pages.project.collaboration.activeUsers' | translate) + ' (' + activeProjectMembers.length + ')',
                  ('pages.project.collaboration.inactiveUsers' | translate) +
                    ' (' +
                    inactiveProjectMembers.length +
                    ')',
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
      </div>
    }

    @if ((hasProjectAdminRights$ | async) === false) {
      <app-status [status]="403" />
    }
  `,
  styleUrls: ['./collaboration-page.component.scss'],
  providers: [CollaborationPageService],
  imports: [
    AsyncPipe,
    TranslatePipe,
    DoubleChipSelectorComponent,
    StatusComponent,
    AddUserComponent,
    ProjectMembersComponent,
  ],
})
export class CollaborationPageComponent {
  private _translateService = inject(TranslateService);

  project$ = this._projectPageService.currentProject$.pipe(
    tap(project => {
      this.titleService.setTitle(`Project ${project.shortname} | Collaboration`);
    })
  );
  hasProjectAdminRights$ = this._projectPageService.hasProjectAdminRights$;

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
