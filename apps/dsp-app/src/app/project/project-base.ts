import { ChangeDetectorRef, Directive, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { ReadProject, ReadUser } from '@dasch-swiss/dsp-js';
import { CurrentProjectSelectors, LoadProjectAction, LoadProjectOntologiesAction, ProjectsSelectors, UserSelectors } from '@dasch-swiss/vre/shared/app-state';
import { Actions, Select, Store, ofActionSuccessful } from '@ngxs/store';
import { Observable, Subject, combineLatest } from 'rxjs';
import { filter, map, take, takeUntil } from 'rxjs/operators';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { Title } from '@angular/platform-browser';

@Directive()
export class ProjectBase implements OnInit, OnDestroy {
    destroyed: Subject<void> = new Subject<void>();

    projectUuid: string;
    project: ReadProject;

    // permissions of logged-in user
    get isAdmin$(): Observable<boolean> {
        return combineLatest([this.user$, this.userProjectAdminGroups$, this._route.parent.params])
            .pipe(
                takeUntil(this.destroyed),
                map(([user, userProjectGroups, params]) => {
                    return this._projectService.isProjectAdminOrSysAdmin(user, userProjectGroups, params.uuid);
                })
            )
    }

    get projectIri() {
        return this._projectService.uuidToIri(this.projectUuid);
    }
    
    @Select(UserSelectors.user) user$: Observable<ReadUser>;
    @Select(UserSelectors.userProjectAdminGroups) userProjectAdminGroups$: Observable<string[]>;
    @Select(CurrentProjectSelectors.project) project$: Observable<ReadProject>;
    @Select(CurrentProjectSelectors.isProjectAdmin) isProjectAdmin$: Observable<boolean>;
    @Select(CurrentProjectSelectors.isProjectMember) isProjectMember$: Observable<boolean>;

    constructor(
        protected _store: Store,
        protected _route: ActivatedRoute,
        protected _projectService: ProjectService,
        protected _titleService: Title,
        protected _router: Router,
        protected _cd: ChangeDetectorRef,
        protected _actions$: Actions,
    ) {
        // get the uuid of the current project
        this.projectUuid = this._route.snapshot.params.uuid 
            ? this._route.snapshot.params.uuid
            : this._route.parent.snapshot.params.uuid;
    }

    ngOnInit(): void {
        this.project = this._store.selectSnapshot(CurrentProjectSelectors.project);
        if (this.projectUuid && (!this.project || this.project.id !== this.projectIri)) {
            this.loadProject();
        }
    }

    ngOnDestroy(): void {
        //this._store.dispatch([new ClearCurrentProjectAction(), new ClearProjectOntologiesAction(this.projectUuid)]);
        this.destroyed.next();
        this.destroyed.complete();
    }

    protected getCurrentProject(projects: ReadProject[]): ReadProject {
        if (!projects) {
            return null;
        }

        return projects.find(x => x.id.split('/').pop() === this.projectUuid);
    }
    
    private loadProject(): void {
        const isProjectsLoading = this._store.selectSnapshot(ProjectsSelectors.isProjectsLoading);
        // get current project data, project members and project groups
        // and set the project state here
        if (!isProjectsLoading) {
            this._store.dispatch(new LoadProjectAction(this.projectUuid, true));
            this._actions$.pipe(ofActionSuccessful(LoadProjectAction))
                .pipe(take(1))
                .subscribe(() => this.setProjectData());
        }
    }

    private setProjectData(): void {
        this.project = this._store.selectSnapshot(CurrentProjectSelectors.project);
        if (!this.project) {
            return;
        }

        this._titleService.setTitle(this.project.shortname);
        this._store.dispatch(new LoadProjectOntologiesAction(this.project.id));
    }

    protected static navigationEndFilter(event: Observable<any>) {
        return event.pipe(
            filter((e) => e instanceof NavigationEnd),
            filter((e) => !(e as NavigationEnd).url.startsWith('api'))
        );
    }
}
