import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { ApiServiceError, AutocompleteItem, Group, GroupsService, KnoraConstants, Project, ProjectsService, User } from '@knora/core';

@Component({
    selector: 'app-user-role',
    templateUrl: './user-role.component.html',
    styleUrls: ['./user-role.component.scss']
})
export class UserRoleComponent implements OnInit {

    /**
     * project iri in case of project admin view;
     * in the system view, we have to select a project first
     */
    @Input() projectIri: string;

    /**
     * user data
     */
    @Input() user: User;


    /**
     * Is the form a standalone or embedded in a step by step form wizard?
     *
     * @type {boolean}
     */
    @Input() standalone = true;

    /**
     * submit user role to parent
     *
     * @type {EventEmitter<any>}
     */
    @Output() userRole = new EventEmitter<any>();

    // in case of an API error
    errorMessage: any;

    // show the content after every service has loaded and the data is ready
    loading = true;

    userRoleForm: FormGroup;

    projects: Project[];

    projectsList: any = [];

    // default permission groups / role of the user in a project
    defaultGroups: AutocompleteItem[] = [
        {
            iri: KnoraConstants.ProjectMemberGroupIRI,
            name: 'Member'
        },
        {
            iri: KnoraConstants.ProjectAdminGroupIRI,
            name: 'Administrator'
        }
        /* use the following in system view only!
        {
            iri: KnoraConstants.SystemAdminGroupIRI,
            name: '',
            label: 'System admin'
        }
        */

    ];

    // the list of groups which will be used in the select group field
    groups: Group[];
    groupsList: AutocompleteItem[];

    usersDefaultGroup: string = KnoraConstants.ProjectMemberGroupIRI;
    selectedGroups: string[] = [this.usersDefaultGroup];

    constructor(private _projectsService: ProjectsService,
                private _groupsService: GroupsService,
                private _formBuilder: FormBuilder) {
    }

    ngOnInit() {

        // create a list of projects to select from there;
        // in case of defined projectIri: select this project and disable to edit
        this._projectsService.getAllProjects()
            .subscribe(
                (result: Project[]) => {
                    this.projects = result;

                    let i = 0;
                    for (const p of result) {
                        this.projectsList[i] = {
                            iri: p.id,
                            name: p.longname + ' (' + p.shortname + ')'
                        };
                        i++;
                    }

                    this.projectsList.sort(function (p1, p2) {
                        if (p1.name < p2.name) {
                            return -1;
                        } else if (p1.name > p2.name) {
                            return 1;
                        } else {
                            return 0;
                        }
                    });


                },
                (error: ApiServiceError) => {
                    this.errorMessage = <any> error;
                }
            );

        this.buildForm(this.projectIri);

        this.loading = false;

        // update the form on value change:
        // "selected project" status and the list of groups for this project
        this.userRoleForm.controls['project'].valueChanges.subscribe(() => {

            this.projectIri = this.userRoleForm.controls['project'].value;
            this.groupsList = this.setGroupsList(this.projectIri);
            this.selectUsersGroups(this.projectIri, this.user);
        });

    }

    buildForm(piri: string) {

        // build the form
        this.userRoleForm = this._formBuilder.group({
            'project': new FormControl({
                value: piri, disabled: (piri)
            }),
            'group': new FormControl({
                value: this.selectedGroups, disabled: false
            })
        });

    }


    /**
     * set the list of groups depending on the selected project
     *
     * @param {string} project
     * @returns {AutocompleteItem[]}
     */
    setGroupsList(project: string): AutocompleteItem[] {

        // reset the list of groups
        const listOfGroups: AutocompleteItem[] = [];

        // initialize a new list of groups with the default Knora groups (Member and Admin)
        for (const group of this.defaultGroups) {
            listOfGroups.push(group);
        }

        // add more groups, depending on the selected project
        if (this.groups) {
            for (const group of this.groups) {
                if (group.project.id === project) {
                    listOfGroups.push({
                        iri: group.id,
                        name: group.name
                    });
                }
            }
        }

        return listOfGroups;
    }

    /**
     * compare the membership of the selected user (from @Input)
     * with the selected project and select the user's groups
     *
     * @param {string} project
     */
    selectUsersGroups(projectIri: string, user: User) {

        if (user.permissions) {

            this.selectedGroups = [];
            this.userRoleForm.controls['group'].reset(this.selectedGroups);

            const permissions = user.permissions;
            if (permissions.groupsPerProject[projectIri]) {
                // is the user a member of the project?
                // if true, get the permissions
                for (const perm of permissions.groupsPerProject[projectIri]) {

                    this.groupsList.find(item => {
                        if (item.iri === perm) {
                            this.selectedGroups.push(item.iri);
                        }
                        return item.iri === perm;
                    });
                }

                this.userRoleForm.controls['group'].reset(this.selectedGroups);
            } else {
                // preselect member only
                this.userRoleForm.controls['group'].reset([this.usersDefaultGroup]);
            }
        } else {
            // new user without any permissions yet
            this.selectedGroups = [this.usersDefaultGroup];
            this.userRoleForm.controls['group'].reset(this.selectedGroups);
        }
    }

    submitData(): void {
        // create an object with project info (type AutocompleteItem)
        // and with groups (AutocompleteItem as well)
        // and submit them

        // collect project information
        let project: AutocompleteItem;
        const piri: string = (!this.projectIri ? this.userRoleForm.value['project'] : this.projectIri);
        project = this.projectsList.find(p => p.iri === piri);

        // collect groups information
        const groups: any = [];
        for (const giri of this.userRoleForm.value['group']) {
            const group: AutocompleteItem = this.groupsList.find(g => g.iri === giri);
            groups.push(group);
        }

        // combine the project and groups data
        const data: any = {
            'project': project,
            'groups': groups
        };

        // and submit it

        if (!this.standalone) {
            // to parent
            this.userRole.emit(data);
        }

    }
}
