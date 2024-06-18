import { ChangeDetectorRef, Directive, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { ReadProject, ReadUser } from '@dasch-swiss/dsp-js';
import { RouteConstants } from '@dasch-swiss/vre/shared/app-config';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import {
  IKeyValuePairs,
  LoadProjectMembershipAction,
  LoadProjectOntologiesAction,
  LoadProjectsAction,
  ProjectsSelectors,
  UserSelectors,
} from '@dasch-swiss/vre/shared/app-state';
import { Actions, Select, Store, ofActionSuccessful } from '@ngxs/store';
import { Observable, Subject, combineLatest, of } from 'rxjs';
import { filter, map, take, takeUntil, takeWhile } from 'rxjs/operators';

@Directive()
export class ProjectBase implements OnInit, OnDestroy {
  destroyed: Subject<void> = new Subject<void>();
  project: ReadProject; // TODO use project$ instead

  // permissions of logged-in user
  isAdmin$: Observable<boolean> = combineLatest([
    this._store.select(UserSelectors.user).pipe(filter(user => user !== null)) as Observable<ReadUser>,
    this._store.select(UserSelectors.userProjectAdminGroups),
    this._route.params,
    this._route.parent.params,
  ]).pipe(
    takeUntil(this.destroyed),
    map(([user, userProjectGroups, params, parentParams]) => {
      const projectIri = this._projectService.uuidToIri(params.uuid ? params.uuid : parentParams.uuid);
      return ProjectService.IsProjectAdminOrSysAdmin(user, userProjectGroups, projectIri);
    })
  );

  projectUuid: string; // TODO use projectUuid$ instead
  projectUuid$: Observable<string> = combineLatest([
    this._route.params,
    this._route.parent?.params,
    this._route.parent?.parent ? this._route.parent.parent.params : of({}),
  ]).pipe(
    takeUntil(this.destroyed),
    map(([params, parentParams, parentParentParams]) => {
      return params[RouteConstants.uuidParameter]
        ? params[RouteConstants.uuidParameter]
        : parentParams[RouteConstants.uuidParameter]
          ? parentParams[RouteConstants.uuidParameter]
          : parentParentParams[RouteConstants.uuidParameter];
    })
  );

  get projectIri() {
    return this._projectService.uuidToIri(this.projectUuid);
  }

  @Select(UserSelectors.user) user$: Observable<ReadUser>;
  @Select(UserSelectors.userProjectAdminGroups) userProjectAdminGroups$: Observable<string[]>;
  @Select(ProjectsSelectors.isCurrentProjectAdminOrSysAdmin) isCurrentProjectAdminOrSysAdmin: Observable<boolean>;
  @Select(ProjectsSelectors.isCurrentProjectMember) isProjectMember$: Observable<boolean>;
  @Select(ProjectsSelectors.currentProject) project$: Observable<ReadProject>;
  @Select(ProjectsSelectors.isProjectsLoading) isProjectsLoading$: Observable<boolean>;
  @Select(ProjectsSelectors.isMembershipLoading) isMembershipLoading$: Observable<boolean>;
  @Select(ProjectsSelectors.projectMembers) projectMembers$: Observable<IKeyValuePairs<ReadUser>>;

  constructor(
    protected _store: Store,
    protected _route: ActivatedRoute,
    protected _projectService: ProjectService,
    protected _titleService: Title,
    protected _router: Router,
    protected _cd: ChangeDetectorRef,
    protected _actions$: Actions
  ) {}

  ngOnInit(): void {
    this.projectUuid$.pipe(takeUntil(this.destroyed)).subscribe(uuid => {
      this.projectUuid = uuid;
      this._loadMembership(uuid);
      this._loadProject(uuid);
    });
  }

  ngOnDestroy(): void {
    // this._store.dispatch([new ClearCurrentProjectAction(), new ClearProjectOntologiesAction(this.projectUuid)]);
    this.destroyed.next();
    this.destroyed.complete();
  }

  private _loadProject(projectUuid: string): void {
    this.isProjectsLoading$
      .pipe(takeWhile(isLoading => isLoading === false && projectUuid !== undefined))
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.project = this._store.selectSnapshot(ProjectsSelectors.currentProject);
          const projectIri = this._projectService.uuidToIri(projectUuid);
          if (!this.project || this.project.id !== projectIri) {
            // get current project data, project members and project groups
            // and set the project state here
            this._actions$
              .pipe(ofActionSuccessful(LoadProjectsAction))
              .pipe(take(1))
              .subscribe(() => this.setProjectData());
            this._store.dispatch([new LoadProjectsAction()]);
          } else {
            this._store.dispatch(new LoadProjectOntologiesAction(projectUuid));
          }
        },
      });
  }

  private _loadMembership(projectUuid): void {
    this.isMembershipLoading$
      .pipe(takeWhile(isMembershipLoading => isMembershipLoading === false && projectUuid !== undefined))
      .pipe(take(1))
      .subscribe({
        next: () => {
          const projectIri = this._projectService.uuidToIri(projectUuid);
          const projectMembers = this._store.selectSnapshot(ProjectsSelectors.projectMembers)[projectIri];
          if (!projectMembers) {
            this._store.dispatch(new LoadProjectMembershipAction(projectUuid));
          }
        },
      });
  }

  private setProjectData(): void {
    this.project = this._store.selectSnapshot(ProjectsSelectors.currentProject);
    if (!this.project) {
      return;
    }

    this._titleService.setTitle(this.project.shortname);
    this._store.dispatch(new LoadProjectOntologiesAction(this.project.id));
  }

  protected static navigationEndFilter(event: Observable<any>) {
    return event.pipe(
      filter(e => e instanceof NavigationEnd),
      filter(e => !(e as NavigationEnd).url.startsWith('api'))
    );
  }
}
