import { Component, Input, OnInit } from '@angular/core';
import { ReadProject, ReadUser } from '@dasch-swiss/dsp-js';
import { PermissionsData } from '@dasch-swiss/dsp-js/src/models/admin/permissions-data';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { ProjectPageService } from '../../project-page.service';

@Component({
  selector: 'app-project-members-row',
  template: `
    <div style="display: flex; align-items: center; gap: 16px; padding: 16px 0">
      <app-user-description [user]="user" style="flex: 1" />

      <mat-chip-listbox>
        <mat-chip class="admin-chip" *ngIf="isProjectAdmin(user.permissions)">Admin</mat-chip>
      </mat-chip-listbox>

      <app-select-group *ngIf="project" [projectId]="project.id" [user]="user" />

      <app-project-members-row-menu [user]="user" *ngIf="project" [project]="project" />
    </div>
  `,
})
export class ProjectMembersRowComponent implements OnInit {
  @Input({ required: true }) user!: ReadUser;

  project?: ReadProject;

  constructor(private _projectPageService: ProjectPageService) {}

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
