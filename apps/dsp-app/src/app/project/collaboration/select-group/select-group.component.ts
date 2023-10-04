import {
    Component,
    EventEmitter,
    Inject,
    Input,
    OnInit,
    Output,
} from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import {
    ApiResponseData,
    ApiResponseError,
    GroupsResponse,
    KnoraApiConnection,
} from '@dasch-swiss/dsp-js';
import { ApplicationStateService } from '@dasch-swiss/vre/shared/app-state-service';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { AppErrorHandler } from '@dasch-swiss/vre/shared/app-error-handler';
import { AutocompleteItem } from '@dsp-app/src/app/workspace/search/operator';

@Component({
    selector: 'app-select-group',
    templateUrl: './select-group.component.html',
    styleUrls: ['./select-group.component.scss'],
})
export class SelectGroupComponent implements OnInit {
    // project short code
    @Input() projectCode: string;

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

    groupCtrl = new UntypedFormControl();

    // send data only, when the selection has changed
    sendData = false;

    constructor(
        @Inject(DspApiConnectionToken)
        private _dspApiConnection: KnoraApiConnection,
        private _applicationStateService: ApplicationStateService,
        private _errorHandler: AppErrorHandler
    ) {}

    ngOnInit() {
        this.groupCtrl.setValue(this.permissions);

        // build list of groups: default and project-specific
        this.setList();
    }

    setList() {
        // update list of groups with the project specific groups
        this._dspApiConnection.admin.groupsEndpoint.getGroups().subscribe(
            (response: ApiResponseData<GroupsResponse>) => {
                this._applicationStateService.set('groups_of_' + this.projectCode, response.body.groups);
                for (const group of response.body.groups) {
                    if (group.project.id === this.projectid) {
                        this.projectGroups.push({
                            iri: group.id,
                            name: group.name,
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
     * @param arrOne string array
     * @param arrTwo string array
     */
    compare(arrOne: string[], arrTwo: string[]): boolean {
        arrOne = arrOne.sort((n1, n2) => {
            if (n1 > n2) {
                return 1;
            }

            if (n1 < n2) {
                return -1;
            }

            return 0;
        });

        arrTwo = arrTwo.sort((n1, n2) => {
            if (n1 > n2) {
                return 1;
            }

            if (n1 < n2) {
                return -1;
            }

            return 0;
        });

        return JSON.stringify(arrOne) !== JSON.stringify(arrTwo);
    }
}
