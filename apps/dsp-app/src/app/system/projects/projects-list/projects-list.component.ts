import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Constants, ReadProject, ReadUser, StoredProject } from '@dasch-swiss/dsp-js';
import { ProjectApiService } from '@dasch-swiss/vre/shared/app-api';
import { RouteConstants } from '@dasch-swiss/vre/shared/app-config';
import { ProjectService, SortingService } from '@dasch-swiss/vre/shared/app-helper-services';
import { NotificationService } from '@dasch-swiss/vre/shared/app-notification';
import { ProjectsSelectors, UserSelectors } from '@dasch-swiss/vre/shared/app-state';
import { DialogService } from '@dasch-swiss/vre/shared/app-ui';
import { TranslateService } from '@ngx-translate/core';
import { Select } from '@ngxs/store';
import { Observable, Subject, combineLatest } from 'rxjs';
import { filter, map, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { SortProp } from '../../../main/action/sort-button/sort-button.component';
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
  private ngUnsubscribe: Subject<void> = new Subject<void>();

  // list of users: status active or inactive (deleted)
  @Input() status: boolean;

  // list of projects: depending on the parent
  @Input() list: StoredProject[];

  // enable the button to create new project
  @Input() createNew = false;

  @Input() isUsersProjects = false;

  // in case of modification
  @Output() refreshParent: EventEmitter<void> = new EventEmitter<void>();

  // loading for progess indicator
  loading: boolean;

  // list of default, dsp-specific projects, which are not able to be deleted or to be editied
  doNotDelete: string[] = [Constants.SystemProjectIRI, Constants.DefaultSharedOntologyIRI];

  // i18n plural mapping
  itemPluralMapping = {
    project: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      '=1': `1 ${this.translateService.instant('appLabels.projects.list.project')}`,
      other: `# ${this.translateService.instant('appLabels.projects.list.projects')}`,
    },
  };

  // sort properties
  sortProps: SortProp[] = [
    {
      key: 'shortcode',
      label: this.translateService.instant('appLabels.projects.list.sortShortCode'),
    },
    {
      key: 'shortname',
      label: this.translateService.instant('appLabels.projects.list.sortShortName'),
    },
    {
      key: 'longname',
      label: this.translateService.instant('appLabels.projects.list.sortProjectName'),
    },
  ];

  sortBy = 'longname'; // default sort by

  @Select(UserSelectors.user) user$: Observable<ReadUser>;
  @Select(UserSelectors.userProjectAdminGroups) userProjectAdminGroups$: Observable<string[]>;
  @Select(UserSelectors.isSysAdmin) isSysAdmin$: Observable<boolean>;
  @Select(ProjectsSelectors.allProjects) allProjects: Observable<ReadProject[]>;
  @Select(ProjectsSelectors.isProjectsLoading) isProjectsLoading$: Observable<boolean>;

  constructor(
    private _projectApiService: ProjectApiService,
    private _dialogService: DialogService,
    private _router: Router,
    private _sortingService: SortingService,
    private translateService: TranslateService,
    private _dialog: MatDialog,
    private _notification: NotificationService
  ) {}

  ngOnInit() {
    // sort list by defined key
    this.sortBy = localStorage.getItem('sortProjectsBy') || this.sortBy;
    this.sortList(this.sortBy);
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  trackByFn = (index: number, item: StoredProject) => `${index}-${item.id}`;

  /**
   * return true, when the user is entitled to edit a project. This is
   * the case when a user either system admin or project admin of the given project.
   *
   * @param  projectId the iri of the project to be checked
   */
  userHasPermission$(projectIri: string): Observable<boolean> {
    return combineLatest([this.user$, this.userProjectAdminGroups$]).pipe(
      takeUntil(this.ngUnsubscribe),
      map(([user, userProjectGroups]) => ProjectService.IsProjectAdminOrSysAdmin(user, userProjectGroups, projectIri))
    );
  }

  /**
   * return true, when the user is project admin of the given project.
   *
   * @param  projectIri the iri of the project to be checked
   */
  userIsProjectAdmin$(projectIri: string): Observable<boolean> {
    return combineLatest([this.user$, this.userProjectAdminGroups$]).pipe(
      takeUntil(this.ngUnsubscribe),
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      map(([user, userProjectGroups]) => ProjectService.IsInProjectGroup(userProjectGroups, projectIri))
    );
  }

  /**
   * navigate to the project pages (e.g. board, collaboration or ontology)
   *
   * @param iri
   */
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

  askToDeactivateProject(name: string, id: string) {
    this._dialogService
      .afterConfirmation(
        this.translateService.instant('appLabels.projects.list.deactivateConfirmation', {
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
          this.translateService.instant('appLabels.projects.list.eraseConfirmation', {
            0: erasedProject.shortname,
          })
        );
      });
  }

  askToActivateProject(name: string, id: string) {
    this._dialogService
      .afterConfirmation(
        this.translateService.instant('appLabels.projects.list.reactivateConfirmation', {
          0: name,
        })
      )
      .pipe(switchMap(() => this._projectApiService.update(id, { status: true })))
      .subscribe(() => {
        this.refreshParent.emit();
      });
  }

  sortList(key: any) {
    if (!this.list) {
      // guard
      return;
    }
    this.list = this._sortingService.keySortByAlphabetical(this.list, key);
    localStorage.setItem('sortProjectsBy', key);
  }
}
