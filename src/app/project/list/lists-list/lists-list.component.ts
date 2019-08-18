import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Session } from '@knora/authentication';
import { ApiServiceError, ListNode, ListsService, Project, ProjectsService } from '@knora/core';
import { CacheService } from 'src/app/main/cache/cache.service';
import { DialogComponent } from 'src/app/main/dialog/dialog.component';

@Component({
    selector: 'app-lists-list',
    templateUrl: './lists-list.component.html',
    styleUrls: ['./lists-list.component.scss']
})
export class ListsListComponent implements OnInit {

    loading: boolean;
    // permissions of logged-in user
    session: Session;
    sysAdmin: boolean = false;
    projectAdmin: boolean = false;

    // list of lists: depending on the parent
    @Input() list: ListNode[];

    // in case of modification
    @Output() refreshParent: EventEmitter<any> = new EventEmitter<any>();

    // i18n plural mapping
    itemPluralMapping = {
        title: {
            '=1': '1 List',
            other: '# Lists'
        }
    };

    //
    // sort properties
    sortProps: any = [
        {
            key: 'label',
            label: 'Name'
        },
        {
            key: 'comment',
            label: 'Description'
        }
    ];

    // ... and sort by 'label'
    // TODO: doesn't work with StringLiteral.... fix it
    sortBy: string = 'label';

    // project shortcode; as identifier in project cache service
    projectcode: string;

    // project data
    project: Project;

    constructor (
        private _cache: CacheService,
        private _dialog: MatDialog,
        private _projectsService: ProjectsService,
        private _listsService: ListsService,
        private _route: ActivatedRoute,
        private _router: Router
    ) {
        // get the shortcode of the current project
        if (this._route.parent.paramMap) {
            this._route.parent.paramMap.subscribe((params: Params) => {
                this.projectcode = params.get('shortcode');
            });
        }
    }


    ngOnInit() {

        // get information about the logged-in user
        this.session = JSON.parse(localStorage.getItem('session'));

        // is the logged-in user system admin?
        this.sysAdmin = this.session.user.sysAdmin;

        // default value for projectAdmin
        this.projectAdmin = this.sysAdmin;

        if (this.projectcode) {

            // set the cache
            this._cache.get(this.projectcode, this._projectsService.getProjectByShortcode(this.projectcode));

            // get project information
            this._cache.get(this.projectcode, this._projectsService.getProjectByShortcode(this.projectcode))
                .subscribe(
                    (result: Project) => {
                        this.project = result;
                        // is logged-in user projectAdmin?
                        this.projectAdmin = this.sysAdmin ? this.sysAdmin : this.session.user.projectAdmin.some(e => e === this.project.id);

                    },
                    (error: ApiServiceError) => {
                        console.error(error);
                    }
                );
        }

        // manual wysiwyg test for list-items-form
        /*
        const testList: string = 'http://rdfh.ch/lists/0011/HTNxizIESTq0zecCOZe2Mw'; // 'http://rdfh.ch/lists/0011/KCu5AjF5RV6z9E3fDKXcJA'; // 'http://rdfh.ch/lists/00FF/73d0ec0302';
        setTimeout(() => {
            this.openDialog('editListItems', 'TEST', testList);
        }, 50);
        */
    }

    /**
    * open dialog in every case of modification:
    * edit list data, remove list from project etc.
    *
    */
    openDialog(mode: string, name: string, iri?: string): void {
        const dialogConfig: MatDialogConfig = {
            width: '560px',
            position: {
                top: '112px'
            },
            data: { mode: mode, title: name, id: iri, project: this.projectcode }
        };

        const dialogRef = this._dialog.open(
            DialogComponent,
            dialogConfig
        );

        dialogRef.afterClosed().subscribe(result => {
            // update the view
            this.refreshParent.emit();
        });
    }

    disableMenu(): boolean {

        // disable menu in case of:
        // project.status = false
        if (this.project && this.project.status === false) {
            return true;
        } else {
            return (!this.sysAdmin && !this.projectAdmin);
        }
    }

}
