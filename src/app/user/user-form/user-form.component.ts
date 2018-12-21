import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { existingNamesValidator } from '@knora/action';
import { ApiServiceError, AutocompleteItem, KnoraConstants, ProjectsService, User, UsersService, Utils } from '@knora/core';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { CacheService } from '../../main/cache/cache.service';

@Component({
    selector: 'app-user-form',
    templateUrl: './user-form.component.html',
    styleUrls: ['./user-form.component.scss']
})
export class UserFormComponent implements OnInit {
    /**
     * status for the progress indicator
     */
    loading: boolean = true;

    /**
     * going through the form assistant: step by step
     */
    isLinear = true;




    // ------------------------------------------------------------------------
    // third step:
    //  - select project (in system view) / project name (in project view)
    //  - depending on the select project: select permission groups
    //

    @Input() projectIri?: string = undefined;

    // selected groups
    selectedGroups: AutocompleteItem[];

    // project data of selected project
    selectedProject: AutocompleteItem;

    //
    // ------------------------------------------------------------------------


    // ------------------------------------------------------------------------
    // fourth step:
    //  - send all the data to the api server
    //

    // from step 2: submit user data; activate the progress loader
    submitUserStatus = -1;
    // on error with user data
    userErrorMessage: ApiServiceError = undefined;

    // from step 3: submit project membership; activate the progress loader
    submitMembershipStatus = -1;
    membershipErrorMessage: ApiServiceError = undefined;

    // from step 3: submit group permissions; activate the progress loader
    submitPermissionsStatus = -1;
    // on error with permissions data
    permissionsErrorMessage: ApiServiceError = undefined;

    //
    // ------------------------------------------------------------------------


    // ------------------------------------------------------------------------
    // error handling
    //
    // general api error message
    errorMessage: any = undefined;

    //
    // ------------------------------------------------------------------------


    constructor(private _cache: CacheService,
                public _usersService: UsersService,
                public _projectsService: ProjectsService,
                private _formBuilder: FormBuilder) {

    }

    ngOnInit() {

        this._cache.get('allUsers', this._usersService.getAllUsers());
        this._cache.get('allProjects', this._projectsService.getAllProjects());

    }




}
