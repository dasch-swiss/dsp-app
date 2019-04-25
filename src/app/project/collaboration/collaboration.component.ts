import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Params } from '@angular/router';
import { ApiServiceError, Project, ProjectsService, User } from '@knora/core';
import { CacheService } from '../../main/cache/cache.service';
import { AddUserComponent } from './add-user/add-user.component';
import { Session } from '@knora/authentication';

@Component({
    selector: 'app-collaboration',
    templateUrl: './collaboration.component.html',
    styleUrls: ['./collaboration.component.scss']
})
export class CollaborationComponent implements OnInit {

    // loading for progess indicator
    loading: boolean;

    // permissions of logged-in user
    session: Session;
    sysAdmin: boolean = false;
    projectAdmin: boolean = false;

    // project shortcode; as identifier in project cache service
    projectcode: string;

    // project data
    project: Project;

    // project members
    projectMembers: User[] = [];

    // two lists of project members:
    // list of active users
    active: User[] = [];
    // list of inactive (deleted) users
    inactive: User[] = [];

    @ViewChild('addUserComponent') addUser: AddUserComponent;

    constructor(private _cache: CacheService,
                private _projectsService: ProjectsService,
                private _route: ActivatedRoute,
                private _titleService: Title) {

        // get the shortcode of the current project
        this._route.parent.paramMap.subscribe((params: Params) => {
            this.projectcode = params.get('shortcode');
        });

//        this.projectcode = this._route.parent.snapshot.params.shortcode;

        // set the page title
        this._titleService.setTitle('Project ' + this.projectcode + ' | Collaboration');

        // go back to project page, if the logged-in user has no admin rights
        // is the logged-in user a project admin?
        /*
        const session: Session = JSON.parse(
            localStorage.getItem('session')
        );
        this.loggedInAdmin = session.user.projectAdmin.some(
            e => e === result.id
        );
        */

    }

    ngOnInit() {
        this.loading = true;

        // get information about the logged-in user
        this.session = JSON.parse(localStorage.getItem('session'));
        // is the logged-in user system admin?
        this.sysAdmin = this.session.user.sysAdmin;

        // default value for projectAdmin
        this.projectAdmin = this.sysAdmin;

        // set the cache
        this._cache.get(this.projectcode, this._projectsService.getProjectByShortcode(this.projectcode));

        // get the project data from cache
        this._cache
                .get(
                    this.projectcode,
                    this._projectsService.getProjectByShortcode(
                        this.projectcode
                    )
                )
                .subscribe(
                    (result: Project) => {
                        this.project = result;

                        // is logged-in user projectAdmin?
                        this.projectAdmin = this.sysAdmin
                            ? this.sysAdmin
                            : this.session.user.projectAdmin.some(e => e === this.project.id);

                        // get from cache: list of project members and groups
                        if (this.projectAdmin) {
                            this.refresh();
                        }

                        this.loading = false;
                    },
                    (error: ApiServiceError) => {
                        console.error(error);
                        this.loading = false;
                    }
                );
    }

    /**
     * build the list of members
     */
    initList(): void {
        this._cache.get('members_of_' + this.projectcode, this._projectsService.getProjectMembersByShortcode(this.projectcode));

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

        this.initList();

        // refresh child component: add user
        if (this.addUser) {
            this.addUser.buildForm();
        }
    }

}
