import { Component, Input, OnInit } from '@angular/core';
import { MatChip, MatChipListbox } from '@angular/material/chips';
import { ReadProject, ReadUser } from '@dasch-swiss/dsp-js';
import { PermissionsData } from '@dasch-swiss/dsp-js/src/models/admin/permissions-data';
import { UserDescriptionComponent } from '@dasch-swiss/vre/pages/system/system';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { TranslatePipe } from '@ngx-translate/core';
import { ProjectPageService } from '../../project-page.service';
import { ProjectMembersRowMenuComponent } from '../project-members-row-menu.component';
import { SelectGroupComponent } from './select-group/select-group.component';

@Component({
  selector: 'app-project-members-row',
  template: `
    <div style="display: flex; align-items: center; gap: 16px; padding: 16px 0">
      <app-user-description [user]="user" style="flex: 1" />

      <mat-chip-listbox>
        @if (isProjectAdmin(user.permissions)) {
          <mat-chip class="admin-chip">{{ 'pages.project.collaboration.admin' | translate }}</mat-chip>
        }
      </mat-chip-listbox>

      @if (project) {
        <app-select-group [projectId]="project.id" [user]="user" />
      }

      @if (project) {
        <app-project-members-row-menu [user]="user" [project]="project" />
      }
    </div>
  `,
  imports: [
    MatChip,
    MatChipListbox,
    ProjectMembersRowMenuComponent,
    SelectGroupComponent,
    TranslatePipe,
    UserDescriptionComponent,
  ],
})
export class ProjectMembersRowComponent implements OnInit {
  @Input({ required: true }) user!: ReadUser;

  project?: ReadProject;

  constructor(private readonly _projectPageService: ProjectPageService) {}

  ngOnInit() {
    this._projectPageService.currentProject$.subscribe(project => {
      this.project = project;
    });
  }

  isProjectAdmin(permissions: PermissionsData): boolean {
    if (!permissions.groupsPerProject) {
      return false;
    }

    return ProjectService.IsMemberOfProjectAdminGroup(permissions.groupsPerProject, this.project?.id || '');
  }
}
