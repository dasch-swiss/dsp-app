import { Component, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ApiResponseData, ApiResponseError, GroupsResponse, KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/dsp-ui';
import { CacheService } from 'src/app/main/cache/cache.service';
import { AutocompleteItem } from 'src/app/main/declarations/autocomplete-item';
import { ErrorHandlerService } from 'src/app/main/error/error-handler.service';

@Component({
    selector: 'app-select-group',
    templateUrl: './select-group.component.html',
    styleUrls: ['./select-group.component.scss']
})
export class SelectGroupComponent implements OnInit {
    // send data only, when the selection has changed
    sendData: boolean = false;

    // project short code
    @Input() projectcode: string;

    // project iri
    @Input() projectid: string;

    // users permissions from user data
    @Input() permissions: any;

    // disable the selection; in case a user doesn't have the rights to change the permission
    @Input() disabled?: boolean = false;

    // send the changes to the parent
    @Output() groupChange: EventEmitter<any> = new EventEmitter<any>();

    // default system groups and project specific groups
    projectGroups: AutocompleteItem[] = [];

    groupCtrl = new FormControl();

    constructor(
        @Inject(DspApiConnectionToken) private _dspApiConnection: KnoraApiConnection,
        private _cache: CacheService,
        private _errorHandler: ErrorHandlerService
    ) { }

    ngOnInit() {
        this.groupCtrl.setValue(this.permissions);

        // build list of groups: default and project-specific
        this.setList();
    }

    setList() {
        // set cache for groups
        this._cache.get('groups_of_' + this.projectcode, this._dspApiConnection.admin.groupsEndpoint.getGroups());

        // update list of groups with the project specific groups
        this._cache.get('groups_of_' + this.projectcode, this._dspApiConnection.admin.groupsEndpoint.getGroups()).subscribe(
            (response: ApiResponseData<GroupsResponse>) => {
                for (const group of response.body.groups) {
                    if (group.project.id === this.projectid) {
                        this.projectGroups.push({
                            iri: group.id,
                            name: group.name
                        });
                    }
                }
            },
            (error: ApiResponseError) => {
                this._errorHandler.showMessage(error);
            }
        );
    }

    onGroupChange() {
        // get the selected values onOpen and onClose
        // and compare them with the current values from user profile
        // compare the selected data with the permissions data
        this.sendData = this.compare(this.permissions, this.groupCtrl.value);

        if (this.sendData) {
            this.permissions = this.groupCtrl.value;
            this.groupChange.emit(this.groupCtrl.value);
        }
    }

    onGroupSelect() {
        // if change is true, the onGroupChange is active
        // with this method we prevent to submit data already by opening the selection
        // it should emit the data when closing the selection and if the data has changed!
        // this.sendData = (this.groupCtrl.value !== this.permissions);
    }

    /**
     * compare two arrays and return true, if they are different
     * @param arr_1 string array
     * @param arr_2 string array
     */
    compare(arr_1: string[], arr_2: string[]): boolean {
        arr_1 = arr_1.sort((n1, n2) => {
            if (n1 > n2) {
                return 1;
            }

            if (n1 < n2) {
                return -1;
            }

            return 0;
        });

        arr_2 = arr_2.sort((n1, n2) => {
            if (n1 > n2) {
                return 1;
            }

            if (n1 < n2) {
                return -1;
            }

            return 0;
        });

        return JSON.stringify(arr_1) !== JSON.stringify(arr_2);
    }
}
