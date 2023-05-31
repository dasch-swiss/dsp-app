import {
    Component,
    EventEmitter,
    Inject,
    Input,
    OnInit,
    Output,
} from '@angular/core';
import {
    UntypedFormBuilder,
    UntypedFormControl,
    UntypedFormGroup,
    Validators,
} from '@angular/forms';
import {
    ApiResponseError,
    CanDoResponse,
    Cardinality,
    ClassDefinition,
    Constants,
    CreateResourceProperty,
    DeleteResourcePropertyComment,
    IHasProperty,
    KnoraApiConnection,
    ListNodeInfo,
    PropertyDefinition,
    ReadOntology,
    ResourceClassDefinitionWithAllLanguages,
    ResourcePropertyDefinitionWithAllLanguages,
    StringLiteral,
    UpdateOntology,
    UpdateResourceClassCardinality,
    UpdateResourcePropertyComment,
    UpdateResourcePropertyGuiElement,
    UpdateResourcePropertyLabel,
} from '@dasch-swiss/dsp-js';
import { CacheService } from '@dsp-app/src/app/main/cache/cache.service';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { existingNamesValidator } from '@dsp-app/src/app/main/directive/existing-name/existing-name.directive';
import { ErrorHandlerService } from '@dsp-app/src/app/main/services/error-handler.service';
import { SortingService } from '@dsp-app/src/app/main/services/sorting.service';
import { CustomRegex } from '@dsp-app/src/app/workspace/resource/values/custom-regex';
import { AutocompleteItem } from '@dsp-app/src/app/workspace/search/advanced-search/resource-and-property-selection/search-select-property/specify-property-value/operator';
import {
    DefaultProperties,
    DefaultProperty,
    PropertyCategory,
    PropertyInfoObject,
} from '../default-data/default-properties';
import { OntologyService } from '../ontology.service';
import { GuiCardinality } from '@dsp-app/src/app/project/ontology/resource-class-info/resource-class-property-info/resource-class-property-info.component';
import { PropToDisplay } from '../resource-class-info/resource-class-info.component';
import { NotificationService } from '@dsp-app/src/app/main/services/notification.service';

export type EditMode =
    | 'createProperty'
    | 'editProperty'
    | 'assignExistingProperty'
    | 'assignNewProperty'
    | 'changeCardinalities';

export interface ClassToSelect {
    ontologyId: string;
    ontologyLabel: string;
    classes: ClassDefinition[];
}

@Component({
    selector: 'app-property-form',
    templateUrl: './property-form.component.html',
    styleUrls: ['./property-form.component.scss'],
})
export class PropertyFormComponent implements OnInit {
    /**
     * propertyInfo contains default property type information
     * and in case of 'edit' mode also the ResourcePropertyDefintion
     */
    @Input() propertyInfo: PropertyInfoObject;

    /**
     * iri of resClassIri; will be used to set cardinality
     */
    @Input() resClassIri?: string; // the classes iri to which a property can be assigned

    @Input() changeCardinalities?: boolean; // whether only the cardinalities should be changed or a property

    @Input() currentCardinality?: Cardinality; // the currently active cardinality

    @Input() targetGuiCardinality?: GuiCardinality; // the cardinality which is requested to be set

    @Input() classProperties?: PropToDisplay[]; // the properties of a resource class. Needed for changing a cardinality
    /**
     * position of property in case of cardinality update
     */
    @Input() guiOrder?: number = 0;

    /**
     * output closeDialog of property form component to update parent component
     */
    @Output() closeDialog: EventEmitter<any> = new EventEmitter<any>();

    editMode: EditMode;

    /**
     * form group, errors and validation messages
     */
    propertyForm: UntypedFormGroup;

    formErrors = {
        name: '',
        label: '',
        guiAttr: '',
    };

    validationMessages = {
        name: {
            required: 'Name is required.',
            existingName:
                'This name is already taken. Please choose another one.',
            pattern:
                "Name shouldn't start with a number or v + number and spaces or special characters (except dash, dot and underscore) are not allowed.",
        },
        label: {
            required: 'Label is required.',
        },
        guiAttr: {
            required: 'Gui attribute is required.',
        },
    };

    ontology: ReadOntology;
    lastModificationDate: string;

    // selection of default property types
    defaultProperties: PropertyCategory[] = DefaultProperties.data;

    // selection of possible property types in case of edit prop
    restrictedPropertyTypes: PropertyCategory[];

    unsupportedPropertyType = false;

    showGuiAttr = false;
    guiAttrIcon = 'tune';

    // list of project specific lists (TODO: probably we have to add default knora lists?!)
    lists: ListNodeInfo[];

    // resource classes in this ontology
    ontologyClasses: ClassToSelect[] = [];

    loading = false;
    submittingChange = false; // after submit
    error = false;

    labels: StringLiteral[] = [];
    labelsTouched: boolean;
    comments: StringLiteral[] = [];
    guiAttributes: string[] = [];

    // list of existing property names
    existingNames: [RegExp] = [
        new RegExp('anEmptyRegularExpressionWasntPossible'),
    ];

    dspConstants = Constants;

    // general for changing to a specific cardinality of an existing property
    canSetCardinality: boolean;
    canNotSetCardinalityReason = ''; // response from the api
    canNotSetCardinalityUiReason = {
        // default user readable reason
        detail: this.canNotSetCardinalityReason,
        hint: '',
    };
    canChangeCardinalityChecked = false;

    constructor(
        @Inject(DspApiConnectionToken)
        private _dspApiConnection: KnoraApiConnection,
        private _cache: CacheService,
        private _errorHandler: ErrorHandlerService,
        private _fb: UntypedFormBuilder,
        private _os: OntologyService,
        private _sortingService: SortingService,
        private _notification: NotificationService
    ) {}

    ngOnInit() {
        this.loading = true;
        this.setEditMode();

        // set various lists to select from
        this._cache.get('currentOntology').subscribe(
            (response: ReadOntology) => {
                this.ontology = response;
                this.lastModificationDate = response.lastModificationDate;

                const resourceProperties = response.getAllPropertyDefinitions();

                // set list of all existing resource property names to avoid same name twice
                resourceProperties.forEach((resProp: PropertyDefinition) => {
                    const name = this._os.getNameFromIri(resProp.id);
                    this.existingNames.push(
                        new RegExp('(?:^|W)' + name.toLowerCase() + '(?:$|W)')
                    );
                });

                // add all resource classes to the same list
                response
                    .getAllClassDefinitions()
                    .forEach((resClass: ClassDefinition) => {
                        const name = this._os.getNameFromIri(resClass.id);
                        this.existingNames.push(
                            new RegExp(
                                '(?:^|W)' + name.toLowerCase() + '(?:$|W)'
                            )
                        );
                    });
            },
            (error: ApiResponseError) => {
                this._errorHandler.showMessage(error);
            }
        );

        // a) in case of link value:
        // set list of resource classes from response; needed for linkValue
        this._cache.get('currentProjectOntologies').subscribe(
            (response: ReadOntology[]) => {
                // reset list of ontology classes
                this.ontologyClasses = [];
                response.forEach((onto) => {
                    const classDef = this._sortingService.keySortByAlphabetical(
                        onto.getAllClassDefinitions(),
                        'label'
                    );
                    if (classDef.length) {
                        const ontoClasses: ClassToSelect = {
                            ontologyId: onto.id,
                            ontologyLabel: onto.label,
                            classes: classDef,
                        };
                        this.ontologyClasses.push(ontoClasses);
                    }
                });
            },
            () => {} // don't log error to rollbar if 'currentProjectOntologies' does not exist in the cache
        );

        // b) in case of list value:
        // set list of lists; needed for listValue
        this._cache
            .get('currentOntologyLists')
            .subscribe((response: ListNodeInfo[]) => {
                this.lists = response;
            });

        this.buildForm();

        if (
            this.editMode === 'assignExistingProperty' ||
            this.editMode === 'assignNewProperty'
        ) {
            // assigning a property to a class
            this.canEnableRequiredToggle();
        }

        if (this.editMode === 'changeCardinalities') {
            // request for changing cardinalities
            this.canChangeCardinality(this.targetGuiCardinality);
        }
    }

    buildForm() {
        let disablePropType = true;

        // if property definition exists
        // we are in edit mode: prepare form to edit label and/or comment
        // and to edit gui element (which is part of property type)
        if (this.propertyInfo.propDef) {
            this.labels = this.propertyInfo.propDef.labels;
            this.comments = this.propertyInfo.propDef.comments;
            this.guiAttributes = this.propertyInfo.propDef.guiAttributes;

            // prepare list of restricted property types
            this.restrictedPropertyTypes = [
                {
                    group: this.propertyInfo.propType.group,
                    elements: [],
                },
            ];

            // filter property types by group
            const restrictedElements: DefaultProperty[] =
                this.filterPropertyTypesByGroup(
                    this.propertyInfo.propType.group
                );

            if (restrictedElements.length) {
                // slice array
                // this slice value will be kept
                // because there was the idea to shorten the array of restricted elements
                // in case e.g. richtext can't be changed to simple text, then we shouldn't list the simple text item
                const slice = 0;

                // there's only the object type "text", where we can change the gui element;
                disablePropType =
                    this.propertyInfo.propType.objectType !==
                    Constants.TextValue;

                this.restrictedPropertyTypes[0].elements =
                    restrictedElements.slice(slice);
            } else {
                // case of unsupported property type
                this.restrictedPropertyTypes[0].elements.push(
                    DefaultProperties.unsupported
                );
                this.unsupportedPropertyType = true;
            }
        } else {
            this.restrictedPropertyTypes = this.defaultProperties;
        }

        this.propertyForm = this._fb.group({
            name: new UntypedFormControl(
                {
                    value: this.propertyInfo.propDef
                        ? this._os.getNameFromIri(this.propertyInfo.propDef.id)
                        : '',
                    disabled: this.propertyInfo.propDef,
                },
                [
                    Validators.required,
                    existingNamesValidator(this.existingNames),
                    Validators.pattern(CustomRegex.ID_NAME_REGEX),
                ]
            ),
            propType: new UntypedFormControl({
                value: this.propertyInfo.propType,
                disabled: disablePropType || this.resClassIri,
            }),
            guiAttr: new UntypedFormControl({
                value: this.guiAttributes,
            }),
            multiple: new UntypedFormControl({
                value: this._os.getCardinalityGuiValues(this.currentCardinality)
                    .multiple,
                disabled:
                    this.propertyInfo.propType.objectType ===
                    Constants.BooleanValue,
            }),
            required: new UntypedFormControl({
                value: this._os.getCardinalityGuiValues(this.currentCardinality)
                    .required,
                disabled: true, // default; will be reset if possible
            }),
        });

        this.updateAttributeField(this.propertyInfo.propType);

        this.propertyForm.valueChanges.subscribe(() => this.onValueChanged());
    }

    /**
     * this method is for the form error handling
     */
    onValueChanged() {
        if (!this.propertyForm) {
            return;
        }

        Object.keys(this.formErrors).map((field) => {
            this.formErrors[field] = '';
            const control = this.propertyForm.get(field);
            if (control && control.dirty && !control.valid) {
                const messages = this.validationMessages[field];
                Object.keys(control.errors).map((key) => {
                    this.formErrors[field] += messages[key] + ' ';
                });
            }
        });
    }

    handleData(data: StringLiteral[], type: 'label' | 'comment') {
        switch (type) {
            case 'label':
                this.labels = data;
                const messages = this.validationMessages[type];
                this.formErrors[type] = '';

                if (this.labelsTouched && !this.labels.length) {
                    this.formErrors[type] = messages['required'];
                }
                break;

            case 'comment':
                this.comments = data;
                break;
        }
    }

    /**
     * filter a list while typing in auto complete input field
     * @param list List of options
     * @param label Value to filter by
     * @returns Filtered list of options
     */
    filter(list: AutocompleteItem[], label: string) {
        return list.filter((prop) =>
            prop.label?.toLowerCase().includes(label.toLowerCase())
        );
    }

    /**
     * filters property types by group; it's used
     * in case of editing a property to restrict
     * the list of property types and elements
     * @param group
     * @returns an array of elements
     */
    filterPropertyTypesByGroup(group: string): DefaultProperty[] {
        const groups: PropertyCategory[] = this.defaultProperties.filter(
            (item) => item.group === group
        );

        return groups.length ? groups[0].elements : [];
    }

    updateAttributeField(type: DefaultProperty) {
        // reset value of guiAttr
        this.propertyForm.controls['guiAttr'].setValue(undefined);

        // set gui attribute value depending on gui element and existing property (edit mode)
        if (this.propertyInfo.propDef) {
            // the gui attribute can't be changed (at the moment?);
            // disable the input and set the validator as not required
            this.propertyForm.controls['guiAttr'].disable();

            if (type.objectType) {
                switch (type.objectType) {
                    // prop type is a list
                    case Constants.ListValue:
                        this.showGuiAttr = true;
                        // gui attribute value for lists looks as follows: hlist=<http://rdfh.ch/lists/00FF/73d0ec0302>
                        // get index from guiAttr array where value starts with hlist=
                        const i = this.guiAttributes.findIndex((element) =>
                            element.includes('hlist')
                        );
                        // find content between pointy brackets to get list iri
                        const re = /\<([^)]+)\>/;
                        const listIri = this.guiAttributes[i].match(re)[1];

                        this.propertyForm.controls['guiAttr'].setValue(listIri);
                        break;

                    // prop type is resource pointer: link to or part of
                    case Constants.LinkValue:
                        this.showGuiAttr = true;
                        this.propertyForm.controls['guiAttr'].setValue(
                            this.propertyInfo.propDef.objectType
                        );
                        break;

                    default:
                        this.showGuiAttr = false;
                }
            } else {
                this.showGuiAttr = false;
            }
        } else {
            // depending on the selected property type,
            // we have to define gui element attributes
            // e.g. iri of list or connected resource class
            switch (type.objectType) {
                case Constants.ListValue:
                case Constants.LinkValue:
                    this.showGuiAttr = true;
                    this.propertyForm.controls['guiAttr'].setValidators([
                        Validators.required,
                    ]);
                    // this.propertyForm.controls['guiAttr'].updateValueAndValidity();
                    this.propertyForm.updateValueAndValidity();
                    break;

                default:
                    this.showGuiAttr = false;
            }
        }

        this.loading = false;
    }

    /**
     * canEnableRequiredToggle: evaluate if the required toggle can be set for a newly assigned property of a class
     */
    canEnableRequiredToggle() {
        this._dspApiConnection.v2.onto
            .canReplaceCardinalityOfResourceClass(this.resClassIri)
            .subscribe(
                (response: CanDoResponse) => {
                    if (response.canDo) {
                        // enable the form
                        this.propertyForm.controls['required'].enable();
                    }
                },
                (error: ApiResponseError) => {
                    this._errorHandler.showMessage(error);
                }
            );
    }

    /**
     * canChangeCardinality: check if an update of the cardinalities is possible for a given GuiCardinality
     * @param targetGuiCardinality the GuiCardinality to which the current cardinality should be changed
     */
    canChangeCardinality(targetGuiCardinality: GuiCardinality) {
        // disable the change of booleans to multiple
        if (
            this.propertyInfo.propType.objectType === Constants.BooleanValue &&
            targetGuiCardinality.key === 'multiple' &&
            targetGuiCardinality.value === true
        ) {
            this.canSetCardinality = false;
            this.canChangeCardinalityChecked = true;
            return;
        }
        // check if cardinality can be changed
        const targetCardinality: Cardinality =
            this.getTargetCardinality(targetGuiCardinality);
        this._dspApiConnection.v2.onto
            .canReplaceCardinalityOfResourceClassWith(
                this.resClassIri,
                this.propertyInfo.propDef.id,
                targetCardinality
            )
            .subscribe(
                (response: CanDoResponse) => {
                    this.canSetCardinality = response.canDo;
                    if (!this.canSetCardinality) {
                        this.canNotSetCardinalityReason =
                            response.cannotDoReason;
                        this.canNotSetCardinalityUiReason =
                            this.getCanNotSetCardinalityUserReason();
                    }
                    this.canChangeCardinalityChecked = true;
                },
                (error: ApiResponseError) => {
                    this._errorHandler.showMessage(error);
                }
            );
    }

    /**
     * getTargetCardinality: create a Cardinality based on currentCardinality but updated by the desired target value
     * @param targetValue the value by which the current cardinality is updated
     * @return the equivalent cardinality enum
     */
    getTargetCardinality(targetValue: GuiCardinality): Cardinality {
        const currentCardinality = this._os.getCardinalityGuiValues(
            this.currentCardinality
        );
        const updatedCardinality = Object.assign(currentCardinality, {
            [targetValue.key]: targetValue.value,
        });
        return this._os.translateCardinality(
            updatedCardinality.multiple,
            updatedCardinality.required
        );
    }

    /**
     * submitData: handle submission for changed properties according to the current editMode/workflow.
     */
    submitData() {
        switch (this.editMode) {
            case 'createProperty':
                this.submitNewProperty();
                break;
            case 'editProperty':
                this.submitChangedProperty();
                break;
            case 'assignNewProperty':
                this.createNewPropertyAndAssignToClass();
                break;
            case 'assignExistingProperty':
                this.assignProperty(this.propertyInfo.propDef);
                break;
            case 'changeCardinalities':
                this.submitCardinalitiesChange();
                break;
        }
    }

    /**
     * submitData: handle submission for changed properties.
     */
    submitChangedProperty() {
        // label
        const onto4Label = this.getUpdateOntolgyForPropertyLabel();
        // comment
        const onto4Comment = this.getUpdateOntologyForPropertyComment();

        this._dspApiConnection.v2.onto
            .updateResourceProperty(onto4Label)
            .subscribe(
                (
                    propertyLabelResponse: ResourcePropertyDefinitionWithAllLanguages
                ) => {
                    this.lastModificationDate =
                        propertyLabelResponse.lastModificationDate;
                    onto4Comment.lastModificationDate =
                        this.lastModificationDate;

                    if (onto4Comment.entity.comments.length) {
                        // if the comments array is not empty, send a request to update the comments
                        this._dspApiConnection.v2.onto
                            .updateResourceProperty(onto4Comment)
                            .subscribe(
                                (
                                    propertyCommentResponse: ResourcePropertyDefinitionWithAllLanguages
                                ) => {
                                    this.lastModificationDate =
                                        propertyCommentResponse.lastModificationDate;

                                    // if property type is supported and is of type TextValue and the guiElement is different from its initial value, call replaceGuiElement() to update the guiElement
                                    // this only works for the TextValue object type currently
                                    // https://docs.dasch.swiss/latest/DSP-API/03-apis/api-v2/ontology-information/#changing-the-gui-element-and-gui-attributes-of-a-property
                                    if (
                                        !this.unsupportedPropertyType &&
                                        this.propertyInfo.propDef.objectType ===
                                            Constants.TextValue &&
                                        this.propertyInfo.propDef.guiElement !==
                                            this.propertyForm.controls[
                                                'propType'
                                            ].value.guiEle
                                    ) {
                                        this.replaceGuiElement();
                                    } else {
                                        this.onSuccess();
                                    }
                                },
                                (error: ApiResponseError) => {
                                    this.onError(error);
                                }
                            );
                    } else {
                        // if the comments array is empty, send a request to remove the comments
                        const deleteResourcePropertyComment =
                            new DeleteResourcePropertyComment();
                        deleteResourcePropertyComment.id =
                            this.propertyInfo.propDef.id;
                        deleteResourcePropertyComment.lastModificationDate =
                            this.lastModificationDate;

                        this._dspApiConnection.v2.onto
                            .deleteResourcePropertyComment(
                                deleteResourcePropertyComment
                            )
                            .subscribe(
                                (
                                    deleteCommentResponse: ResourcePropertyDefinitionWithAllLanguages
                                ) => {
                                    this.lastModificationDate =
                                        deleteCommentResponse.lastModificationDate;

                                    // if property type is supported and is of type TextValue and the guiElement is different from its initial value, call replaceGuiElement() to update the guiElement
                                    // this only works for the TextValue object type currently
                                    // https://docs.dasch.swiss/latest/DSP-API/03-apis/api-v2/ontology-information/#changing-the-gui-element-and-gui-attributes-of-a-property
                                    if (
                                        !this.unsupportedPropertyType &&
                                        this.propertyInfo.propDef.objectType ===
                                            Constants.TextValue &&
                                        this.propertyInfo.propDef.guiElement !==
                                            this.propertyForm.controls[
                                                'propType'
                                            ].value.guiEle
                                    ) {
                                        this.replaceGuiElement();
                                    } else {
                                        this.onSuccess();
                                    }
                                },
                                (error: ApiResponseError) => {
                                    this.onError(error);
                                }
                            );
                    }

                    this.ontology.lastModificationDate =
                        this.lastModificationDate;
                    this._cache.set('currentOntology', this.ontology);
                },
                (error: ApiResponseError) => {
                    this.error = true;
                    this.loading = false;
                    this._errorHandler.showMessage(error);
                }
            );
    }

    createNewPropertyAndAssignToClass() {
        const onto = this.getOntologyForNewProperty();
        // create new property and assign it to the class
        this._dspApiConnection.v2.onto.createResourceProperty(onto).subscribe(
            (response: ResourcePropertyDefinitionWithAllLanguages) => {
                this.lastModificationDate = response.lastModificationDate;
                this.assignProperty(response);
            },
            (error: ApiResponseError) => {
                this.error = true;
                this.loading = false;
                this._errorHandler.showMessage(error);
            }
        );
    }

    /**
     * submitNewProperty: handle submission for newly added properties
     */
    submitNewProperty() {
        const onto = this.getOntologyForNewProperty();

        this._dspApiConnection.v2.onto.createResourceProperty(onto).subscribe(
            (response: ResourcePropertyDefinitionWithAllLanguages) => {
                this.lastModificationDate = response.lastModificationDate;
                this.onSuccess();
            },
            (error: ApiResponseError) => {
                this.onError(error);
            }
        );
    }

    getUpdateOntolgyForPropertyLabel(): UpdateOntology<UpdateResourcePropertyLabel> {
        const onto4Label = new UpdateOntology<UpdateResourcePropertyLabel>();
        onto4Label.id = this.ontology.id;
        onto4Label.lastModificationDate = this.lastModificationDate;

        const updateLabel = new UpdateResourcePropertyLabel();
        updateLabel.id = this.propertyInfo.propDef.id;
        updateLabel.labels = this.labels;
        onto4Label.entity = updateLabel;
        return onto4Label;
    }

    getUpdateOntologyForPropertyComment(): UpdateOntology<UpdateResourcePropertyComment> {
        const onto4Comment =
            new UpdateOntology<UpdateResourcePropertyComment>();
        onto4Comment.id = this.ontology.id;

        const updateComment = new UpdateResourcePropertyComment();
        updateComment.id = this.propertyInfo.propDef.id;
        updateComment.comments = this.comments;
        onto4Comment.entity = updateComment;

        return onto4Comment;
    }

    getOntologyForNewProperty(): UpdateOntology<CreateResourceProperty> {
        const onto = new UpdateOntology<CreateResourceProperty>();

        onto.id = this.ontology.id;
        onto.lastModificationDate = this.lastModificationDate;

        // prepare payload for property
        const newResProp = new CreateResourceProperty();
        newResProp.name = this.propertyForm.controls['name'].value;
        newResProp.label = this.labels;
        newResProp.comment = this.comments;

        const guiAttr = this.propertyForm.controls['guiAttr'].value;
        if (guiAttr) {
            newResProp.guiAttributes = this.setGuiAttribute(guiAttr);
        }
        newResProp.guiElement = this.propertyInfo.propType.guiEle;
        newResProp.subPropertyOf = [this.propertyInfo.propType.subPropOf];

        if (
            this.propertyInfo.propType.subPropOf === Constants.HasLinkTo ||
            this.propertyInfo.propType.subPropOf === Constants.IsPartOf
        ) {
            newResProp.objectType = guiAttr;
            newResProp.subjectType = this.resClassIri;
        } else {
            newResProp.objectType = this.propertyInfo.propType.objectType;
        }

        onto.entity = newResProp;
        return onto;
    }

    /**
     * submitCardinalitiesChange: create a transaction based on currentCardinality but updated by the desired
     * target cardinality set in the gui
     */
    submitCardinalitiesChange() {
        this.submittingChange = true;
        // get the ontology, the class and its properties
        const classUpdate =
            new UpdateOntology<UpdateResourceClassCardinality>();
        classUpdate.lastModificationDate = this.lastModificationDate;
        classUpdate.id = this.ontology.id;
        const changedClass = new UpdateResourceClassCardinality();
        changedClass.id = this.resClassIri;
        changedClass.cardinalities = this.classProperties;

        // get the property for replacing the cardinality
        const idx = changedClass.cardinalities.findIndex(
            (c) => c.propertyIndex === this.propertyInfo.propDef.id
        );
        if (idx === -1) {
            return;
        }
        // set the new cardinality
        changedClass.cardinalities[idx].cardinality = this.getTargetCardinality(
            this.targetGuiCardinality
        );

        classUpdate.entity = changedClass;
        this._dspApiConnection.v2.onto
            .replaceCardinalityOfResourceClass(classUpdate)
            .subscribe(
                (res: ResourceClassDefinitionWithAllLanguages) => {
                    this.lastModificationDate = res.lastModificationDate;
                    this.submittingChange = false;
                    this.onSuccess();
                },
                (error: ApiResponseError) => {
                    this.onError(error);
                    this.closeDialog.emit();
                }
            );
    }

    replaceGuiElement() {
        const onto4guiEle =
            new UpdateOntology<UpdateResourcePropertyGuiElement>();
        onto4guiEle.id = this.ontology.id;
        onto4guiEle.lastModificationDate = this.lastModificationDate;

        const updateGuiEle = new UpdateResourcePropertyGuiElement();
        updateGuiEle.id = this.propertyInfo.propDef.id;
        updateGuiEle.guiElement =
            this.propertyForm.controls['propType'].value.guiEle;

        const guiAttr = this.propertyForm.controls['guiAttr'].value;
        if (guiAttr) {
            updateGuiEle.guiAttributes = this.setGuiAttribute(guiAttr);
        }

        onto4guiEle.entity = updateGuiEle;

        this._dspApiConnection.v2.onto
            .replaceGuiElementOfProperty(onto4guiEle)
            .subscribe(
                (
                    guiEleResponse: ResourcePropertyDefinitionWithAllLanguages
                ) => {
                    this.lastModificationDate =
                        guiEleResponse.lastModificationDate;
                    this.onSuccess();
                },
                (error: ApiResponseError) => {
                    this.onError(error);
                }
            );
    }

    /**
     * assignProperty: assigning an existing property to the class
     */
    assignProperty(prop: ResourcePropertyDefinitionWithAllLanguages) {
        const onto = new UpdateOntology<UpdateResourceClassCardinality>();

        onto.lastModificationDate = this.lastModificationDate;

        onto.id = this.ontology.id;

        const addCard = new UpdateResourceClassCardinality();

        addCard.id = this.resClassIri;

        addCard.cardinalities = [];

        const propCard: IHasProperty = {
            propertyIndex: prop.id,
            cardinality: this._os.translateCardinality(
                this.propertyForm.value.multiple,
                this.propertyForm.value.required
            ),
            guiOrder: this.guiOrder, // add new property to the end of current list of properties
        };

        addCard.cardinalities.push(propCard);

        onto.entity = addCard;

        this._dspApiConnection.v2.onto
            .addCardinalityToResourceClass(onto)
            .subscribe(
                (res: ResourceClassDefinitionWithAllLanguages) => {
                    this.lastModificationDate = res.lastModificationDate;
                    this.onSuccess();
                },
                (error: ApiResponseError) => {
                    this.onError(error);
                }
            );
    }

    setGuiAttribute(guiAttr: string): string[] {
        let guiAttributes: string[];

        switch (this.propertyInfo.propType.guiEle) {
            case Constants.GuiColorPicker:
                guiAttributes = ['ncolors=' + guiAttr];
                break;
            case Constants.GuiList:
            case Constants.GuiPulldown:
            case Constants.GuiRadio:
                guiAttributes = ['hlist=<' + guiAttr + '>'];
                break;
            case Constants.GuiSimpleText:
                // --> TODO could have two guiAttr fields: size and maxlength
                // we suggest to use default value for size; we do not support this guiAttr in DSP-App
                guiAttributes = ['maxlength=' + guiAttr];
                break;
            case Constants.GuiSpinbox:
                // --> TODO could have two guiAttr fields: min and max
                guiAttributes = ['min=' + guiAttr, 'max=' + guiAttr];
                break;
            case Constants.GuiTextarea:
                // --> TODO could have four guiAttr fields: width, cols, rows, wrap
                // we suggest to use default values; we do not support this guiAttr in DSP-App
                guiAttributes = ['width=100%'];
                break;
        }

        return guiAttributes;
    }

    /**
     * getCanNotSetCardinalityUserReason: get the user readable reason why a cardinality can not be changed.
     */
    getCanNotSetCardinalityUserReason() {
        const reason = { detail: this.canNotSetCardinalityReason, hint: '' }; // default
        const classLabel = this.resClassIri.split('#')[1];
        const pLabel = this.propertyInfo.propDef.label;

        if (
            this.canNotSetCardinalityReason.includes(
                'is not included in the new cardinality'
            )
        ) {
            // data contradicting the change
            if (
                this.targetGuiCardinality.key === 'multiple' &&
                this.targetGuiCardinality.value === false
            ) {
                // there are instances which have that property multiple times and do not allow to set multiple to false
                reason.detail = `At least one ${classLabel} has multiple ${pLabel} properties in your data.`;
                reason.hint =
                    `In order to change the data model and set the property ${pLabel} from multiple to ` +
                    `single, every ${classLabel} must have only one ${pLabel} in the data.`;
            }
            if (
                this.targetGuiCardinality.key === 'required' &&
                this.targetGuiCardinality.value === true
            ) {
                // setting from multiple to single is not possible because there are instances which have that property
                // multiple times and do not allow to set multiple to false
                reason.detail = `At least one ${classLabel} does not have a ${pLabel} property in your data.`;
                reason.hint =
                    `In order to change the data model and set the property ${pLabel} to required ` +
                    `every ${classLabel} needs to have a ${pLabel} in the data.`;
            }
        }
        return reason;
    }

    /**
     * setEditMode: set the mode, i.e. the context in which a property is edited
     */
    setEditMode() {
        if (this.changeCardinalities) {
            this.editMode = 'changeCardinalities';
            return;
        }
        if (this.resClassIri && !!this.propertyInfo.propDef) {
            // in context of class and with an existing property
            this.editMode = 'assignExistingProperty';
            return;
        }
        if (this.resClassIri && !this.propertyInfo.propDef) {
            // in context of class and without an existing property
            this.editMode = 'assignNewProperty';
            return;
        }
        if (!this.resClassIri && !this.propertyInfo.propDef) {
            // in properties context and without an existing property
            this.editMode = 'createProperty';
            return;
        }
        if (!this.resClassIri && !!this.propertyInfo.propDef) {
            // in properties context and with an existing property
            this.editMode = 'editProperty';
            return;
        }
    }

    /**
     * onSuccess: handle successful operations: Display a notification if
     * necessary and close the dialog
     */
    onSuccess() {
        this.loading = false;
        const msg = this.getNotificationMsg();
        if (msg) {
            this._notification.openSnackBar(msg);
        }
        this.closeDialog.emit();
    }

    /**
     * onError: handle erratic operations
     */
    onError(err) {
        this.error = true;
        this.loading = false;
        this._errorHandler.showMessage(err);
    }

    /**
     * getNotificationMsg: return the message string depending on the editMode
     */
    getNotificationMsg(): string {
        let msg = '';
        if (this.editMode === 'editProperty') {
            msg = `Successfully updated ${this.propertyInfo.propDef.label}.`;
        }
        if (this.editMode === 'changeCardinalities') {
            msg = `Successfully changed the cardinalities of
                ${this.propertyInfo.propDef.label} on class
                ${this.resClassIri}`;
        }
        return msg;
    }
}
