import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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

    @Output() userRemoved: EventEmitter<any> = new EventEmitter<any>();

    projectcode: string;

    project: Project;
    itemPluralMapping = {
        'member': {
            // '=0': '0 Members',
            '=1': '1 Member',
            'other': '# Members'
        }
    };

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
        }
    ];

    projectRole = new FormControl();
    permissionGroups: string[] = ['Admin'];

    constructor(private _cache: CacheService,
                private _projectsService: ProjectsService,
                private _usersService: UsersService,
                private _route: ActivatedRoute,
                private _router: Router) {

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

    removeUser(id: string) {

        this._usersService.removeUserFromProject(id, this.project.id).subscribe(
            (result: User) => {
                this.userRemoved.emit();
            },
            (error: ApiServiceError) => {
                // this.errorMessage = error;
                console.error(error);
            }
        );

    }

}
