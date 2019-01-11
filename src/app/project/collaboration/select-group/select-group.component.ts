import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { existingNamesValidator } from '@knora/action';
import {
    ApiServiceError,
    AutocompleteItem,
    Group,
    GroupsService,
    KnoraConstants,
    PermissionData,
    Project,
    ProjectsService
} from '@knora/core';
import { CacheService } from '../../../main/cache/cache.service';

@Component({
    selector: 'app-select-group',
    templateUrl: './select-group.component.html',
    styleUrls: ['./select-group.component.scss']
})
export class SelectGroupComponent implements OnInit {

    loading: boolean = true;

    // send data only, when the selection has changed
    sendData: boolean = false;

    // project iri
    @Input() projectcode: string;

    project: Project;

    // users permissions from User data
    @Input() permissions: any;

    // send the changes to the parent
    @Output() groupChange: EventEmitter<any> = new EventEmitter<any>();


    // default system groups and project specific groups
    projectGroups: AutocompleteItem[] = [
        // {
        //     iri: KnoraConstants.ProjectMemberGroupIRI,
        //     name: 'Member'
        // },
        {
            iri: KnoraConstants.ProjectAdminGroupIRI,
            name: 'Admin'
        }
    ];

    form: FormGroup;

    groupCtrl = new FormControl(
        // {value: this.permissions.groupsPerProject}
    );

    constructor(private _cache: CacheService,
                private _projectsService: ProjectsService,
                private _groupsService: GroupsService,
                private _fb: FormBuilder) {

    }

    ngOnInit() {
        //
        // this.form = this._fb.group({
        //     'groups': new FormControl({
        //         // value: [this.permissions]
        //     })
        // });

        this.groupCtrl.setValue(this.permissions);

        console.log(this.permissions);

        // get project data from cache
        this._cache.get(this.projectcode, this._projectsService.getProjectByShortcode(this.projectcode)).subscribe(
            (response: any) => {
                this.project = response;
            },
            (error: ApiServiceError) => {
                console.error(error);
            }
        );

        // build list of groups: default and project-specific
        this.setList();




    }

    setList() {

        // update list of groups with the project specific groups
        this._cache.get('groups_of_' + this.projectcode, this._groupsService.getAllGroups()).subscribe(
            (result: Group[]) => {

                for (const group of result) {
                    if (group.project.id === this.project.id) {
                        this.projectGroups.push({
                            iri: group.id,
                            name: group.name
                        });
                        this.loading = false;
                    }
                }
            },
            (error: ApiServiceError) => {
                console.error(error);
            }
        );
    }

    onGroupChange() {
        if (this.sendData) {
            this.groupChange.emit(this.groupCtrl.value);
            console.log('Group changed: ', this.groupCtrl.value);
        }
    }

    onGroupSelect() {
        // if change is true, the onGroupChange is active
        // with this method we prevent to submit data already by opening the selection
        // it should emit the data when closing the selection and if the data has changed!
        this.sendData = true;
    }

    /*
        add(event: MatChipInputEvent): void {
            const input = event.input;
            const value = event.value;

            // Add our fruit
            if ((value || '').trim()) {
                // find value in label of allGroups
                // value.trim()
                // and add it to the user's groups (to send it later to the api)
                // this.groups.push(value.trim());
            }

            // Reset the input value
            if (input) {
                input.value = '';
            }

            this.groupCtrl.setValue(null);
        }

        remove(group: AutocompleteItem): void {
            const index = this.groups.indexOf(group);

            if (index >= 0) {
                this.groups.splice(index, 1);
            }
        }

        selected(event: MatAutocompleteSelectedEvent): void {
            // this.groups.push(event.option.viewValue);
            this.fruitInput.nativeElement.value = '';
            this.groupCtrl.setValue(null);
        }

        private _filter(value: string): AutocompleteItem[] {
            const filterValue = value.toLowerCase();

            return this.allGroups.filter(group => group.name.toLowerCase().indexOf(filterValue) === 0);
        }
    */

}
