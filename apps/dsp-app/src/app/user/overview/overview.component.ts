import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import {
    StoredProject,
    ReadUser
} from '@dasch-swiss/dsp-js';
import {RouteConstants} from '@dasch-swiss/vre/shared/app-config';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { LoadProjectsAction, ProjectsSelectors, UserSelectors } from '@dasch-swiss/vre/shared/app-state';

@Component({
    selector: 'app-overview',
    templateUrl: './overview.component.html',
    styleUrls: ['./overview.component.scss'],
})
export class OverviewComponent implements OnInit {

    @Select(UserSelectors.user) user$: Observable<ReadUser>;
    // list of projects a user is a member of
    @Select(UserSelectors.userActiveProjects) userActiveProjects$: Observable<StoredProject>;
    @Select(ProjectsSelectors.otherProjects) userOtherActiveProjects$: Observable<StoredProject>;
    @Select(ProjectsSelectors.allProjects) allProjects$: Observable<StoredProject>;
    @Select(ProjectsSelectors.allActiveProjects) allActiveProjects$: Observable<StoredProject>;
    @Select(ProjectsSelectors.isProjectsLoading) isProjectsLoading$: Observable<boolean>;
    @Select(UserSelectors.isSysAdmin) isSysAdmin$: Observable<boolean>;

    constructor(
        private _titleService: Title,
        private _router: Router,
        private store: Store,
    ) {
        this._titleService.setTitle('Projects Overview');

    }

    ngOnInit() {
        this.store.dispatch(new LoadProjectsAction());
    }

    createNewProject() {
        this._router.navigate([RouteConstants.newProjectRelative]);
    }
}
