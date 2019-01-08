import { Component, Input, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { ApiServiceError, Project, ProjectsService, Session, User, UsersService } from '@knora/core';
import { CacheService } from '../../../main/cache/cache.service';

@Component({
    selector: 'app-project-list',
    templateUrl: './project-list.component.html',
    styleUrls: ['./project-list.component.scss']
})
export class ProjectListComponent implements OnInit {

    /**
     * List of projects
     */
    @Input() list: Project[];

    /**
     * This could be 'active' or 'archived'
     * or something similar to project type;
     * This info will be used in the component header
     */
    @Input() type: string;

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

    }



    /**
     *
     * @param id
     */
    setProject(id: string) {
        // get project by id
        // by searching in the list of projects
        // instead of an additional api request
        this.list.filter(project => {

            if (project.id === id) {

                this._router.navigateByUrl('/refresh', {skipLocationChange: true}).then(() =>
                    this._router.navigate(['/project/' + project.shortcode])
                );

                // this._router.navigate(['/project/' + project.shortname + '/dashboard']);

                // location.reload(true);
            }
        });
    }
}
