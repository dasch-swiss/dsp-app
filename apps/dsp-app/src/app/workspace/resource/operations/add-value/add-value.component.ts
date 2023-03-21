import {
    AfterViewInit,
    Component,
    EventEmitter,
    Inject,
    Input,
    OnInit,
    Output,
    ViewChild,
} from '@angular/core';
import {
    ApiResponseError,
    Constants,
    CreateValue,
    KnoraApiConnection,
    ReadResource,
    ResourcePropertyDefinition,
    UpdateResource,
    WriteValueResponse,
} from '@dasch-swiss/dsp-js';
import { mergeMap } from 'rxjs/operators';
import { DspApiConnectionToken } from '@dsp-app/src/app/main/declarations/dsp-api-tokens';
import { BaseValueDirective } from '@dsp-app/src/app/main/directive/base-value.directive';
import {
    AddedEventValue,
    EmitEvent,
    Events,
    ValueOperationEventService,
} from '../../services/value-operation-event.service';
import { ValueService } from '../../services/value.service';

@Component({
    selector: 'app-add-value',
    templateUrl: './add-value.component.html',
    styleUrls: ['./add-value.component.scss'],
})
export class AddValueComponent implements OnInit, AfterViewInit {
    @ViewChild('createVal') createValueComponent: BaseValueDirective;

    @Input() resourcePropertyDefinition: ResourcePropertyDefinition;

    @Input() parentResource: ReadResource;

    @Input() configuration?: object;

    @Output() operationCancelled = new EventEmitter<any>();

    constants = Constants;

    mode: 'read' | 'update' | 'create' | 'search';

    createModeActive = false;

    submittingValue = false;

    // 0 will display a loading animation
    progressIndicatorStatus = 0;

    // type of given displayValue
    // or knora-api-js-lib class representing the value
    valueTypeOrClass: string;

    // gui element in case of textValue
    textValueGuiEle: 'simpleText' | 'textArea' | 'richText';

    ontoIri: string;

    constructor(
        @Inject(DspApiConnectionToken)
        private _dspApiConnection: KnoraApiConnection,
        private _valueOperationEventService: ValueOperationEventService,
        private _valueService: ValueService
    ) {}

    ngOnInit() {
        this.ontoIri = this.parentResource.type.split('#')[0];
        this.mode = 'create';

        // since simple text values and rich text values share the same object type 'TextValue',
        // we need to use the ValueTypeService in order to assign it the correct object type for the ngSwitch in the template
        if (
            this.resourcePropertyDefinition.objectType ===
                Constants.TextValue ||
            this.resourcePropertyDefinition.objectType ===
                'ReadTextValueAsString'
        ) {
            this.resourcePropertyDefinition.objectType =
                this._valueService.getTextValueClass(
                    this.resourcePropertyDefinition
                );

            if (
                this.resourcePropertyDefinition.objectType ===
                'ReadTextValueAsString'
            ) {
                // handle the correct gui element depending on guiEle property
                this.textValueGuiEle = this._valueService.getTextValueGuiEle(
                    this.resourcePropertyDefinition.guiElement
                );
            }
        }
    }

    // wait to show the save/cancel buttons until the form is initialized so that the template checks using the form's validity work
    ngAfterViewInit() {
        setTimeout(() => {
            this.createModeActive = true;
        }, 0);
    }

    /**
     * add a new value to an existing property of a resource.
     */
    saveAddValue() {
        if (this.parentResource) {
            // hide the CRUD buttons
            this.createModeActive = false;

            // show the progress indicator
            this.submittingValue = true;

            // get a new CreateValue from the base class and grab the values from the form
            const createVal = this.createValueComponent.getNewValue();

            if (createVal instanceof CreateValue) {
                // create a new UpdateResource with the same properties as the parent resource
                const updateRes = new UpdateResource();
                updateRes.id = this.parentResource.id;
                updateRes.type = this.parentResource.type;
                updateRes.property = this.resourcePropertyDefinition.id;

                // assign the new value to the UpdateResource value
                updateRes.value = createVal;

                this._dspApiConnection.v2.values
                    .createValue(updateRes as UpdateResource<CreateValue>)
                    .pipe(
                        mergeMap((res: WriteValueResponse) =>
                            // if successful, get the newly created value
                            this._dspApiConnection.v2.values.getValue(
                                this.parentResource.id,
                                res.uuid
                            )
                        )
                    )
                    .subscribe(
                        (res2: ReadResource) => {
                            // emit a ValueAdded event to the listeners in:
                            // property-view component to hide the add value form
                            // resource-view component to trigger a refresh of the resource
                            this._valueOperationEventService.emit(
                                new EmitEvent(
                                    Events.ValueAdded,
                                    new AddedEventValue(
                                        res2.getValues(updateRes.property)[0]
                                    )
                                )
                            );

                            // hide the progress indicator
                            this.submittingValue = false;
                        },
                        (error: ApiResponseError) => {
                            // hide the progress indicator
                            this.submittingValue = false;

                            // show the CRUD buttons
                            this.createModeActive = true;

                            switch (error.status) {
                                case 400:
                                    this.createValueComponent.valueFormControl.setErrors(
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
                console.error(
                    'Expected instance of CreateVal, received: ',
                    createVal
                );

                // hide the progress indicator
                this.submittingValue = false;
            }
        } else {
            console.error('A ReadResource is required to save a new value.');
        }
    }

    /**
     * cancel the add value operation and hide the add value form.
     */
    cancelAddValue() {
        // show the CRUD buttons
        this.createModeActive = false;

        // emit an event to trigger hideAddValueForm() in property-view component to hide the create value form
        this.operationCancelled.emit();
    }
}
