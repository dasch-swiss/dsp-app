import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ReadUser } from '@dasch-swiss/dsp-js';
import { AdminUsersApiService } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { AppError } from '@dasch-swiss/vre/core/error-handler';
import { CollaborationPageService } from '../collaboration-page.service';

@Component({
  selector: 'app-select-group',
  template: `
    <ng-container *ngIf="groups$ | async as groups">
      <mat-form-field *ngIf="groups.length > 0">
        <mat-select
          placeholder="Permission group"
          [formControl]="groupCtrl"
          multiple
          (selectionChange)="updateGroupsMembership($event.value)">
          <mat-option *ngFor="let group of groups" [value]="group.id" [disabled]="!user.status">
            {{ group.name }}
          </mat-option>
        </mat-select>
      </mat-form-field>

      <div *ngIf="groups.length === 0" class="center">No group defined yet.</div>
    </ng-container>
  `,
  styles: [
    `
      :host ::ng-deep .mat-mdc-form-field-subscript-wrapper {
        display: none !important;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectGroupComponent implements OnInit {
  @Input({ required: true }) projectId!: string;
  @Input({ required: true }) user!: ReadUser;

  groups$ = this._collaborationPageService.groups$;
  groupCtrl!: FormControl<string[] | null>;

  constructor(
    private _adminUsersApiService: AdminUsersApiService,
    private _collaborationPageService: CollaborationPageService
  ) {}

  ngOnInit() {
    this.groupCtrl = new FormControl<string[]>(this._getPermissions());
  }

  updateGroupsMembership(newGroups: string[]): void {
    const userGroups = this.user.groups || [];
    if (newGroups.length > userGroups.length) {
      const groupIdAdded = newGroups.find(groupId =>
        userGroups.map(group => group.id).every(_groupId => _groupId !== groupId)
      );
      if (!groupIdAdded) {
        throw new AppError('Group should exist');
      }
      this._adminUsersApiService
        .postAdminUsersIriUseririGroupMembershipsGroupiri(this.user.id, groupIdAdded)
        .subscribe(() => {
          this._collaborationPageService.reloadProjectMembers();
        });
    } else if (newGroups.length < userGroups.length) {
      const groupIdRemoved = userGroups.find(group => newGroups.indexOf(group.id) === -1);

      if (!groupIdRemoved) {
        throw new AppError('Group should exist');
      }
      this._adminUsersApiService
        .deleteAdminUsersIriUseririGroupMembershipsGroupiri(this.user.id, groupIdRemoved.id)
        .subscribe(() => {
          this._collaborationPageService.reloadProjectMembers();
        });
    }
  }

  private _getPermissions() {
    if (this.user.permissions?.groupsPerProject) {
      return this.user.permissions?.groupsPerProject[this.projectId];
    } else {
      return [];
    }
  }
}
