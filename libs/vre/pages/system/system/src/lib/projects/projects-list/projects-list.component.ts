import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Constants, StoredProject } from '@dasch-swiss/dsp-js';
import { ProjectApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { AppConfigService, RouteConstants } from '@dasch-swiss/vre/core/config';
import { AppError } from '@dasch-swiss/vre/core/error-handler';
import { UserService } from '@dasch-swiss/vre/core/session';
import { UserPermissions } from '@dasch-swiss/vre/shared/app-common';
import { ProjectService, SortingHelper } from '@dasch-swiss/vre/shared/app-helper-services';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { DialogService } from '@dasch-swiss/vre/ui/ui';
import { TranslateService } from '@ngx-translate/core';
import { filter, map, Observable, Subject, switchMap, take, takeUntil } from 'rxjs';
import { SortProp } from '../../sort-button/sort-button.component';
import {
  EraseProjectDialogComponent,
  IEraseProjectDialogProps,
} from './erase-project-dialog/erase-project-dialog.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-projects-list',
  templateUrl: './projects-list.component.html',
  styleUrls: ['./projects-list.component.scss'],
})
export class ProjectsListComponent implements OnInit, OnDestroy {
  private _ngUnsubscribe = new Subject<void>();

  @Input({ required: true }) isUserActive!: boolean;
  @Input({ required: true }) projectsList!: StoredProject[];
  @Input() createNewButtonEnabled = false;
  @Input() isUsersProjects = false;
  @Output() refreshParent = new EventEmitter<void>();

  isLoading = false;
  allowEraseProject = this._appConfigService.dspFeatureFlagsConfig.allowEraseProjects;
  systemProjects: string[] = [Constants.SystemProjectIRI, Constants.DefaultSharedOntologyIRI];

  itemPluralMapping = {
    project: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      '=1': `1 ${this._translateService.instant('pages.system.projectsList.project')}`,
      other: `# ${this._translateService.instant('pages.system.projectsList.projects')}`,
    },
  };

  sortProps: SortProp[] = [
    {
      key: 'shortcode',
      label: this._translateService.instant('pages.system.projectsList.sortShortCode'),
    },
    {
      key: 'shortname',
      label: this._translateService.instant('pages.system.projectsList.sortShortName'),
    },
    {
      key: 'longname',
      label: this._translateService.instant('pages.system.projectsList.sortProjectName'),
    },
  ];

  sortBy = 'longname';

  user$ = this._userService.user$;
  isSysAdmin$ = this._userService.isSysAdmin$;

  constructor(
    private _appConfigService: AppConfigService,
    private _dialog: MatDialog,
    private _dialogService: DialogService,
    private _notification: NotificationService,
    private _projectApiService: ProjectApiService,
    private _router: Router,
    private _userService: UserService,
    private _translateService: TranslateService,
    private _projectService: ProjectService
  ) {}

  ngOnInit() {
    this.sortBy = localStorage.getItem('sortProjectsBy') || this.sortBy;
    this.sortList(this.sortBy);
  }

  ngOnDestroy() {
    this._ngUnsubscribe.next();
    this._ngUnsubscribe.complete();
  }

  trackByFn = (index: number, item: StoredProject) => `${index}-${item.id}`;

  userHasPermission$(projectIri: string): Observable<boolean> {
    return this.user$.pipe(
      filter(user => !!user),
      takeUntil(this._ngUnsubscribe),
      map(user => UserPermissions.hasProjectAdminRights(user, projectIri))
    );
  }

  userIsProjectAdmin$(projectIri: string): Observable<boolean> {
    return this.user$.pipe(
      takeUntil(this._ngUnsubscribe),
      map(user => {
        if (!user || !user.permissions.groupsPerProject) {
          return false;
        }
        return ProjectService.IsMemberOfProjectAdminGroup(
          user.permissions.groupsPerProject,
          ProjectService.IriToUuid(projectIri)
        );
      })
    );
  }

  openProjectPage(iri: string) {
    const uuid = ProjectService.IriToUuid(iri);

    this._router
      .navigateByUrl(`/${RouteConstants.refresh}`, { skipLocationChange: true })
      .then(() => this._router.navigate([RouteConstants.project, uuid]));
  }

  createNewProject() {
    const queryParams = this.isUsersProjects ? { [RouteConstants.assignCurrentUser]: true } : {};
    this._router.navigate([RouteConstants.project, RouteConstants.createNew], { queryParams });
  }

  editProject(iri: string) {
    const uuid = ProjectService.IriToUuid(iri);
    this._router.navigate([RouteConstants.project, uuid, RouteConstants.settings, RouteConstants.edit]);
  }

  askToActivateProject(name: string, id: string) {
    this._dialogService
      .afterConfirmation(
        this._translateService.instant('pages.system.projectsList.reactivateConfirmation', {
          0: name,
        })
      )
      .pipe(switchMap(() => this._projectApiService.update(id, { status: true })))
      .subscribe(() => {
        this.refreshParent.emit();
      });
  }

  askToDeactivateProject(name: string, id: string) {
    this._dialogService
      .afterConfirmation(
        this._translateService.instant('pages.system.projectsList.deactivateConfirmation', {
          0: name,
        })
      )
      .pipe(switchMap(() => this._projectApiService.delete(id)))
      .subscribe(() => {
        this.refreshParent.emit();
      });
  }

  askToEraseProject(project: StoredProject) {
    this._dialog
      .open<EraseProjectDialogComponent, IEraseProjectDialogProps>(EraseProjectDialogComponent, {
        data: <IEraseProjectDialogProps>{
          project,
        },
      })
      .afterClosed()
      .pipe(
        filter(response => !!response),
        take(1)
      )
      .subscribe((erasedProject: StoredProject) => {
        this.refreshParent.emit();
        this._notification.openSnackBar(
          this._translateService.instant('pages.system.projectsList.eraseConfirmation', {
            0: erasedProject.shortname,
          })
        );
      });
  }

  sortList(key: any) {
    if (!this.projectsList) {
      throw new AppError('List is not defined.');
    }
    this.projectsList = SortingHelper.keySortByAlphabetical(this.projectsList, key);
    localStorage.setItem('sortProjectsBy', key);
  }
}
