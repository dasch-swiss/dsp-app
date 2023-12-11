import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {
    ReadProject,
    ReadUser,
} from '@dasch-swiss/dsp-js';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { AddUserComponent } from './add-user/add-user.component';
import { Actions, Select, Store, ofActionSuccessful } from '@ngxs/store';
import { CurrentProjectSelectors, LoadProjectMembersAction, ProjectsSelectors, UserSelectors } from '@dasch-swiss/vre/shared/app-state';
import { Observable, Subject } from 'rxjs';
import { map, take, takeUntil } from 'rxjs/operators';
import { ProjectBase } from '../project-base';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'app-collaboration',
    templateUrl: './collaboration.component.html',
    styleUrls: ['./collaboration.component.scss'],
})
export class CollaborationComponent extends ProjectBase implements OnInit, OnDestroy {
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    @ViewChild('addUserComponent') addUser: AddUserComponent;

    get activeProjectMembers$(): Observable<ReadUser[]> {
        return this.projectMembers$
            .pipe(
                takeUntil(this.ngUnsubscribe),
                map((projectMembers) => {
                    if (!projectMembers[this.projectIri]) {
                        return [];
                    }

                    return projectMembers[this.projectIri].value.filter(member => member.status === true);
                })
            );
    }

    get inactiveProjectMembers$(): Observable<ReadUser[]> {
        return this.projectMembers$
            .pipe(
                takeUntil(this.ngUnsubscribe),
                map((projectMembers) => {
                    if (!projectMembers[this.projectIri]) {
                        return [];
                    }

                    return projectMembers[this.projectIri].value.filter(member => !member.status);
                })
            );
    }

    @Select(ProjectsSelectors.projectMembers) projectMembers$: Observable<ReadUser[]>;
    @Select(ProjectsSelectors.isProjectsLoading) isProjectsLoading$: Observable<boolean>;
    @Select(UserSelectors.isSysAdmin) isSysAdmin$: Observable<boolean>;
    @Select(UserSelectors.user) user$: Observable<ReadUser>;
    @Select(CurrentProjectSelectors.project) project$: Observable<ReadProject>;

    constructor(
        protected _route: ActivatedRoute,
        protected _projectService: ProjectService,
        protected _titleService: Title,
        protected _store: Store,
        protected _cd: ChangeDetectorRef,
        protected _actions$: Actions,
        protected _router: Router,
    ) {
        super(_store, _route, _projectService, _titleService, _router, _cd, _actions$);
        // get the uuid of the current project
        if (this._route.parent.parent.snapshot.url.length) {
            this._route.parent.parent.paramMap.subscribe((params: Params) => {
                this.projectUuid = params.get('uuid');
            });
        }
    }

    ngOnInit() {
        super.ngOnInit();
        const project = this._store.selectSnapshot(CurrentProjectSelectors.project) as ReadProject;
        this._titleService.setTitle(`Project ${project?.shortname} | Collaboration`);
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    /**
     * refresh list of members after adding a new user to the team
     */
    refresh(): void {
        this._store.dispatch(new LoadProjectMembersAction(this.projectUuid));

        // refresh child component: add user
        if (this.addUser) {
            this.addUser.buildForm();
        }
    }
}
