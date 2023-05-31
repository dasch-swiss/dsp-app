import {
    animate,
    state,
    style,
    transition,
    trigger,
} from '@angular/animations';
import {
    Component,
    EventEmitter,
    Inject,
    Input,
    OnInit,
    Output,
    ViewChild,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
    ApiResponseError,
    Constants,
    DeleteValue,
    DeleteValueResponse,
    KnoraApiConnection,
    PermissionUtil,
    ReadLinkValue,
    ReadResource,
    ReadUser,
    ReadValue,
    ResourcePropertyDefinition,
    UpdateResource,
    UpdateValue,
    WriteValueResponse,
} from '@dasch-swiss/dsp-js';
import { mergeMap } from 'rxjs/operators';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { BaseValueDirective } from '../../../../main/directive/base-value.directive';
import {
    ConfirmationDialogComponent,
    ConfirmationDialogData,
    ConfirmationDialogValueDeletionPayload,
} from '../../../../main/action/confirmation-dialog/confirmation-dialog.component';
import { PropertyInfoValues } from '../../properties/properties.component';
import { UserService } from '../../services/user.service';
import {
    DeletedEventValue,
    EmitEvent,
    Events,
    UpdatedEventValues,
    ValueOperationEventService,
} from '../../services/value-operation-event.service';
import { ValueService } from '../../services/value.service';

@Component({
    selector: 'app-display-edit',
    templateUrl: './display-edit.component.html',
    styleUrls: ['./display-edit.component.scss'],
    animations: [
        // the fade-in/fade-out animation.
        // https://www.kdechant.com/blog/angular-animations-fade-in-and-fade-out
        trigger('simpleFadeAnimation', [
            // the "in" style determines the "resting" state of the element when it is visible.
            state('in', style({ opacity: 1 })),

            // fade in when created.
            transition(':enter', [
                // the styles start from this point when the element appears
                style({ opacity: 0 }),
                // and animate toward the "in" state above
                animate(150),
            ]),

            // fade out when destroyed.
            transition(
                ':leave',
                // fading out uses a different syntax, with the "style" being passed into animate()
                animate(150, style({ opacity: 0 }))
            ),
        ]),
    ],
})
export class DisplayEditComponent implements OnInit {
    @ViewChild('displayVal') displayValueComponent: BaseValueDirective;

    @Input() displayValue: ReadValue;

    @Input() propArray: PropertyInfoValues[];

    @Input() parentResource: ReadResource;

    @Input() configuration?: object;

    @Input() canDelete: boolean;

    @Input() projectStatus: boolean;

    @Input() valueUuidToHighlight: string;

    @Output() referredResourceClicked: EventEmitter<ReadLinkValue> =
        new EventEmitter<ReadLinkValue>();

    @Output() referredResourceHovered: EventEmitter<ReadLinkValue> =
        new EventEmitter<ReadLinkValue>();

    constants = Constants;

    mode: 'read' | 'update' | 'create' | 'search';

    canModify: boolean;

    editModeActive = false;

    submittingValue = false;

    shouldShowCommentToggle: boolean;

    // type of given displayValue
    // or knora-api-js-lib class representing the value
    valueTypeOrClass: string;

    // indicates if value can be edited
    readOnlyValue: boolean;

    // indicates if the action bubble with the CRUD buttons should be shown
    showActionBubble = false;

    // string used as class name to add add to value-component element on hover
    valueHovered: boolean;

    dateDisplayOptions: 'era' | 'calendar' | 'all';

    showDateLabels = false;

    textArea = false;

    dateFormat: string;

    user: ReadUser;

    ontoIri: string;

    constructor(
        @Inject(DspApiConnectionToken)
        private _dspApiConnection: KnoraApiConnection,
        private _valueOperationEventService: ValueOperationEventService,
        private _dialog: MatDialog,
        private _userService: UserService,
        private _valueService: ValueService
    ) {}

    ngOnInit() {
        this.ontoIri = this.parentResource.type.split('#')[0];
        this.mode = 'read';
        this.dateDisplayOptions = 'all';
        this.showDateLabels = true;
        this.dateFormat = 'dd.MM.YYYY';

        // determine if user has modify permissions
        const allPermissions = PermissionUtil.allUserPermissions(
            this.displayValue.userHasPermission as 'RV' | 'V' | 'M' | 'D' | 'CR'
        );

        this.canModify =
            allPermissions.indexOf(PermissionUtil.Permissions.M) !== -1;

        // check if comment toggle button should be shown
        this.checkCommentToggleVisibility();

        this.valueTypeOrClass = this._valueService.getValueTypeOrClass(
            this.displayValue
        );

        // get the resource property definition
        const resPropDef = this.parentResource.entityInfo
            .getPropertyDefinitionsByType(ResourcePropertyDefinition)
            .filter(
                (propDef: ResourcePropertyDefinition) =>
                    propDef.id === this.displayValue.property
            );

        if (
            resPropDef[0].guiElement ===
            Constants.SalsahGui + Constants.HashDelimiter + 'Textarea'
        ) {
            this.textArea = true;
        }

        if (resPropDef.length !== 1) {
            // this should never happen because we always have the property info for the given value
            throw new Error(
                'Resource Property Definition could not be found: ' +
                    this.displayValue.property
            );
        }

        this.readOnlyValue = this._valueService.isReadOnly(
            this.valueTypeOrClass,
            this.displayValue,
            resPropDef[0]
        );

        // prevent getting info about system user (standoff link values are managed by the system)
        if (
            this.displayValue.attachedToUser !==
            'http://www.knora.org/ontology/knora-admin#SystemUser'
        ) {
            this._userService
                .getUser(this.displayValue.attachedToUser)
                .subscribe((user) => {
                    this.user = user.user;
                });
        }
    }

    getTooltipText(): string {
        const creationDate =
            'Creation date: ' + this.displayValue.valueCreationDate;

        const creatorInfo = this.user
            ? '\n Value creator: ' +
              this.user?.givenName +
              ' ' +
              this.user?.familyName
            : '';

        return creationDate + creatorInfo;
    }

    /**
     * react when a standoff link in a text has received a click event.
     *
     * @param resIri the Iri of the resource the standoff link refers to.
     */
    standoffLinkClicked(resIri: string): void {
        // find the corresponding standoff link value
        const referredResStandoffLinkVal: ReadLinkValue[] =
            this._getStandoffLinkValueForResource(resIri);

        // only emit an event if the corresponding standoff link value could be found
        if (referredResStandoffLinkVal.length === 1) {
            this.referredResourceClicked.emit(referredResStandoffLinkVal[0]);
        }
    }

    /**
     * react when a standoff link in a text has received a hover event.
     *
     * @param resIri the Iri of the resource the standoff link refers to.
     */
    standoffLinkHovered(resIri: string): void {
        // find the corresponding standoff link value
        const referredResStandoffLinkVal: ReadLinkValue[] =
            this._getStandoffLinkValueForResource(resIri);

        // only emit an event if the corresponding standoff link value could be found
        if (referredResStandoffLinkVal.length === 1) {
            this.referredResourceHovered.emit(referredResStandoffLinkVal[0]);
        }
    }

    /**
     * show the form components and CRUD buttons to update an existing value or add a new value.
     */
    activateEditMode() {
        this.editModeActive = true;
        this.valueHovered = false;
        this.mode = 'update';

        // hide comment toggle button while in edit mode
        this.checkCommentToggleVisibility();

        // hide read mode comment when switching to edit mode
        this.displayValueComponent.shouldShowComment = false;
    }

    /**
     * save a new version of an existing property value.
     */
    saveEditValue() {
        // hide the CRUD buttons
        this.editModeActive = false;
        this.showActionBubble = false;

        // show the progress indicator
        this.submittingValue = true;

        const updatedVal = this.displayValueComponent.getUpdatedValue();

        if (updatedVal instanceof UpdateValue) {
            const updateRes = new UpdateResource();
            updateRes.id = this.parentResource.id;
            updateRes.type = this.parentResource.type;
            updateRes.property = this.displayValue.property;
            updateRes.value = updatedVal;
            this._dspApiConnection.v2.values
                .updateValue(updateRes as UpdateResource<UpdateValue>)
                .pipe(
                    mergeMap((res: WriteValueResponse) =>
                        this._dspApiConnection.v2.values.getValue(
                            this.parentResource.id,
                            res.uuid
                        )
                    )
                )
                .subscribe(
                    (res2: ReadResource) => {
                        this._valueOperationEventService.emit(
                            new EmitEvent(
                                Events.ValueUpdated,
                                new UpdatedEventValues(
                                    this.displayValue,
                                    res2.getValues(
                                        this.displayValue.property
                                    )[0]
                                )
                            )
                        );

                        this.displayValue = res2.getValues(
                            this.displayValue.property
                        )[0];
                        this.mode = 'read';

                        // hide comment once back in read mode
                        this.displayValueComponent.updateCommentVisibility();

                        // check if comment toggle button should be shown
                        this.checkCommentToggleVisibility();

                        // hide the progress indicator
                        this.submittingValue = false;
                    },
                    (error: ApiResponseError) => {
                        // error handling
                        this.editModeActive = true;

                        // hide the progress indicator
                        this.submittingValue = false;

                        switch (error.status) {
                            case 400:
                                this.displayValueComponent.valueFormControl.setErrors(
                                    { duplicateValue: true }
                                );
                                break;
                            default:
                                console.log(
                                    'There was an error processing your request. Details: ',
                                    error
                                );
                                break;
                        }
                    }
                );
        } else {
            console.error('invalid value');

            // hide the progress indicator
            this.submittingValue = false;
        }
    }

    /**
     * open a confirmation dialog box to ensure the user would like to complete the action.
     */
    openDialog() {
        const dialogData = new ConfirmationDialogData();
        dialogData.value = this.displayValue;
        dialogData.buttonTextOk = 'Yes, delete the value';
        dialogData.buttonTextCancel = 'No, keep the value';

        const dialogRef = this._dialog.open<
            ConfirmationDialogComponent,
            ConfirmationDialogData
        >(ConfirmationDialogComponent, { data: dialogData });

        dialogRef
            .afterClosed()
            .subscribe((payload: ConfirmationDialogValueDeletionPayload) => {
                if (payload && payload.confirmed) {
                    this.deleteValue(payload.deletionComment);
                }
            });
    }

    /**
     * delete a value from a property.
     * Emits an event that can be listened to.
     */
    deleteValue(comment?: string) {
        const deleteVal = new DeleteValue();
        deleteVal.id = this.displayValue.id;
        deleteVal.type = this.displayValue.type;
        deleteVal.deleteComment = comment;

        const updateRes = new UpdateResource();
        updateRes.type = this.parentResource.type;
        updateRes.id = this.parentResource.id;
        updateRes.property = this.displayValue.property;
        updateRes.value = deleteVal;

        this._dspApiConnection.v2.values
            .deleteValue(updateRes as UpdateResource<DeleteValue>)
            .pipe(
                mergeMap((res: DeleteValueResponse) => {
                    // emit a ValueDeleted event to the listeners in resource-view component to trigger an update of the UI
                    this._valueOperationEventService.emit(
                        new EmitEvent(
                            Events.ValueDeleted,
                            new DeletedEventValue(deleteVal)
                        )
                    );
                    return res.result;
                })
            )
            .subscribe();
    }

    /**
     * hide the form components and CRUD buttons and show the value in read mode.
     */
    cancelEditValue() {
        this.editModeActive = false;
        this.showActionBubble = false;
        this.mode = 'read';

        // hide comment once back in read mode
        this.displayValueComponent.updateCommentVisibility();

        // check if comment toggle button should be shown
        this.checkCommentToggleVisibility();
    }

    /**
     * show or hide the comment.
     */
    toggleComment() {
        this.displayValueComponent.toggleCommentVisibility();
    }

    /**
     * check if the comment toggle button should be shown.
     * Only show the comment toggle button if user is in READ mode and a comment exists for the value.
     */
    checkCommentToggleVisibility() {
        this.shouldShowCommentToggle =
            this.mode === 'read' &&
            this.displayValue.valueHasComment !== '' &&
            this.displayValue.valueHasComment !== undefined;
    }

    /**
     * show CRUD buttons and add 'hover' class to the element only if editModeActive is false
     */
    mouseEnter() {
        this.showActionBubble = true;
        if (!this.editModeActive) {
            this.valueHovered = true;
        }
    }

    /**
     * hide CRUD buttons and remove the 'hightlighted' class from the element
     */
    mouseLeave() {
        this.showActionBubble = false;
        this.valueHovered = false;
    }

    /**
     * given a uuid of a value, highlights the corresponding value
     * @param uuid uuid of the value
     * @returns true if the provided uuid matches the uuid of the displayValue and edit mode is not active, false otherwise
     */
    shouldHighlightValue(uuid: string): boolean {
        if (
            uuid !== undefined &&
            uuid === this.displayValue.uuid &&
            !this.editModeActive
        ) {
            return true;
        }
        return false;
    }

    /**
     * given a resource Iri, finds the corresponding standoff link value.
     * Returns an empty array if the standoff link cannot be found.
     *
     * @param resIri the Iri of the resource.
     */
    private _getStandoffLinkValueForResource(resIri: string): ReadLinkValue[] {
        // find the PropertyInfoValues for the standoff link value
        const standoffLinkPropInfoVals: PropertyInfoValues[] =
            this.propArray.filter(
                (resPropInfoVal) =>
                    resPropInfoVal.propDef.id ===
                    Constants.HasStandoffLinkToValue
            );

        if (standoffLinkPropInfoVals.length === 1) {
            // find the corresponding standoff link value
            const referredResStandoffLinkVal: ReadValue[] =
                standoffLinkPropInfoVals[0].values.filter(
                    (standoffLinkVal: ReadValue) =>
                        standoffLinkVal instanceof ReadLinkValue &&
                        (standoffLinkVal as ReadLinkValue).linkedResourceIri ===
                            resIri
                );

            // if no corresponding standoff link value was found,
            // this array is empty
            return referredResStandoffLinkVal as ReadLinkValue[];
        } else {
            // this should actually never happen
            // because all resource types have a cardinality for a standoff link value
            return [];
        }
    }
}
