import { Component, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import {
    ApiResponseError,
    ClassDefinition,
    Constants,
    CreateResourceProperty,
    KnoraApiConnection,
    ListNodeInfo,
    ReadOntology,
    ResourcePropertyDefinitionWithAllLanguages,
    StringLiteral,
    UpdateOntology,
    UpdateResourcePropertyComment,
    UpdateResourcePropertyLabel
} from '@dasch-swiss/dsp-js';
import { AutocompleteItem, DspApiConnectionToken } from '@dasch-swiss/dsp-ui';
import { Observable } from 'rxjs';
import { CacheService } from 'src/app/main/cache/cache.service';
import { ErrorHandlerService } from 'src/app/main/error/error-handler.service';
import { DefaultProperties, DefaultProperty, PropertyCategory, PropertyInfoObject } from '../default-data/default-properties';
import { ResourceClassFormService } from '../resource-class-form/resource-class-form.service';

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

    @Output() closeDialog: EventEmitter<any> = new EventEmitter<any>();

    /**
     * form group, errors and validation messages
     */
    propertyForm: FormGroup;

    formErrors = {
        'label': '',
        'guiAttr': ''
    };

    validationMessages = {
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
    propertyTypes: PropertyCategory[] = DefaultProperties.data;

    showGuiAttr = false;
    guiAttrIcon = 'tune';

    // list of project specific lists (TODO: probably we have to add default knora lists?!)
    lists: ListNodeInfo[];

    // resource classes in this ontology
    resourceClass: ClassDefinition[] = [];

    loading = false;

    error = false;

    labels: StringLiteral[] = [];
    comments: StringLiteral[] = [];
    guiAttributes: string[] = [];

    dspConstants = Constants;

    constructor(
        @Inject(DspApiConnectionToken) private _dspApiConnection: KnoraApiConnection,
        private _cache: CacheService,
        private _errorHandler: ErrorHandlerService,
        private _fb: FormBuilder,
        private _resourceClassFormService: ResourceClassFormService
    ) { }

    ngOnInit() {

        this.loading = true;

        this._cache.get('currentOntology').subscribe(
            (response: ReadOntology) => {
                this.ontology = response;
                this.lastModificationDate = response.lastModificationDate;

                // set various lists to select from
                // a) in case of link value:
                // set list of resource classes from response; needed for linkValue
                this.resourceClass = response.getAllClassDefinitions();

            },
            (error: ApiResponseError) => {
                this._errorHandler.showMessage(error);
            }
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

        // if property definition exists
        // we are in edit mode: prepare form to edit label and/or comment
        if (this.propertyInfo.propDef) {
            this.labels = this.propertyInfo.propDef.labels;
            this.comments = this.propertyInfo.propDef.comments;
            this.guiAttributes = this.propertyInfo.propDef.guiAttributes;
        }

        this.propertyForm = this._fb.group({
            'guiAttr': new FormControl({
                value: this.guiAttributes
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

        const form = this.propertyForm;

        Object.keys(this.formErrors).map(field => {
            this.formErrors[field] = '';
            const control = form.get(field);
            if (control && control.dirty && !control.valid) {
                const messages = this.validationMessages[field];
                Object.keys(control.errors).map(key => {
                    this.formErrors[field] += messages[key] + ' ';
                });

            }
        });
    }

    handleData(data: StringLiteral[], type: string) {

        switch (type) {
            case 'labels':
                this.labels = data;
                break;

            case 'comments':
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

    updateAttributeField(type: DefaultProperty) {

        // reset value of guiAttr
        this.propertyForm.controls['guiAttr'].setValue(undefined);


        // set gui attribute value depending on gui element and existing property (edit mode)
        if (this.propertyInfo.propDef) {
            // the gui attribute can't be changed (at the moment?);
            // disable the input and set the validator as not required
            this.propertyForm.controls['guiAttr'].disable();

            switch (type.guiEle) {
                // prop type is a list
                case Constants.SalsahGui + Constants.HashDelimiter + 'List':
                case Constants.SalsahGui + Constants.HashDelimiter + 'Radio':
                    this.showGuiAttr = true;
                    // gui attribute value for lists looks as follow: hlist=<http://rdfh.ch/lists/00FF/73d0ec0302>
                    // get index from guiAttr array where value starts with hlist=
                    const i = this.guiAttributes.findIndex(element => element.includes('hlist'));
                    // find content beteween pointy brackets to get list iri
                    const re = /\<([^)]+)\>/;
                    const listIri = this.guiAttributes[i].match(re)[1];

                    this.propertyForm.controls['guiAttr'].setValue(listIri);
                    break;

                // prop type is resource pointer
                case Constants.SalsahGui + Constants.HashDelimiter + 'Searchbox':
                    this.showGuiAttr = true;
                    this.propertyForm.controls['guiAttr'].setValue(this.propertyInfo.propDef.objectType);
                    break;

                default:
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
        // do something with your data
        if (this.propertyInfo.propDef) {
            // edit mode: res property info (label and comment)
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
            updateComment.comments = (this.comments.length ? this.comments : this.labels);
            onto4Comment.entity = updateComment;

            this._dspApiConnection.v2.onto.updateResourceProperty(onto4Label).subscribe(
                (classLabelResponse: ResourcePropertyDefinitionWithAllLanguages) => {
                    this.ontology.lastModificationDate = classLabelResponse.lastModificationDate;
                    onto4Comment.lastModificationDate = this.ontology.lastModificationDate;

                    this._dspApiConnection.v2.onto.updateResourceProperty(onto4Comment).subscribe(
                        (classCommentResponse: ResourcePropertyDefinitionWithAllLanguages) => {
                            this.ontology.lastModificationDate = classCommentResponse.lastModificationDate;

                            // close the dialog box
                            this.loading = false;
                            this.closeDialog.emit();
                        },
                        (error: ApiResponseError) => {
                            this._errorHandler.showMessage(error);
                        }
                    );

                },
                (error: ApiResponseError) => {
                    this._errorHandler.showMessage(error);
                }
            );

        } else {
            // create mode: new property incl. gui type and attribute
            // submit property
            // this.submitProps(this.resourceClassForm.value.properties, this.propertyInfo.propDef.id);
            // set resource property name / id: randomized string
            const uniquePropName: string = this._resourceClassFormService.setUniqueName(this.ontology.id);

            const onto = new UpdateOntology<CreateResourceProperty>();

            onto.id = this.ontology.id;
            onto.lastModificationDate = this.lastModificationDate;

            // prepare payload for property
            const newResProp = new CreateResourceProperty();
            newResProp.name = uniquePropName;
            // --> TODO update prop.label and use StringLiteralInput in property-form
            newResProp.label = this.labels;
            newResProp.comment = (this.comments.length ? this.comments : this.labels);
            const guiAttr = this.propertyForm.controls['guiAttr'].value;
            if (guiAttr) {
                switch (this.propertyInfo.propType.guiEle) {

                    case Constants.SalsahGui + Constants.HashDelimiter + 'Colorpicker':
                        newResProp.guiAttributes = ['ncolors=' + guiAttr];
                        break;
                    case Constants.SalsahGui + Constants.HashDelimiter + 'List':
                    case Constants.SalsahGui + Constants.HashDelimiter + 'Pulldown':
                    case Constants.SalsahGui + Constants.HashDelimiter + 'Radio':
                        newResProp.guiAttributes = ['hlist=<' + guiAttr + '>'];
                        break;
                    case Constants.SalsahGui + Constants.HashDelimiter + 'SimpleText':
                        // --> TODO could have two guiAttr fields: size and maxlength
                        // we suggest to use default value for size; we do not support this guiAttr in DSP-App
                        newResProp.guiAttributes = ['maxlength=' + guiAttr];
                        break;
                    case Constants.SalsahGui + Constants.HashDelimiter + 'Spinbox':
                        // --> TODO could have two guiAttr fields: min and max
                        newResProp.guiAttributes = ['min=' + guiAttr, 'max=' + guiAttr];
                        break;
                    case Constants.SalsahGui + Constants.HashDelimiter + 'Textarea':
                        // --> TODO could have four guiAttr fields: width, cols, rows, wrap
                        // we suggest to use default values; we do not support this guiAttr in DSP-App
                        newResProp.guiAttributes = ['width=100%'];
                        break;
                }
            }
            newResProp.guiElement = this.propertyInfo.propType.guiEle;
            newResProp.subPropertyOf = [this.propertyInfo.propType.subPropOf];

            if (this.propertyInfo.propType.subPropOf === Constants.HasLinkTo) {
                newResProp.objectType = guiAttr;
                // newResProp.subjectType = classIri;
            } else {
                newResProp.objectType = this.propertyInfo.propType.objectType;
            }

            onto.entity = newResProp;

            this._dspApiConnection.v2.onto.createResourceProperty(onto).subscribe(
                (response: ResourcePropertyDefinitionWithAllLanguages) => {
                    this.lastModificationDate = response.lastModificationDate;
                    // close the dialog box
                    this.loading = false;
                    this.closeDialog.emit();
                },
                (error: ApiResponseError) => {
                    this._errorHandler.showMessage(error);
                }
            );

        }
    }

}
