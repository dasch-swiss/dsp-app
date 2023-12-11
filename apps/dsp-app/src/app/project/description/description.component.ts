import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {
    ReadProject, ReadUser} from '@dasch-swiss/dsp-js';
import { Observable, combineLatest, of } from 'rxjs';
import { Select, Store } from '@ngxs/store';
import { map, take } from 'rxjs/operators';
import { ProjectsSelectors, UserSelectors } from '@dasch-swiss/vre/shared/app-state';
import {RouteConstants} from "@dasch-swiss/vre/shared/app-config";
import { StringLiteral } from '@dasch-swiss/dsp-js/src/models/admin/string-literal';
import { AppGlobal } from '@dsp-app/src/app/app-global';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'app-description',
    templateUrl: './description.component.html',
    styleUrls: ['./description.component.scss'],
})
export class DescriptionComponent {
    // project uuid coming from the route
    projectUuid: string;

    get readProject$(): Observable<ReadProject> {
        if (!this.projectUuid) {
            return of({} as ReadProject);
        }

        return this.readProjects$.pipe(
            take(1),
            map(projects => this.getCurrentProject(projects))
        );
    }

    get userHasPermission$(): Observable<boolean> {
        return combineLatest([
            this.user$,
            this.readProject$,
            this.store.select(UserSelectors.userProjectAdminGroups)
        ]).pipe(
            map(([user, readProject, userProjectGroups]: [ReadUser, ReadProject, string[]]) => {
                if (readProject == null) {
                    return false;
                }

                return this.projectService.isProjectAdminOrSysAdmin(user, userProjectGroups, readProject.id);
            })
        );
    }

    @Select(UserSelectors.user) user$: Observable<ReadUser>;
    @Select(ProjectsSelectors.readProjects) readProjects$: Observable<ReadProject[]>;
    @Select(ProjectsSelectors.isProjectsLoading) isProjectsLoading$: Observable<boolean>;

    constructor(
        private _route: ActivatedRoute,
        private _router: Router,
        private store: Store,
        private projectService: ProjectService,
    ) {
        // get the uuid of the current project
        this._route.parent.paramMap.subscribe((params: Params) => {
            this.projectUuid = params.get('uuid');
        });
    }

    editProject() {
        this._router.navigate([RouteConstants.project, this.projectUuid, RouteConstants.edit]);
    }

    trackByFn = (index: number, item: string) => `${index}-${item}`;

    trackByStringLiteralFn = (index: number, item: StringLiteral) => `${index}-${item.value}`;

    // returns the descriptions sorted by language
    private sortDescriptionsByLanguage(descriptions: StringLiteral[]): StringLiteral[] {
        const languageOrder = AppGlobal.languagesList.map((l) => l.language);

        return descriptions.sort((a, b) => {
            const indexA = languageOrder.indexOf(a.language);
            const indexB = languageOrder.indexOf(b.language);

            return indexA - indexB;
        });
    }

    private getCurrentProject(projects: ReadProject[]): ReadProject {
        if (!projects) {
            return null;
        }

        const project = projects.find(x => x.id.split('/').pop() === this.projectUuid);
        return project ? this.projectWithSortedDescriptions(project) : null;
    }

    // returns the project with the descriptions sorted by language
    private projectWithSortedDescriptions(project: ReadProject): ReadProject  {
        if (project.description && project.description.length > 1) {
            // sort the descriptions by language
            project.description = this.sortDescriptionsByLanguage(project.description);
        }
        return project;
    }
}
