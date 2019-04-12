import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { Project, User, ProjectsService, ApiServiceError } from '@knora/core';
import { MatDialogConfig, MatDialog } from '@angular/material';
import { DialogComponent } from '../../../main/dialog/dialog.component';
import { Session } from '@knora/authentication';
import { CacheService } from 'src/app/main/cache/cache.service';

@Component({
    selector: 'app-projects-list',
    templateUrl: './projects-list.component.html',
    styleUrls: ['./projects-list.component.scss']
})
export class ProjectsListComponent implements OnInit {
    // loading for progess indicator
    loading: boolean;

    // permissions of logged-in user
    session: Session;
    sysAdmin: boolean = false;
    projectAdmin: boolean = false;

    // list of users: status active or inactive (deleted)
    @Input() status: boolean;

    // list of users: depending on the parent
    @Input() list: User[];

    // in case of modification
    @Output() refreshParent: EventEmitter<any> = new EventEmitter<any>();

    // i18n plural mapping
    itemPluralMapping = {
        title: {
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

    // ... and sort by 'shortname'
    sortBy: string = 'shortname';

    constructor(
        private _cache: CacheService,
        private _dialog: MatDialog,
        private _projectsService: ProjectsService,
        private _router: Router) {}

    ngOnInit() {
        // get information about the logged-in user
        this.session = JSON.parse(localStorage.getItem('session'));

        // is the logged-in user system admin?
        this.sysAdmin = this.session.user.sysAdmin;
    }

    /**
     * returns true, when the user is project admin;
     * when the parameter permissions is not set,
     * it returns the value for the logged-in user
     *
     *
     * @param  id project iri
     * @returns boolean
     */
    userIsProjectAdmin(id: string): boolean {
        // check if the logged-in user is project admin
        return this.session.user.projectAdmin.some(e => e === id);
    }

    gotoProjectBoard(code: string) {
        this._router.navigateByUrl('/refresh', { skipLocationChange: true }).then(
            () => this._router.navigate(['/project/' + code])
        );
    }


    openDialog(mode: string, name: string, id?: string): void {
        const dialogConfig: MatDialogConfig = {
            width: '560px',
            position: {
                top: '112px'
            },
            data: { name: name, mode: mode, project: id }
        };

        const dialogRef = this._dialog.open(DialogComponent, dialogConfig);

        dialogRef.afterClosed().subscribe(result => {
            if (result === true) {
                // get the mode
                switch (mode) {
                    case 'deleteProject':
                        this.deleteProject(id);
                    break;

                    case 'activateProject':
                        this.activateProject(id);
                    break;
                }
            } else {
                // update the view
                this.refreshParent.emit();
            }
        });
    }

    deleteProject(id: string) {
        this._projectsService.deleteProject(id).subscribe(
            (result: Project) => {
                this.refreshParent.emit();
            },
            (error: ApiServiceError) => {
                // this.errorMessage = error;
                console.error(error);
            }
        );
    }

    activateProject(id: string) {
        this._projectsService.activateProject(id).subscribe(
            (result: Project) => {
                this.refreshParent.emit();
            },
            (error: ApiServiceError) => {
                // this.errorMessage = error;
                console.error(error);
            }
        );
    }
}
