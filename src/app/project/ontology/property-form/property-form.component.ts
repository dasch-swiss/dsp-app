import { Component, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import {
    ApiResponseError,
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
    UpdateResourcePropertyLabel
} from '@dasch-swiss/dsp-js';
import { CacheService } from 'src/app/main/cache/cache.service';
import { DspApiConnectionToken } from 'src/app/main/declarations/dsp-api-tokens';
import { existingNamesValidator } from 'src/app/main/directive/existing-name/existing-name.directive';
import { ErrorHandlerService } from 'src/app/main/services/error-handler.service';
import { SortingService } from 'src/app/main/services/sorting.service';
import { CustomRegex } from 'src/app/workspace/resource/values/custom-regex';
import { AutocompleteItem } from 'src/app/workspace/search/advanced-search/resource-and-property-selection/search-select-property/specify-property-value/operator';
import { DefaultProperties, DefaultProperty, PropertyCategory, PropertyInfoObject } from '../default-data/default-properties';
import { OntologyService } from '../ontology.service';

export interface ClassToSelect {
    ontologyId: string;
    ontologyLabel: string;
    classes: ClassDefinition[];
}

@Component({
    selector: 'app-property-form',
    templateUrl: './property-form.component.html',
    styleUrls: ['./property-form.component.scss']
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
    @Input() resClassIri?: string;

    /**
     * info if the cardinality can be fully set or not
     * (depending on canReplaceCardinalityOfResourceClass request)
     */
    @Input() canSetFullCardinality?: boolean = true;

    /**
     * position of property in case of cardinality update
     */
    @Input() guiOrder?: number = 0;

    /**
     * output closeDialog of property form component to update parent component
     */
    @Output() closeDialog: EventEmitter<any> = new EventEmitter<any>();

    /**
     * form group, errors and validation messages
     */
    propertyForm: FormGroup;

    formErrors = {
        'name': '',
        'label': '',
        'guiAttr': ''
    };

    validationMessages = {
        'name': {
            'required': 'Name is required.',
            'existingName': 'This name is already taken. Please choose another one.',
            'pattern': 'Name shouldn\'t start with a number or v + number and spaces or special characters (except dash, dot and underscore) are not allowed.'
        },
        'label': {
            'required': 'Label is required.',
        },
        'guiAttr': {
            'required': 'Gui attribute is required.',
        }
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

    error = false;

    labels: StringLiteral[] = [];
    labelsTouched: boolean;
    comments: StringLiteral[] = [];
    guiAttributes: string[] = [];

    // list of existing property names
    existingNames: [RegExp] = [
        new RegExp('anEmptyRegularExpressionWasntPossible')
    ];

    dspConstants = Constants;

    constructor(
        @Inject(DspApiConnectionToken) private _dspApiConnection: KnoraApiConnection,
        private _cache: CacheService,
        private _errorHandler: ErrorHandlerService,
        private _fb: FormBuilder,
        private _os: OntologyService,
        private _sortingService: SortingService
    ) { }

    ngOnInit() {

        this.loading = true;

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
                response.getAllClassDefinitions().forEach((resClass: ClassDefinition) => {
                    const name = this._os.getNameFromIri(resClass.id);
                    this.existingNames.push(
                        new RegExp('(?:^|W)' + name.toLowerCase() + '(?:$|W)')
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
                response.forEach(onto => {
                    const classDef = this._sortingService.keySortByAlphabetical(onto.getAllClassDefinitions(), 'label');
                    if (classDef.length) {
                        const ontoClasses: ClassToSelect = {
                            ontologyId: onto.id,
                            ontologyLabel: onto.label,
                            classes: classDef
                        };
                        this.ontologyClasses.push(ontoClasses);
                    }
                });
            },
            () => {} // don't log error to rollbar if 'currentProjectOntologies' does not exist in the cache
        );

        // b) in case of list value:
        // set list of lists; needed for listValue
        this._cache.get('currentOntologyLists').subscribe(
            (response: ListNodeInfo[]) => {
                this.lists = response;
            }
        );

        this.buildForm();

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
            this.restrictedPropertyTypes = [{
                group: this.propertyInfo.propType.group,
                elements: []
            }];

            // filter property types by group
            const restrictedElements: DefaultProperty[] = this.filterPropertyTypesByGroup(this.propertyInfo.propType.group);

            if (restrictedElements.length) {
                // slice array
                // this slice value will be kept
                // because there was the idea to shorten the array of restricted elements
                // in case e.g. richtext can't be changed to simple text, then we shouldn't list the simple text item
                const slice = 0;

                // there's only the object type "text", where we can change the gui element;
                disablePropType = (this.propertyInfo.propType.objectType !== Constants.TextValue);

                this.restrictedPropertyTypes[0].elements = restrictedElements.slice(slice);
            } else {
                // case of unsupported property type
                this.restrictedPropertyTypes[0].elements.push(DefaultProperties.unsupported);
                this.unsupportedPropertyType = true;
            }

        } else {
            this.restrictedPropertyTypes = this.defaultProperties;
        }

        this.propertyForm = this._fb.group({
            'name': new FormControl({
                value: (this.propertyInfo.propDef ? this._os.getNameFromIri(this.propertyInfo.propDef.id) : ''),
                disabled: this.propertyInfo.propDef
            }, [
                Validators.required,
                existingNamesValidator(this.existingNames),
                Validators.pattern(CustomRegex.ID_NAME_REGEX)
            ]),
            'propType': new FormControl({
                value: this.propertyInfo.propType,
                disabled: disablePropType || this.resClassIri
            }),
            'guiAttr': new FormControl({
                value: this.guiAttributes
            }),
            'multiple': new FormControl({
                value: '',  // --> TODO: will be set in update cardinality task
                disabled: this.propertyInfo.propType.objectType === Constants.BooleanValue
                // --> TODO: here we also have to check, if it can be updated (update cardinality task);
                // case updateCardinality: disabled if !canSetFullCardinality && multiple.value !== true
            }),
            'required': new FormControl({
                value: '',  // --> TODO: will be set in update cardinality task
                disabled: !this.canSetFullCardinality
            })
        });

        this.updateAttributeField(this.propertyInfo.propType);

        this.propertyForm.valueChanges
            .subscribe(data => this.onValueChanged(data));
    }

    /**
     * this method is for the form error handling
     *
     * @param data Data which changed.
     */
    onValueChanged(data?: any) {

        if (!this.propertyForm) {
            return;
        }

        Object.keys(this.formErrors).map(field => {
            this.formErrors[field] = '';
            const control = this.propertyForm.get(field);
            if (control && control.dirty && !control.valid) {
                const messages = this.validationMessages[field];
                Object.keys(control.errors).map(key => {
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
        return list.filter(prop =>
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
        const groups: PropertyCategory[] = this.defaultProperties.filter(item => item.group === group);

        return (groups.length ? groups[0].elements : []);
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
                        const i = this.guiAttributes.findIndex(element => element.includes('hlist'));
                        // find content between pointy brackets to get list iri
                        const re = /\<([^)]+)\>/;
                        const listIri = this.guiAttributes[i].match(re)[1];

                        this.propertyForm.controls['guiAttr'].setValue(listIri);
                        break;

                    // prop type is resource pointer: link to or part of
                    case Constants.LinkValue:
                        this.showGuiAttr = true;
                        this.propertyForm.controls['guiAttr'].setValue(this.propertyInfo.propDef.objectType);
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
                        Validators.required
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

    submitData() {
        this.loading = true;

        // the property exist already; update label, comment and/or gui element
        if (this.propertyInfo.propDef) {

            if (this.resClassIri) {
                // set cardinality with existing property in res class
                this.setCardinality(this.propertyInfo.propDef);
            } else {
                // edit property mode: update res property info (label and comment) or gui element and attribute

                // label
                const onto4Label = new UpdateOntology<UpdateResourcePropertyLabel>();
                onto4Label.id = this.ontology.id;
                onto4Label.lastModificationDate = this.lastModificationDate;

                const updateLabel = new UpdateResourcePropertyLabel();
                updateLabel.id = this.propertyInfo.propDef.id;
                updateLabel.labels = this.labels;
                onto4Label.entity = updateLabel;

                // comment
                const onto4Comment = new UpdateOntology<UpdateResourcePropertyComment>();
                onto4Comment.id = this.ontology.id;

                const updateComment = new UpdateResourcePropertyComment();
                updateComment.id = this.propertyInfo.propDef.id;
                updateComment.comments = this.comments;
                onto4Comment.entity = updateComment;

                this._dspApiConnection.v2.onto.updateResourceProperty(onto4Label).subscribe(
                    (propertyLabelResponse: ResourcePropertyDefinitionWithAllLanguages) => {
                        this.lastModificationDate = propertyLabelResponse.lastModificationDate;
                        onto4Comment.lastModificationDate = this.lastModificationDate;

                        if (updateComment.comments.length) { // if the comments array is not empty, send a request to update the comments
                            this._dspApiConnection.v2.onto.updateResourceProperty(onto4Comment).subscribe(
                                (propertyCommentResponse: ResourcePropertyDefinitionWithAllLanguages) => {
                                    this.lastModificationDate = propertyCommentResponse.lastModificationDate;

                                    // if property type is supported and is of type TextValue and the guiElement is different from its initial value, call replaceGuiElement() to update the guiElement
                                    // this only works for the TextValue object type currently
                                    // https://docs.dasch.swiss/latest/DSP-API/03-apis/api-v2/ontology-information/#changing-the-gui-element-and-gui-attributes-of-a-property
                                    if (!this.unsupportedPropertyType &&
                                        this.propertyInfo.propDef.objectType === Constants.TextValue &&
                                        this.propertyInfo.propDef.guiElement !== this.propertyForm.controls['propType'].value.guiEle) {
                                        this.replaceGuiElement();
                                    } else {
                                        this.loading = false;
                                        this.closeDialog.emit();
                                    }

                                },
                                (error: ApiResponseError) => {
                                    this.error = true;
                                    this.loading = false;
                                    this._errorHandler.showMessage(error);
                                }
                            );
                        } else { // if the comments array is empty, send a request to remove the comments
                            const deleteResourcePropertyComment = new DeleteResourcePropertyComment();
                            deleteResourcePropertyComment.id = this.propertyInfo.propDef.id;
                            deleteResourcePropertyComment.lastModificationDate = this.lastModificationDate;

                            this._dspApiConnection.v2.onto.deleteResourcePropertyComment(deleteResourcePropertyComment).subscribe(
                                (deleteCommentResponse: ResourcePropertyDefinitionWithAllLanguages) => {
                                    this.lastModificationDate = deleteCommentResponse.lastModificationDate;

                                    // if property type is supported and is of type TextValue and the guiElement is different from its initial value, call replaceGuiElement() to update the guiElement
                                    // this only works for the TextValue object type currently
                                    // https://docs.dasch.swiss/latest/DSP-API/03-apis/api-v2/ontology-information/#changing-the-gui-element-and-gui-attributes-of-a-property
                                    if (!this.unsupportedPropertyType &&
                                        this.propertyInfo.propDef.objectType === Constants.TextValue &&
                                        this.propertyInfo.propDef.guiElement !== this.propertyForm.controls['propType'].value.guiEle) {
                                        this.replaceGuiElement();
                                    } else {
                                        this.loading = false;
                                        this.closeDialog.emit();
                                    }
                                },
                                (error: ApiResponseError) => {
                                    this.error = true;
                                    this.loading = false;
                                    this._errorHandler.showMessage(error);
                                }
                            );
                        }

                        this.ontology.lastModificationDate = this.lastModificationDate;
                        this._cache.set('currentOntology', this.ontology);
                    },
                    (error: ApiResponseError) => {
                        this.error = true;
                        this.loading = false;
                        this._errorHandler.showMessage(error);
                    }
                );
            }
        } else {
            // create mode: new property incl. gui type and attribute
            // submit property
            // set resource property name / id: randomized string
            // const uniquePropName: string = this._os.setUniqueName(this.ontology.id);

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

            if (this.propertyInfo.propType.subPropOf === Constants.HasLinkTo || this.propertyInfo.propType.subPropOf === Constants.IsPartOf) {
                newResProp.objectType = guiAttr;
                newResProp.subjectType = this.resClassIri;
            } else {
                newResProp.objectType = this.propertyInfo.propType.objectType;
            }

            onto.entity = newResProp;

            this._dspApiConnection.v2.onto.createResourceProperty(onto).subscribe(
                (response: ResourcePropertyDefinitionWithAllLanguages) => {
                    this.lastModificationDate = response.lastModificationDate;

                    if (this.resClassIri && response.lastModificationDate) {
                        // set cardinality
                        this.setCardinality(response);
                    } else {
                        // close the dialog box
                        this.loading = false;
                        this.closeDialog.emit();
                    }

                },
                (error: ApiResponseError) => {
                    this.error = true;
                    this.loading = false;
                    this._errorHandler.showMessage(error);
                }
            );

        }
    }

    replaceGuiElement() {
        const onto4guiEle = new UpdateOntology<UpdateResourcePropertyGuiElement>();
        onto4guiEle.id = this.ontology.id;
        onto4guiEle.lastModificationDate = this.lastModificationDate;

        const updateGuiEle = new UpdateResourcePropertyGuiElement();
        updateGuiEle.id = this.propertyInfo.propDef.id;
        updateGuiEle.guiElement = this.propertyForm.controls['propType'].value.guiEle;

        const guiAttr = this.propertyForm.controls['guiAttr'].value;
        if (guiAttr) {
            updateGuiEle.guiAttributes = this.setGuiAttribute(guiAttr);
        }

        onto4guiEle.entity = updateGuiEle;

        this._dspApiConnection.v2.onto.replaceGuiElementOfProperty(onto4guiEle).subscribe(
            (guiEleResponse: ResourcePropertyDefinitionWithAllLanguages) => {
                this.lastModificationDate = guiEleResponse.lastModificationDate;
                // close the dialog box
                this.loading = false;
                this.closeDialog.emit();
            },
            (error: ApiResponseError) => {
                this.error = true;
                this.loading = false;
                this._errorHandler.showMessage(error);
            }
        );
    }

    setCardinality(prop: ResourcePropertyDefinitionWithAllLanguages) {

        const onto = new UpdateOntology<UpdateResourceClassCardinality>();

        onto.lastModificationDate = this.lastModificationDate;

        onto.id = this.ontology.id;

        const addCard = new UpdateResourceClassCardinality();

        addCard.id = this.resClassIri;

        addCard.cardinalities = [];

        const propCard: IHasProperty = {
            propertyIndex: prop.id,
            cardinality: this._os.translateCardinality(this.propertyForm.value.multiple, this.propertyForm.value.required),
            guiOrder: this.guiOrder  // add new property to the end of current list of properties
        };

        addCard.cardinalities.push(propCard);

        onto.entity = addCard;

        this._dspApiConnection.v2.onto.addCardinalityToResourceClass(onto).subscribe(
            (res: ResourceClassDefinitionWithAllLanguages) => {
                this.lastModificationDate = res.lastModificationDate;
                // close the dialog box
                this.loading = false;
                this.closeDialog.emit();
            },
            (error: ApiResponseError) => {
                this.error = true;
                this.loading = false;
                this._errorHandler.showMessage(error);
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

}
