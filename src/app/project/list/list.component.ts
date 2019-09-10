import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Params } from '@angular/router';
import { Session } from '@knora/authentication';
import { ApiServiceError, ListNode, ListsService, Project, ProjectsService } from '@knora/core';
import { CacheService } from 'src/app/main/cache/cache.service';
import { MatDialog, MatDialogConfig } from '@angular/material';
import { DialogComponent } from 'src/app/main/dialog/dialog.component';

@Component({
    selector: 'app-list',
    templateUrl: './list.component.html',
    styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnInit {

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

    projectLists: ListNode[] = [];

    // i18n plural mapping
    itemPluralMapping = {
        title: {
            '=1': '1 List',
            other: '# Lists'
        }
    };

    constructor (
        private _dialog: MatDialog,
        private _cache: CacheService,
        private _listsService: ListsService,
        private _projectsService: ProjectsService,
        private _route: ActivatedRoute,
        private _titleService: Title) {

        // get the shortcode of the current project
        this._route.parent.paramMap.subscribe((params: Params) => {
            this.projectcode = params.get('shortcode');
        });

        //        this.projectcode = this._route.parent.snapshot.params.shortcode;

        // set the page title
        this._titleService.setTitle('Project ' + this.projectcode + ' | Lists');
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
        this._cache.get(this.projectcode, this._projectsService.getProjectByShortcode(this.projectcode)).subscribe(
            (result: Project) => {
                this.project = result;

                // is logged-in user projectAdmin?
                this.projectAdmin = this.sysAdmin ? this.sysAdmin : this.session.user.projectAdmin.some(e => e === this.project.id);

                this.initList();

                // get from cache: list of project members and groups
                if (this.projectAdmin) {
                    // this.refresh();
                }

                this.loading = false;
            },
            (error: ApiServiceError) => {
                console.error(error);
                this.loading = false;
            }
        );

        this.openDialog('createList', 'List');
    }

    /**
     * build the list of lists
     */
    initList(): void {
        this._listsService.getLists(this.project.id).subscribe(
            (response: ListNode[]) => {
                this.projectLists = response;

                /*
                for (const list of response) {
                    // console.log(list.id);
                    this._listsService.getList(list.id).subscribe(
                        (info: List) => {
                            // TODO: we should set the cache for each list
                            // is it hierarchical list?
                            /*
                            for (const child of info.children) {
                                if (child.children.length > 0) {

                                    console.log('hierarchical list');

                                }
                            }
                            *
                        },
                        (error: ApiServiceError) => {
                            console.error(error);
                        }
                    );
                }
                */

                this.loading = false;
            },
            (error: any) => {
                console.error(error);
            }
        );

    }

    refresh(): void {
        // referesh the component
        this.loading = true;
        // update the cache
        // this._cache.del('lists_of_' + this.projectcode);

        this.initList();

    }

    /**
    * open dialog in every case of modification:
    * edit list data, remove list from project etc.
    *
    */
    openDialog(mode: string, name: string, iri?: string): void {
        const dialogConfig: MatDialogConfig = {
            width: '840px',
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
            this.refresh();
        });
    }

}
