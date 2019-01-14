import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiServiceError, KnoraConstants, Project, ProjectsService, User, UsersService } from '@knora/core';
import { CacheService } from '../../../main/cache/cache.service';

@Component({
    selector: 'app-user-list',
    templateUrl: './user-list.component.html',
    styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {

    loading: boolean;

    @Input() list: User[];
    @Input() disabled?: boolean;

    @Output() userUpdate: EventEmitter<any> = new EventEmitter<any>();

    projectcode: string;

    project: Project;

    sortProps: any = [
        {
            key: 'familyName',
            label: 'Last name'
        },
        {
            key: 'givenName',
            label: 'First name'
        },
        {
            key: 'email',
            label: 'E-mail'
        },
        {
            key: 'username',
            label: 'Username'
        }
    ];

    sortBy: string = 'email';

    constructor(private _cache: CacheService,
                private _projectsService: ProjectsService,
                private _usersService: UsersService,
                private _route: ActivatedRoute
    ) {

        // get the shortcode of the current project
        this.projectcode = this._route.parent.snapshot.params.shortcode;

    }

    ngOnInit() {

        this.loading = true;

        // get project data from cache
        this._cache.get(this.projectcode, this._projectsService.getProjectByShortcode(this.projectcode)).subscribe(
            (response: any) => {
                this.project = response;
            },
            (error: ApiServiceError) => {
                console.error(error);
            }
        );

        this.loading = false;
    }

    /**
     * remove user from project
     * @param id user iri
     */
    removeUser(id: string) {

        this._usersService.removeUserFromProject(id, this.project.id).subscribe(
            (result: User) => {
                this.userUpdate.emit();
            },
            (error: ApiServiceError) => {
                // this.errorMessage = error;
                console.error(error);
            }
        );
    }

    /**
     * set user's permission in this project
     * @param user User object
     * @param groups List of selected groups Iris
     */
    setPermission(user: User, groups: string[]) {

        // TODO: write update permission method instead of add and remove!
        if (groups.indexOf(KnoraConstants.ProjectAdminGroupIRI) > -1 ) {
            this._usersService.addUserToProjectAdmin(user.id, this.project.id).subscribe(
                (result: User) => {
                    // console.log(result);
                },
                (error: ApiServiceError) => {
                    console.error(error);
                }
            );
        } else {
            this._usersService.removeUserFromProjectAdmin(user.id, this.project.id).subscribe(
                (result: User) => {
                    // console.log(result);
                },
                (error: ApiServiceError) => {
                    console.error(error);
                }
            );
        }
        // TODO: update the @knora/core usersService with the following methods: addUserToGroup, removeUserFromGroup
    }

}
