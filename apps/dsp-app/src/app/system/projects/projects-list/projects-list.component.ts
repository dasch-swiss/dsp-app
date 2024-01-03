import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Constants, ReadProject, ReadUser, StoredProject, UpdateProjectRequest } from '@dasch-swiss/dsp-js';
import { ProjectApiService } from '@dasch-swiss/vre/shared/app-api';
import { RouteConstants } from '@dasch-swiss/vre/shared/app-config';
import { ProjectService, SortingService } from '@dasch-swiss/vre/shared/app-helper-services';
import { ProjectsSelectors, UserSelectors } from '@dasch-swiss/vre/shared/app-state';
import { Select } from '@ngxs/store';
import { combineLatest, Observable, Subject } from 'rxjs';
import { map, takeUntil, tap } from 'rxjs/operators';
import { ConfirmDialogComponent } from '../../../main/action/confirm-dialog/confirm-dialog.component';
import { SortProp } from '../../../main/action/sort-button/sort-button.component';

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
      '=1': '1 Project',
      other: '# Projects',
    },
  };

  // sort properties
  sortProps: SortProp[] = [
    {
      key: 'shortcode',
      label: 'Short code',
    },
    {
      key: 'shortname',
      label: 'Short name',
    },
    {
      key: 'longname',
      label: 'Project name',
    },
  ];

  sortBy = 'longname'; // default sort by

  @Select(UserSelectors.user) user$: Observable<ReadUser>;
  @Select(UserSelectors.userProjectAdminGroups)
  userProjectAdminGroups$: Observable<string[]>;
  @Select(UserSelectors.isSysAdmin) isSysAdmin$: Observable<boolean>;
  @Select(ProjectsSelectors.readProjects) readProjects$: Observable<ReadProject[]>;
  @Select(ProjectsSelectors.isProjectsLoading)
  isProjectsLoading$: Observable<boolean>;

  constructor(
    private _projectApiService: ProjectApiService,
    private _dialog: MatDialog,
    private _router: Router,
    private _sortingService: SortingService
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
    this._router.navigate([RouteConstants.project, RouteConstants.createNew]);
  }

  editProject(iri: string) {
    const uuid = ProjectService.IriToUuid(iri);
    this._router.navigate([RouteConstants.project, uuid, RouteConstants.edit]);
  }

  askToDeactivateProject(name: string, id: string) {
    this._dialog
      .open(ConfirmDialogComponent, { data: { message: `Do you want to deactivate project ${name}?` } })
      .afterClosed()
      .subscribe(response => {
        if (response === true) this.deactivateProject(id);
      });
  }

  askToActivateProject(name: string, id: string) {
    this._dialog
      .open(ConfirmDialogComponent, { data: { message: `Do you want to reactivate project ${name}?` } })
      .afterClosed()
      .subscribe(response => {
        if (response === true) this.activateProject(id);
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

  deactivateProject(id: string) {
    this._projectApiService.delete(id).pipe(
      tap(() => {
        this.refreshParent.emit(); // TODO Soft or Hard refresh ?
      })
    );
  }

  activateProject(id: string) {
    // As there is no activate route implemented in the js lib, we use the update route to set the status to true
    const data: UpdateProjectRequest = new UpdateProjectRequest();
    data.status = true;

    this._projectApiService.update(id, data).pipe(
      tap(() => {
        this.refreshParent.emit();
      })
    );
  }
}
