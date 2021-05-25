import {
    Component, EventEmitter,
    Inject,
    Input,
    OnDestroy,
    OnInit,
    Output,
    ViewChild
} from '@angular/core';
import {
    CardinalityUtil,
    Constants,
    DeleteValue,
    KnoraApiConnection,
    PermissionUtil,
    ReadLinkValue,
    ReadResource,
    ReadResourceSequence,
    ReadTextValueAsXml,
    ReadValue,
    ResourcePropertyDefinition,
    SystemPropertyDefinition
} from '@dasch-swiss/dsp-js';
import {
    AddedEventValue,
    AddValueComponent,
    DeletedEventValue,
    DisplayEditComponent,
    DspApiConnectionToken,
    Events,
    PropertyInfoValues,
    UpdatedEventValues,
    ValueOperationEventService,
    ValueService
} from '@dasch-swiss/dsp-ui';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-resource-properties',
    templateUrl: './resource-properties.component.html',
    styleUrls: ['./resource-properties.component.scss']
})
export class ResourcePropertiesComponent implements OnInit, OnDestroy {

    @ViewChild('displayEdit') displayEditComponent: DisplayEditComponent;
    @ViewChild('addValue') addValueComponent: AddValueComponent;
    /**
     * parent resource
     *
     * @param (parentResource)
     */
    @Input() parentResource: ReadResource;

    /**
     * array of property object with ontology class prop def, list of properties and corresponding values
     *
     * @param (propArray)
     */
    @Input() propArray: PropertyInfoValues[];

    /**
     * array of system property object with list of system properties
     *
     * @param (systemPropArray)
     */
    @Input() systemPropArray: SystemPropertyDefinition[];

    /**
     * show all properties, even if they don't have a value.
     *
     * @param  (showAllProps)
     */
    @Input() showAllProps = false;

    @Output() referredResourceClicked: EventEmitter<ReadLinkValue> = new EventEmitter<ReadLinkValue>();

    @Output() referredResourceHovered: EventEmitter<ReadLinkValue> = new EventEmitter<ReadLinkValue>();

    addButtonIsVisible: boolean; // used to toggle add value button
    addValueFormIsVisible: boolean; // used to toggle add value form field
    propID: string; // used in template to show only the add value form of the corresponding value

    valueOperationEventSubscriptions: Subscription[] = []; // array of ValueOperationEvent subscriptions

    constructor(
        @Inject(DspApiConnectionToken) private _dspApiConnection: KnoraApiConnection,
        private _valueOperationEventService: ValueOperationEventService,
        private _valueService: ValueService
    ) { }

    ngOnInit() {
        if (this.parentResource) {
            // get user permissions
            const allPermissions = PermissionUtil.allUserPermissions(
                this.parentResource.userHasPermission as 'RV' | 'V' | 'M' | 'D' | 'CR'
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
            prop.propDef.id, prop.values.length, this.parentResource.entityInfo.classes[this.parentResource.type]);

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
        if (this.propArray) {
            this.propArray
                .filter(propInfoValueArray =>
                    propInfoValueArray.propDef.id === valueToAdd.property) // filter to the correct property
                .forEach(propInfoValue =>
                    propInfoValue.values.push(valueToAdd)); // push new value to array
            if (valueToAdd instanceof ReadTextValueAsXml) {
                this._updateStandoffLinkValue();
            }
        } else {
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
        if (this.propArray && updatedValue !== null) {
            this.propArray
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
        if (this.propArray) {
            this.propArray
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

        if (this.parentResource === undefined) {
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
         BIND(<${this.parentResource.id}> as ?res) .
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

                this.propArray.filter(
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
