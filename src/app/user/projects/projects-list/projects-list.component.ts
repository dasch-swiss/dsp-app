import { Component, Input, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { ApiServiceError, Project, ProjectsService, Session, User, UsersService } from '@knora/core';
import { CacheService } from '../../../main/cache/cache.service';

@Component({
    selector: 'app-projects-list',
    templateUrl: './projects-list.component.html',
    styleUrls: ['./projects-list.component.scss']
})
export class ProjectsListComponent implements OnInit {

    loading: boolean = true;

    /**
     * List of projects
     */
    @Input() projects: Project[];

    /**
     * Is the list public and not the list of a logged-in user?
     * Then the "Create new Project"-button is disabled
     */
    @Input() private?: boolean = false;

    list: { [type: string]: Project[] } = {
        ['active']: [],
        ['archived']: []
    };

    // i18n setup
    itemPluralMapping = {
        'project': {
            '=1': 'Project',
            'other': 'Projects'
        }
    };

    constructor(private _router: Router) {

    }

    ngOnInit() {

        this.loading = true;

        for (const item of this.projects) {

            if (item.status === true) {
                this.list['active'].push(item);

            } else {
                this.list['archived'].push(item);
            }

        }
        this.loading = false;

    }


    /**
     *
     * @param id    project id
     * @param key   key is the type of the list: 'active', 'inactive'
     */
    setProject(id: string, key: string) {
        // get project by id
        // by searching in the list of projects
        // instead of an additional api request
        this.list[key].filter(project => {

            if (project.id === id) {

                this._router.navigateByUrl('/refresh', {skipLocationChange: true}).then(() =>
                    this._router.navigate(['/project/' + project.shortcode])
                );

                // this._router.navigate(['/project/' + project.shortname + '/dashboard']);

                // location.reload(true);
            }
        });
    }

    createProject() {
        this._router.navigate(['/project/new'], {
            queryParams: {
                returnUrl: this._router.url
            }
        });
    }
}
