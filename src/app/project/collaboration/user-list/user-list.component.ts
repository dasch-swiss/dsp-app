import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiServiceError, Project, ProjectsService, User, UsersService } from '@knora/core';
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

    projectRole = new FormControl();
    permissionGroups: string[] = ['Admin'];

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

    getProjectRoles() {

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
     * @param id user iri
     */
    setPermissionUser(id: string) {

    }

}
