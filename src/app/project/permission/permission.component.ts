import { Component, OnInit, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Params } from '@angular/router';
import { ReadGroup, ReadProject } from '@knora/api';
import { Session } from '@knora/core';
import { CacheService } from 'src/app/main/cache/cache.service';
import { AddGroupComponent } from './add-group/add-group.component';

@Component({
    selector: 'app-permission',
    templateUrl: './permission.component.html',
    styleUrls: ['./permission.component.scss']
})
export class PermissionComponent implements OnInit {

    // loading for progess indicator
    loading: boolean;

    // permissions of logged-in user
    session: Session;
    sysAdmin: boolean = false;
    projectAdmin: boolean = false;

    // project shortcode; as identifier in project cache service
    projectcode: string;

    // project data
    project: ReadProject;

    // project members
    projectGroups: ReadGroup[] = [];

    @ViewChild('addGroupComponent', { static: false }) addGroup: AddGroupComponent;

    constructor(
        private _cache: CacheService,
        private _route: ActivatedRoute,
        private _titleService: Title) {

        // get the shortcode of the current project
        this._route.parent.paramMap.subscribe((params: Params) => {
            this.projectcode = params.get('shortcode');
        });

        // set the page title
        this._titleService.setTitle('Project ' + this.projectcode + ' | Permission Groups');

    }

    ngOnInit() {

        // get information about the logged-in user
        this.session = JSON.parse(localStorage.getItem('session'));
        // is the logged-in user system admin?
        this.sysAdmin = this.session.user.sysAdmin;

        // default value for projectAdmin
        this.projectAdmin = this.sysAdmin;

    }


    /**
     * build the list of members
     */
    initList(): void {

    }
    /**
   * refresh list of members after adding a new user to the team
   */
    refresh(): void {
        // referesh the component
        this.loading = true;
        // update the cache
        this._cache.del('members_of_' + this.projectcode);

        this.initList();

        // refresh child component: add user
        if (this.addGroup) {
            this.addGroup.buildForm();
        }
    }

}
