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

    // does the list contain archived objects?
    @Input() archived: boolean = false;

    // update parent (and so this list) in case of modifying an object in the list
    @Output() refreshParent: EventEmitter<any> = new EventEmitter<any>();

    // logged-in user permissions
    @Input() sysAdmin?: boolean = false;

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

    // ... and sort by 'shortname'
    sortBy: string = 'shortname';

    constructor(
        private _router: Router,
        private _dialog: MatDialog) {}

    ngOnInit() {

    }

    gotoProjectBoard(code: string) {
        this._router.navigateByUrl('/refresh', { skipLocationChange: true }).then(
            () => this._router.navigate(['/project/' + code])
        );
    }


    openDialog(mode: string, name: string): void {
        const dialogConfig: MatDialogConfig = {
            width: '560px',
            position: {
                top: '112px'
            },
            data: { name: name, mode: mode }
        };

        const dialogRef = this._dialog.open(MaterialDialogComponent, dialogConfig);

        dialogRef.afterClosed().subscribe(result => {
            // update the view
            this.refreshParent.emit();
        });
    }
}
