import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { ApiServiceError, Project, ProjectsService, User } from '@knora/core';
import { CacheService } from '../../main/cache/cache.service';

@Component({
    selector: 'app-collaboration',
    templateUrl: './collaboration.component.html',
    styleUrls: ['./collaboration.component.scss']
})
export class CollaborationComponent implements OnInit {

    loading: boolean;

    projectcode: string;

    project: Project;

    projectMembers: User[] = [];

    // list of active users
    active: User[] = [];
    // list of inactive (deleted) users
    inactive: User[] = [];


    constructor(private _cache: CacheService,
                private _projectsService: ProjectsService,
                private _route: ActivatedRoute,
                private _titleService: Title) {

        // get the shortcode of the current project
        this.projectcode = this._route.parent.snapshot.params.shortcode;

        // set the page title
        this._titleService.setTitle('Project ' + this.projectcode + ' | Collaboration');

    }

    ngOnInit() {
        this.loading = true;

        this._cache.get(this.projectcode, this._projectsService.getProjectByShortcode(this.projectcode)).subscribe(
            (result: any) => {
                this.project = result;
                this.loading = false;
            },
            (error: ApiServiceError) => {
                console.error(error);
                this.loading = false;
            }
        );

        this.initList();
    }

    /**
     * build the list of members
     */
    initList(): void {
        this._cache.get('members_of_' + this.projectcode, this._projectsService.getProjectMembersByShortcode(this.projectcode)).subscribe(
            (response: any) => {
                this.projectMembers = response;

                // clean up list of users
                this.active = [];
                this.inactive = [];

                for (const u of this.projectMembers) {

                    if (u.status === true) {
                        this.active.push(u);
                    } else {
                        this.inactive.push(u);
                    }

                }

                this.loading = false;
            },
            (error: any) => {
                console.error(error);
            }
        );
    }

    /**
     * refresh list of members after adding a new user to the team
     */
    refresh(): void {
        // referesh the component
        this.loading = true;
        // update the cache
        this._cache.del('members_of_' + this.projectcode);
        this._cache.get('members_of_' + this.projectcode, this._projectsService.getProjectMembersByShortcode(this.projectcode));
        this.initList();
    }

}
