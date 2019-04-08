import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { Project } from '@knora/core';
import { MatDialogConfig, MatDialog } from '@angular/material';
import { MaterialDialogComponent } from '../../../main/dialog/material-dialog/material-dialog.component';

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
    @Input() list: Project[];
    @Input() title: string;
    @Input() disabled?: boolean;

    @Output() refreshParent: EventEmitter<any> = new EventEmitter<any>();

    /**
     * If system is true: show the list of all projects
     * Otherwise only the projects where the user is member of
     */
    @Input() system?: boolean = false;

    /*
    list: { [type: string]: Project[] } = {
        ['active']: [],
        ['archived']: []
    };
    */

    // i18n setup
    itemPluralMapping = {
        project: {
            '=1': 'Project',
            other: 'Projects'
        }
    };

    // sort properties
    sortProps: any = [
        {
            key: 'shortcode',
            label: 'Short code'
        },
        {
            key: 'shortname',
            label: 'Short name'
        },
        {
            key: 'longname',
            label: 'Project name'
        }
    ];

    // ... and sort by 'email'
    sortBy: string = 'shortname';

    constructor(private _router: Router, private _dialog: MatDialog) {}

    ngOnInit() {
        console.log(this.list);
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
                this._router
                    .navigateByUrl('/refresh', { skipLocationChange: true })
                    .then(() =>
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
