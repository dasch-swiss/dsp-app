import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Inject,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {
  ApiResponseError,
  Constants,
  KnoraApiConnection,
  Permissions,
  ReadProject,
  ReadUser,
} from '@dasch-swiss/dsp-js';
import { UserApiService } from '@dasch-swiss/vre/shared/app-api';
import { DspApiConnectionToken, RouteConstants } from '@dasch-swiss/vre/shared/app-config';
import { AppErrorHandler } from '@dasch-swiss/vre/shared/app-error-handler';
import { ProjectService, SortingService } from '@dasch-swiss/vre/shared/app-helper-services';
import {
  LoadProjectAction,
  LoadProjectMembersAction,
  LoadUserAction,
  ProjectsSelectors,
  RemoveUserFromProjectAction,
  SetUserAction,
  UserSelectors,
} from '@dasch-swiss/vre/shared/app-state';
import { Actions, ofActionSuccessful, Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { DialogComponent } from '../../../main/dialog/dialog.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-users-list',
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss'],
})
export class UsersListComponent implements OnInit {
  // list of users: status active or inactive (deleted)
  @Input() status: boolean;

  // list of users: depending on the parent
  @Input() list: ReadUser[];

  // enable the button to create new user
  @Input() createNew = false;

  // proje0ct data
  @Input() project: ReadProject;

  // in case of modification
  @Output() refreshParent: EventEmitter<any> = new EventEmitter<any>();

  // i18n plural mapping
  itemPluralMapping = {
    user: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      '=1': '1 User',
      other: '# Users',
    },
    member: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      '=1': '1 Member',
      other: '# Members',
    },
  };

  //
  // project view
  // dsp-js admin group iri
  adminGroupIri: string = Constants.ProjectAdminGroupIRI;

  // project uuid; as identifier in project application state service
  projectUuid: string;

  //
  // sort properties
  sortProps: any = [
    {
      key: 'familyName',
      label: 'Last name',
    },
    {
      key: 'givenName',
      label: 'First name',
    },
    {
      key: 'email',
      label: 'E-mail',
    },
    {
      key: 'username',
      label: 'Username',
    },
  ];

  // ... and sort by 'username'
  sortBy = 'username';

  @Select(UserSelectors.isSysAdmin) isSysAdmin$: Observable<boolean>;
  @Select(UserSelectors.user) user$: Observable<ReadUser>;
  @Select(UserSelectors.username) username$: Observable<string>;
  @Select(ProjectsSelectors.isCurrentProjectAdmin)
  isProjectAdmin$: Observable<boolean>;
  @Select(ProjectsSelectors.currentProject) project$: Observable<ReadProject>;
  @Select(ProjectsSelectors.isProjectsLoading)
  isProjectsLoading$: Observable<boolean>;
  @Select(UserSelectors.isLoading) isUsersLoading$: Observable<boolean>;

  constructor(
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private _userApiService: UserApiService,
    private _dialog: MatDialog,
    private _errorHandler: AppErrorHandler,
    private _route: ActivatedRoute,
    private _router: Router,
    private _sortingService: SortingService,
    private _store: Store,
    private _projectService: ProjectService,
    private _actions$: Actions,
    private _cd: ChangeDetectorRef
  ) {
    // get the uuid of the current project
    this._route.parent.parent.paramMap.subscribe((params: Params) => {
      this.projectUuid = params.get('uuid');
    });
  }

  ngOnInit() {
    // sort list by defined key
    if (localStorage.getItem('sortUsersBy')) {
      this.sortBy = localStorage.getItem('sortUsersBy');
    } else {
      localStorage.setItem('sortUsersBy', this.sortBy);
    }
  }

  trackByFn = (index: number, item: ReadUser) => `${index}-${item.id}`;

  /**
   * returns true, when the user is project admin;
   * when the parameter permissions is not set,
   * it returns the value for the logged-in user
   *
   *
   * @param  [permissions] user's permissions
   * @returns boolean
   */
  userIsProjectAdmin(permissions?: Permissions): boolean {
    if (!this.project) {
      return false;
    }

    return ProjectService.IsMemberOfProjectAdminGroup(permissions.groupsPerProject, this.project.id);
  }

  /**
   * returns true, when the user is system admin
   *
   * @param permissions PermissionData from user profile
   */
  userIsSystemAdmin(permissions: Permissions): boolean {
    let admin = false;
    const groupsPerProjectKeys: string[] = Object.keys(permissions.groupsPerProject);

    for (const key of groupsPerProjectKeys) {
      if (key === Constants.SystemProjectIRI) {
        admin = permissions.groupsPerProject[key].indexOf(Constants.SystemAdminGroupIRI) > -1;
      }
    }

    return admin;
  }

  /**
   * update user's group memebership
   */
  updateGroupsMembership(id: string, groups: string[]): void {
    const currentUserGroups: string[] = [];
    this._userApiService.getGroupMembershipsForUser(id).subscribe(
      response => {
        for (const group of response.groups) {
          currentUserGroups.push(group.id);
        }

        if (currentUserGroups.length === 0) {
          // add user to group
          // console.log('add user to group');
          for (const newGroup of groups) {
            this.addUserToGroupMembership(id, newGroup);
          }
        } else {
          // which one is deselected?
          // find id in groups --> if not exists: remove from group
          for (const oldGroup of currentUserGroups) {
            if (groups.indexOf(oldGroup) === -1) {
              // console.log('remove from group', oldGroup);
              // the old group is not anymore one of the selected groups --> remove user from group
              this._userApiService
                .removeFromGroupMembership(id, oldGroup)
                .pipe(take(1))
                .subscribe(
                  () => {
                    if (this.projectUuid) {
                      this._store.dispatch(new LoadProjectAction(this.projectUuid));
                    }
                  },
                  (ngError: ApiResponseError) => {
                    this._errorHandler.showMessage(ngError);
                  }
                );
            }
          }
          for (const newGroup of groups) {
            if (currentUserGroups.indexOf(newGroup) === -1) {
              this.addUserToGroupMembership(id, newGroup);
            }
          }
        }
      },
      (error: ApiResponseError) => {
        this._errorHandler.showMessage(error);
      }
    );
  }

  /**
   * update user's admin-group membership
   */
  updateProjectAdminMembership(id: string, permissions: Permissions): void {
    const currentUser = this._store.selectSnapshot(UserSelectors.user);
    if (this.userIsProjectAdmin(permissions)) {
      // true = user is already project admin --> remove from admin rights

      this._userApiService.removeFromProjectMembership(id, this.project.id, true).subscribe(
        response => {
          // if this user is not the logged-in user
          if (currentUser.username !== response.user.username) {
            this._store.dispatch(new SetUserAction(response.user));
            this.refreshParent.emit();
          } else {
            // the logged-in user removed himself as project admin
            // the list is not available anymore;
            // open dialog to confirm and
            // redirect to project page
            // update the application state of logged-in user and the session
            this._store.dispatch(new LoadUserAction(currentUser.username));
            this._actions$
              .pipe(ofActionSuccessful(LoadUserAction))
              .pipe(take(1))
              .subscribe(() => {
                const isSysAdmin = ProjectService.IsMemberOfSystemAdminGroup(
                  (currentUser as ReadUser).permissions.groupsPerProject
                );
                if (isSysAdmin) {
                  this.refreshParent.emit();
                } else {
                  // logged-in user is NOT system admin:
                  // go to project page and reload project admin interface
                  this._router
                    .navigateByUrl(RouteConstants.refreshRelative, {
                      skipLocationChange: true,
                    })
                    .then(() => this._router.navigate([`${RouteConstants.projectRelative}/${this.projectUuid}`]));
                }
              });
          }
        },
        (error: ApiResponseError) => {
          this._errorHandler.showMessage(error);
        }
      );
    } else {
      // false: user isn't project admin yet --> add admin rights
      this._userApiService.addToProjectMembership(id, this.project.id).subscribe(
        response => {
          if (currentUser.username !== response.user.username) {
            this._store.dispatch(new SetUserAction(response.user));
            this.refreshParent.emit();
          } else {
            // the logged-in user (system admin) added himself as project admin
            // update the application state of logged-in user and the session
            this._store.dispatch(new LoadUserAction(currentUser.username));
            this._actions$
              .pipe(ofActionSuccessful(LoadUserAction))
              .pipe(take(1))
              .subscribe(() => {
                this.refreshParent.emit();
              });
          }
        },
        (error: ApiResponseError) => {
          this._errorHandler.showMessage(error);
        }
      );
    }
  }

  updateSystemAdminMembership(user: ReadUser, systemAdmin: boolean): void {
    this._userApiService
      .updateSystemAdminMembership(user.id, systemAdmin)
      .pipe(take(1))
      .subscribe(
        response => {
          this._store.dispatch(new SetUserAction(response.user));
          if (this._store.selectSnapshot(UserSelectors.username) !== user.username) {
            this.refreshParent.emit();
          }
        },
        (error: ApiResponseError) => {
          this._errorHandler.showMessage(error);
        }
      );
  }

  /**
   * open dialog in every case of modification:
   * edit user profile data, update user's password,
   * remove user from project or toggle project admin membership,
   * delete and reactivate user
   *
   */
  openDialog(mode: string, user?: ReadUser): void {
    const dialogConfig: MatDialogConfig = {
      width: '560px',
      maxHeight: '80vh',
      position: {
        top: '112px',
      },
      data: { user, mode },
    };

    const dialogRef = this._dialog.open(DialogComponent, dialogConfig);

    dialogRef.afterClosed().subscribe(response => {
      if (response === true) {
        switch (mode) {
          case 'removeFromProject':
            this._store.dispatch(new RemoveUserFromProjectAction(user.id, this.project.id));
            this._actions$
              .pipe(ofActionSuccessful(LoadProjectMembersAction))
              .pipe(take(1))
              .subscribe(() => {
                this.refreshParent.emit();
              });
            break;
          case 'deleteUser':
            this.deleteUser(user.id);
            break;
          case 'activateUser':
            this.activateUser(user.id);
            break;
        }
      }
      this._cd.markForCheck();
    });
  }

  /**
   * delete resp. deactivate user
   *
   * @param id user's IRI
   */
  deleteUser(id: string) {
    this._userApiService
      .delete(id)
      .pipe(take(1))
      .subscribe(
        response => {
          this._store.dispatch(new SetUserAction(response.user));
          this.refreshParent.emit();
        },
        (error: ApiResponseError) => {
          this._errorHandler.showMessage(error);
        }
      );
  }

  /**
   * reactivate user
   *
   * @param id user's IRI
   */
  activateUser(id: string) {
    this._userApiService
      .updateStatus(id, true)
      .pipe(take(1))
      .subscribe(
        response => {
          this._store.dispatch(new SetUserAction(response.user));
          this.refreshParent.emit();
        },
        (error: ApiResponseError) => {
          this._errorHandler.showMessage(error);
        }
      );
  }

  disableMenu(): boolean {
    // disable menu in case of:
    // project.status = false
    if (this.project && this.project.status === false) {
      return true;
    } else {
      return (
        !this._store.selectSnapshot(UserSelectors.isSysAdmin) &&
        !this._store.selectSnapshot(ProjectsSelectors.isCurrentProjectAdmin)
      );
    }
  }

  sortList(key: any) {
    this.sortBy = key;
    this.list = this._sortingService.keySortByAlphabetical(this.list, this.sortBy as any);
    localStorage.setItem('sortUsersBy', key);
  }

  private addUserToGroupMembership(id: string, newGroup: string): void {
    this._userApiService
      .addToGroupMembership(id, newGroup)
      .pipe(take(1))
      .subscribe(() => {
        if (this.projectUuid) {
          this._store.dispatch(new LoadProjectAction(this.projectUuid));
        }
      });
  }
}
