import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Params } from '@angular/router';
import { Session } from '@knora/authentication';
import { ApiServiceError, List, ListsService, Project, ProjectsService, ListNodeInfo, ListNode, ListNodeInfoResponse } from '@knora/core';
import { CacheService } from 'src/app/main/cache/cache.service';

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

    projectLists: ListNodeInfo[] = [];


    constructor (
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
        this._cache.get(this.projectcode, this._projectsService.getProjectByShortcode(this.projectcode))
            .subscribe(
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

        /* this._listsService.getLists(this.project.id).subscribe(
            (result: any) => {

                console.log(result);

                for (const list of result) {
                    console.log(list);
                    this._lists.getList(list.id).subscribe(
                        (info: any) => {
                            console.log(info);
                        },
                        (error: ApiServiceError) => {
                            console.error(error);
                        }
                    );
                }
            },
            (error: ApiServiceError) => {
                console.error(error);
            }
        ); */
    }

    /**
     * build the list of lists
     */
    initList(): void {
        this._listsService.getLists().subscribe(
            (response: any) => {
                console.log('all lists', response);
            }

        );
        this._cache.get('lists_of_' + this.projectcode, this._listsService.getLists(this.project.id));

        this._cache.get('lists_of_' + this.projectcode, this._listsService.getLists(this.project.id)).subscribe(
            (response: ListNodeInfo[]) => {
                this.projectLists = response;

                for (const list of response) {
                    console.log(list.id);
                    this._listsService.getList(list.id).subscribe(
                        (info: List) => {
                            // TODO: we should set the cache for each list
                            // is it hierarchical list?
                            for (const child of info.children) {
                                if (child.children.length > 0) {
                                    console.log('hierarchical list');
                                }
                            }
                            console.log(info);
                        },
                        (error: ApiServiceError) => {
                            console.error(error);
                        }
                    );
                }

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

        this.initList();

    }

}
