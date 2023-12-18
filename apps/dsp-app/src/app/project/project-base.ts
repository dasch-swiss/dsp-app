import { ChangeDetectorRef, Directive, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { ReadProject, ReadUser } from '@dasch-swiss/dsp-js';
import { LoadProjectAction, LoadProjectOntologiesAction, OntologiesSelectors, ProjectsSelectors, UserSelectors } from '@dasch-swiss/vre/shared/app-state';
import { Actions, Select, Store, ofActionSuccessful } from '@ngxs/store';
import { Observable, Subject, combineLatest } from 'rxjs';
import { filter, map, take, takeUntil, takeWhile } from 'rxjs/operators';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { Title } from '@angular/platform-browser';

@Directive()
export class ProjectBase implements OnInit, OnDestroy {
    destroyed: Subject<void> = new Subject<void>();

    projectUuid: string;
    project: ReadProject; //TODO use project$ instead

    // permissions of logged-in user
    get isAdmin$(): Observable<boolean> {
        return combineLatest([this.user$.pipe(filter(user => user !== null)), this.userProjectAdminGroups$, this._route.params, this._route.parent.params])
            .pipe(
                takeUntil(this.destroyed),
                map(([user, userProjectGroups, params, parentParams]) => {
                    const projectIri = this._projectService.uuidToIri(params.uuid ? params.uuid : parentParams.uuid);
                    return ProjectService.IsProjectAdminOrSysAdmin(user, userProjectGroups, projectIri);
                })
            )
    }

    get projectIri() {
        return this._projectService.uuidToIri(this.projectUuid);
    }

    @Select(UserSelectors.user) user$: Observable<ReadUser>;
    @Select(UserSelectors.userProjectAdminGroups) userProjectAdminGroups$: Observable<string[]>;
    @Select(ProjectsSelectors.isCurrentProjectAdmin) isProjectAdmin$: Observable<boolean>;
    @Select(ProjectsSelectors.isCurrentProjectMember) isProjectMember$: Observable<boolean>;
    @Select(ProjectsSelectors.currentProject) project$: Observable<ReadProject>;
    @Select(ProjectsSelectors.isProjectsLoading) isProjectsLoading$: Observable<boolean>;

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
        this.project = this._store.selectSnapshot(ProjectsSelectors.currentProject);
        if (this.projectUuid && (!this.project || this.project.id !== this.projectIri)) {
            // get current project data, project members and project groups
            // and set the project state here
            this.loadProject();
        } else {
            if (!this.isOntologiesAvailable()) {
                this.isProjectsLoading$
                    .pipe(takeWhile((isLoading) => isLoading === false))
                    .subscribe((isLoading: boolean) => {
                        this._store.dispatch(new LoadProjectOntologiesAction(this.projectUuid));
                    });
            }
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
        this._store.dispatch(new LoadProjectAction(this.projectUuid, true));
        this._actions$.pipe(ofActionSuccessful(LoadProjectAction))
            .pipe(take(1))
            .subscribe(() => this.setProjectData());
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
            filter((e) => e instanceof NavigationEnd),
            filter((e) => !(e as NavigationEnd).url.startsWith('api'))
        );
    }

    private isOntologiesAvailable(): boolean {
        const currentProjectOntologies = this._store.selectSnapshot(OntologiesSelectors.currentProjectOntologies);
        let result = true;

        this.project.ontologies.forEach((ontoIri) => {
            if (!currentProjectOntologies
                || currentProjectOntologies.length === 0
                || !currentProjectOntologies.find((o) => o.id === ontoIri)
            ) {
                result = false;
            }
        });

        return result;
    }
}
