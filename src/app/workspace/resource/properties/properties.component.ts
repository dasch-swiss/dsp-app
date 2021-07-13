import { Component, EventEmitter, Inject, Input, OnChanges, OnDestroy, OnInit, Output } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
    ApiResponseData,
    ApiResponseError,
    CardinalityUtil,
    Constants,
    DeleteValue,
    KnoraApiConnection,
    PermissionUtil,
    ProjectResponse,
    ReadLinkValue,
    ReadProject,
    ReadResourceSequence,
    ReadTextValueAsXml,
    ReadUser,
    ReadValue,
    ResourcePropertyDefinition,
    UserResponse
} from '@dasch-swiss/dsp-js';
import {
    AddedEventValue,
    DeletedEventValue,
    DspApiConnectionToken,
    Events,
    NotificationService,
    PropertyInfoValues,
    UpdatedEventValues,
    UserService,
    ValueOperationEventService,
    ValueService
} from '@dasch-swiss/dsp-ui';
import { Subscription } from 'rxjs';
import { DspResource } from '../dsp-resource';

@Component({
    selector: 'app-properties',
    templateUrl: './properties.component.html',
    styleUrls: ['./properties.component.scss']
})
export class PropertiesComponent implements OnInit, OnChanges, OnDestroy {

    /**
     * input `resource` of properties component:
     * complete information about the current resource
     */
    @Input() resource: DspResource;

    /**
     * input `displayProjectInfo` of properties component:
     * display project info or not; "This resource belongs to project XYZ"
     */
    @Input() displayProjectInfo: false;

    /**
     * output `referredProjectClicked` of resource view component:
     * can be used to go to project page
     */
    @Output() referredProjectClicked: EventEmitter<ReadProject> = new EventEmitter<ReadProject>();

    /**
     * output `referredProjectHovered` of resource view component:
     * can be used for preview when hovering on project
     */
    @Output() referredProjectHovered: EventEmitter<ReadProject> = new EventEmitter<ReadProject>();

    /**
     * output `referredResourceClicked` of resource view component:
     * can be used to open resource
     */
    @Output() referredResourceClicked: EventEmitter<ReadLinkValue> = new EventEmitter<ReadLinkValue>();

    /**
     * output `referredResourceHovered` of resource view component:
     * can be used for preview when hovering on resource
     */
    @Output() referredResourceHovered: EventEmitter<ReadLinkValue> = new EventEmitter<ReadLinkValue>();

    addButtonIsVisible: boolean; // used to toggle add value button
    addValueFormIsVisible: boolean; // used to toggle add value form field
    propID: string; // used in template to show only the add value form of the corresponding value

    valueOperationEventSubscriptions: Subscription[] = []; // array of ValueOperationEvent subscriptions

    representationConstants = {
        'stillImage': Constants.HasStillImageFileValue,
        'movingImage': Constants.HasMovingImageFileValue,
        'audio': Constants.HasAudioFileValue,
        'document': Constants.HasDocumentFileValue,
        'text': Constants.HasTextFileValue
    };

    project: ReadProject;
    user: ReadUser;

    showAllProps = false;   // show or hide empty properties

    constructor(
        @Inject(DspApiConnectionToken) private _dspApiConnection: KnoraApiConnection,
        private _notification: NotificationService,
        private _snackBar: MatSnackBar,
        private _userService: UserService,
        private _valueOperationEventService: ValueOperationEventService,
        private _valueService: ValueService
    ) { }

    ngOnInit(): void {
        if (this.resource.res) {
            // get user permissions
            const allPermissions = PermissionUtil.allUserPermissions(
                this.resource.res.userHasPermission as 'RV' | 'V' | 'M' | 'D' | 'CR'
            );

            // if user has modify permissions, set addButtonIsVisible to true so the user see's the add button
            this.addButtonIsVisible = allPermissions.indexOf(PermissionUtil.Permissions.M) !== -1;
        }

        // listen for the AddValue event to be emitted and call hideAddValueForm()
        // this._valueOperationEventService.on(Events.ValueAdded, () => this.hideAddValueForm())
        this.valueOperationEventSubscriptions = [];

        // subscribe to the ValueOperationEventService and listen for an event to be emitted
        this.valueOperationEventSubscriptions.push(this._valueOperationEventService.on(
            Events.ValueAdded, (newValue: AddedEventValue) => {
                if (newValue) {
                    this.addValueToResource(newValue.addedValue);
                    this.hideAddValueForm();
                }
            }));

        this.valueOperationEventSubscriptions.push(this._valueOperationEventService.on(
            Events.ValueUpdated, (updatedValue: UpdatedEventValues) => {
                this.updateValueInResource(updatedValue.currentValue, updatedValue.updatedValue);
                this.hideAddValueForm();
            }));

        this.valueOperationEventSubscriptions.push(this._valueOperationEventService.on(
            Events.ValueDeleted, (deletedValue: DeletedEventValue) => this.deleteValueFromResource(deletedValue.deletedValue)
        ));
    }

    ngOnChanges(): void {
        // get project information
        this._dspApiConnection.admin.projectsEndpoint.getProjectByIri(this.resource.res.attachedToProject).subscribe(
            (response: ApiResponseData<ProjectResponse>) => {
                this.project = response.body.project;
            },
            (error: ApiResponseError) => {
                this._notification.openSnackBar(error);
            }
        );

        // get user information
        this._userService.getUser(this.resource.res.attachedToUser).subscribe(
            (response: UserResponse) => {
                this.user = response.user;
            }
        );
    }

    ngOnDestroy() {
        // unsubscribe from the event bus when component is destroyed
        // if (this.valueOperationEventSubscription !== undefined) {
        //     this.valueOperationEventSubscription.unsubscribe();
        // }
        // unsubscribe from the ValueOperationEventService when component is destroyed
        if (this.valueOperationEventSubscriptions !== undefined) {
            this.valueOperationEventSubscriptions.forEach(sub => sub.unsubscribe());
        }
    }

    /**
     * opens project
     * @param linkValue
     */
    openProject(project: ReadProject) {
        window.open('/project/' + project.shortcode, '_blank');
    }

    previewProject(project: ReadProject) {
        // --> TODO: pop up project preview on hover
    }

    /**
     * opens resource
     * @param linkValue
     */
    openResource(linkValue: ReadLinkValue) {
        window.open('/resource/' + encodeURIComponent(linkValue.linkedResource.id), '_blank');
    }

    previewResource(linkValue: ReadLinkValue) {
        // --> TODO: pop up resource preview on hover
    }

    /**
    * display message to confirm the copy of the citation link (ARK URL)
    */
    openSnackBar() {
        const message = 'Copied to clipboard!';
        const action = 'Citation Link';
        this._snackBar.open(message, action, {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
        });
    }

    /**
     * called from the template when the user clicks on the add button
     */
    showAddValueForm(prop: PropertyInfoValues) {
        this.propID = prop.propDef.id;
        this.addValueFormIsVisible = true;
    }

    /**
     * called from the template when the user clicks on the cancel button
     */
    hideAddValueForm() {
        this.addValueFormIsVisible = false;
        this.addButtonIsVisible = true;
        this.propID = undefined;
    }

    /**
     * given a resource property, check if an add button should be displayed under the property values
     *
     * @param prop the resource property
     */
    addValueIsAllowed(prop: PropertyInfoValues): boolean {

        // if the ontology flags this as a read-only property,
        // don't ever allow to add a value
        if (prop.propDef instanceof ResourcePropertyDefinition && !prop.propDef.isEditable) {
            return false;
        }

        const isAllowed = CardinalityUtil.createValueForPropertyAllowed(
            prop.propDef.id, prop.values.length, this.resource.res.entityInfo.classes[this.resource.res.type]);

        // check if:
        // cardinality allows for a value to be added
        // value component does not already have an add value form open
        // user has write permissions
        return isAllowed && this.propID !== prop.propDef.id && this.addButtonIsVisible;
    }

    /**
     * updates the UI in the event of a new value being added to show the new value
     *
     * @param valueToAdd the value to add to the end of the values array of the filtered property
     */
    addValueToResource(valueToAdd: ReadValue): void {
        if (this.resource.resProps) {
            this.resource.resProps
                .filter(propInfoValueArray =>
                    propInfoValueArray.propDef.id === valueToAdd.property) // filter to the correct property
                .forEach(propInfoValue =>
                    propInfoValue.values.push(valueToAdd)); // push new value to array
            if (valueToAdd instanceof ReadTextValueAsXml) {
                this._updateStandoffLinkValue();
            }
        } else {
            // --> TODO: better error handler!
            console.error('No properties exist for this resource');
        }
    }

    /**
     * updates the UI in the event of an existing value being updated to show the updated value
     *
     * @param valueToReplace the value to be replaced within the values array of the filtered property
     * @param updatedValue the value to replace valueToReplace with
     */
    updateValueInResource(valueToReplace: ReadValue, updatedValue: ReadValue): void {
        if (this.resource.resProps && updatedValue !== null) {
            this.resource.resProps
                .filter(propInfoValueArray =>
                    propInfoValueArray.propDef.id === valueToReplace.property) // filter to the correct property
                .forEach(filteredpropInfoValueArray => {
                    filteredpropInfoValueArray.values.forEach((val, index) => { // loop through each value of the current property
                        if (val.id === valueToReplace.id) { // find the value that should be updated using the id of valueToReplace
                            filteredpropInfoValueArray.values[index] = updatedValue; // replace value with the updated value
                        }
                    });
                });
            if (updatedValue instanceof ReadTextValueAsXml) {
                this._updateStandoffLinkValue();
            }
        } else {
            console.error('No properties exist for this resource');
        }
    }

    /**
     * updates the UI in the event of an existing value being deleted
     *
     * @param valueToDelete the value to remove from the values array of the filtered property
     */
    deleteValueFromResource(valueToDelete: DeleteValue): void {
        if (this.resource.resProps) {
            this.resource.resProps
                .filter(propInfoValueArray =>  // filter to the correct type
                    this._valueService.compareObjectTypeWithValueType(propInfoValueArray.propDef.objectType, valueToDelete.type))
                .forEach(filteredpropInfoValueArray => {
                    filteredpropInfoValueArray.values.forEach((val, index) => { // loop through each value of the current property
                        if (val.id === valueToDelete.id) { // find the value that was deleted using the id
                            filteredpropInfoValueArray.values.splice(index, 1); // remove the value from the values array
                            if (val instanceof ReadTextValueAsXml) {
                                this._updateStandoffLinkValue();
                            }
                        }
                    });
                }
                );
        } else {
            console.error('No properties exist for this resource');
        }
    }

    /**
     * updates the standoff link value for the resource being displayed.
     *
     */
    private _updateStandoffLinkValue(): void {

        if (this.resource.res === undefined) {
            // this should never happen:
            // if the user was able to click on a standoff link,
            // then the resource must have been initialised before.
            return;
        }

        const gravsearchQuery = `
     PREFIX knora-api: <http://api.knora.org/ontology/knora-api/simple/v2#>
     CONSTRUCT {
         ?res knora-api:isMainResource true .
         ?res knora-api:hasStandoffLinkTo ?target .
     } WHERE {
         BIND(<${this.resource.res.id}> as ?res) .
         OPTIONAL {
             ?res knora-api:hasStandoffLinkTo ?target .
         }
     }
     OFFSET 0
     `;

        this._dspApiConnection.v2.search.doExtendedSearch(gravsearchQuery).subscribe(
            (res: ReadResourceSequence) => {

                // one resource is expected
                if (res.resources.length !== 1) {
                    return;
                }

                const newStandoffLinkVals = res.resources[0].getValuesAs(Constants.HasStandoffLinkToValue, ReadLinkValue);

                this.resource.resProps.filter(
                    resPropInfoVal => (resPropInfoVal.propDef.id === Constants.HasStandoffLinkToValue)
                ).forEach(
                    standoffLinkResPropInfoVal => {
                        // delete all the existing standoff link values
                        standoffLinkResPropInfoVal.values = [];
                        // push standoff link values retrieved for the resource
                        newStandoffLinkVals.forEach(
                            standoffLinkVal => {
                                standoffLinkResPropInfoVal.values.push(standoffLinkVal);
                            }
                        );
                    });

            },
            err => {
                console.error(err);
            }
        );

    }
}
