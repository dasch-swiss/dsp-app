import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import {
    ApiServiceError,
    GroupsService,
    Project,
    ProjectsService
} from '@knora/core';
import { CacheService } from '../main/cache/cache.service';
import { MenuItem } from '../main/declarations/menu-item';
import { AppGlobal } from '../app-global';
import { Session } from '@knora/authentication';

@Component({
    selector: 'app-project',
    templateUrl: './project.component.html',
    styleUrls: ['./project.component.scss']
})
export class ProjectComponent implements OnInit {
    loading: boolean;
    error: boolean;

    projectcode: string;

    project: Project;

    loggedInAdmin: boolean = false;

    // for the sidenav
    open: boolean = true;

    navigation: MenuItem[] = AppGlobal.projectNav;

    constructor(
        private _cache: CacheService,
        private _route: ActivatedRoute,
        private _projectsService: ProjectsService,
        private _groupsService: GroupsService,
        private _titleService: Title
    ) {
        // get the shortcode of the current project
        this.projectcode = this._route.snapshot.params.shortcode;

        // set the page title
        this._titleService.setTitle('Project ' + this.projectcode);

        this.error = this.validateShortcode(this.projectcode);
    }

    ngOnInit() {
        if (!this.error) {
            this.loading = true;
            // set the cache here:
            // current project data, project members and project groups
            this._cache.get(
                this.projectcode,
                this._projectsService.getProjectByShortcode(this.projectcode)
            );

            // get the data from cache
            this._cache
                .get(
                    this.projectcode,
                    this._projectsService.getProjectByShortcode(
                        this.projectcode
                    )
                )
                .subscribe(
                    (result: any) => {
                        this.project = result;
                        this.navigation[0].label =
                            'Project: ' + result.shortname.toUpperCase();

                        // is the logged-in user a project admin?
                        const session: Session = JSON.parse(
                            localStorage.getItem('session')
                        );
                        this.loggedInAdmin = session.user.projectAdmin.some(
                            e => e === result.id
                        );

                        if (this.loggedInAdmin) {
                            this._cache.get(
                                'members_of_' + this.projectcode,
                                this._projectsService.getProjectMembersByShortcode(
                                    this.projectcode
                                )
                            );
                            this._cache.get(
                                'groups_of_' + this.projectcode,
                                this._groupsService.getAllGroups()
                            );
                        }

                        this.loading = false;
                    },
                    (error: ApiServiceError) => {
                        console.error(error);
                        this.error = true;
                        this.loading = false;
                    }
                );
        } else {
            // shortcode isn't valid
            // TODO: show an error page
        }
    }

    /**
     * Checks if the shortcode is valid: hexadecimal and length = 4
     *
     * @param code project shortcode which is a parameter in the route
     */
    validateShortcode(code: string) {
        const regexp: any = /^[0-9A-Fa-f]+$/;

        return !(regexp.test(code) && code.length === 4);
    }
}
