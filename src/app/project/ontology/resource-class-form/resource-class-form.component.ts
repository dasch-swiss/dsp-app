import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { AfterViewChecked, ChangeDetectorRef, Component, EventEmitter, Inject, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';
import {
    ApiResponseError,
    ClassDefinition,
    Constants,
    CreateResourceClass,
    CreateResourceProperty,
    IHasProperty,
    KnoraApiConnection,
    PropertyDefinition,
    ReadOntology,
    ResourceClassDefinitionWithAllLanguages,
    ResourcePropertyDefinitionWithAllLanguages,
    StringLiteral,
    UpdateOntology,
    UpdateResourceClassCardinality,
    UpdateResourceClassComment,
    UpdateResourceClassLabel
} from '@dasch-swiss/dsp-js';
import { StringLiteralV2 } from '@dasch-swiss/dsp-js/src/models/v2/string-literal-v2';
import { DspApiConnectionToken } from '@dasch-swiss/dsp-ui';
import { from, of, Subscription } from 'rxjs';
import { concatMap } from 'rxjs/operators';
import { AppGlobal } from 'src/app/app-global';
import { CacheService } from 'src/app/main/cache/cache.service';
import { ErrorHandlerService } from 'src/app/main/error/error-handler.service';
import { Property, ResourceClassFormService } from './resource-class-form.service';

// nested form components; solution from:
// https://medium.com/@joshblf/dynamic-nested-reactive-forms-in-angular-654c1d4a769a

@Component({
    selector: 'app-resource-class-form',
    templateUrl: './resource-class-form.component.html',
    styleUrls: ['./resource-class-form.component.scss']
})
export class ResourceClassFormComponent implements OnInit, OnDestroy, AfterViewChecked {

    /**
     * current project iri
     */
    @Input() projectIri: string;

    /**
     * create mode: iri selected resource class is a subclass from knora base (baseClassIri)
     * edit mode: iri of resource class
     * e.g. knora-api:StillImageRepresentation
     */
    @Input() iri: string;

    /**
     * name of resource class e.g. Still image
     * this will be used to update title of resource class form
     */
    @Input() name: string;
    // store name as resourceClassTitle on init; in this case it can't be overwritten in the next / prev navigation
    resourceClassTitle: string;

    // two step form: which should be active?
    /**
     * two step form: which should be active?
     * true => step 1 shows label and comment of resource class
     * false => step 2 shows list of properties of resource class
     */
    @Input() showResourceClassForm: boolean = true;

    /**
     * edit mode (true); otherwise create mode
    */
    @Input() edit: boolean;

    /**
     * emit event, when closing dialog
     */
    @Output() closeDialog: EventEmitter<any> = new EventEmitter<any>();

    /**
     * update title and subtitle in dialog header (by switching from step 1 (resource class) to step 2 (properties))
     */
    @Output() updateParent: EventEmitter<{ title: string, subtitle: string }> = new EventEmitter<{ title: string, subtitle: string }>();

    // current ontology; will get it from cache by key 'currentOntology'
    ontology: ReadOntology;

    // set a list of properties to set res class cardinality for
    propsForCard: Property[] = [];

    // success of sending data
    success = false;

    // message after successful post
    successMessage: any = {
        status: 200,
        statusText: 'You have successfully updated the resource class and all properties'
    };

    // progress
    loading: boolean;

    // in case of an error
    error: boolean;

    // form group, form array (for properties) errors and validation messages
    resourceClassForm: FormGroup;

    // label and comment are stringLiterals
    resourceClassLabels: StringLiteralV2[] = [];
    resourceClassComments: StringLiteralV2[] = [];

    // sub / second form of resource class: properties form
    resourceClassFormSub: Subscription;

    // container for properties
    properties: FormArray;

    // resource class name should be unique
    existingResourceClassNames: [RegExp];

    existingPropertyNames: [RegExp];

    // TODO: move to knora-api-js-lib
    // nameRegex: RegExp = /^(?![0-9]).(?![\u00C0-\u017F]).[a-zA-Z0-9]+\S*$/;

    // form errors on the following fields:
    formErrors = {
        'label': '',
        'comment': ''
    };

    // in case of form error: show message
    validationMessages = {
        'label': {
            'required': 'Label is required.'
        },
        'comment': {
            'required': 'Comment is required.'
        }
    };

    lastModificationDate: string;

    // for the language selector
    selectedLanguage = 'en';
    languages: StringLiteral[] = AppGlobal.languagesList;

    constructor(
        @Inject(DspApiConnectionToken) private _dspApiConnection: KnoraApiConnection,
        private _cache: CacheService,
        private _cdr: ChangeDetectorRef,
        private _errorHandler: ErrorHandlerService,
        private _resourceClassFormService: ResourceClassFormService
    ) { }

    ngOnInit() {

        // init existing names
        this.existingResourceClassNames = [
            new RegExp('anEmptyRegularExpressionWasntPossible')
        ];
        this.existingPropertyNames = [
            new RegExp('anEmptyRegularExpressionWasntPossible')
        ];

        // set file representation or default resource class as title
        this.resourceClassTitle = this.name;

        this._cache.get('currentOntology').subscribe(
            (response: ReadOntology) => {
                this.ontology = response;

                this.lastModificationDate = this.ontology.lastModificationDate;

                // get all ontology resource classes:
                // can be used to select resource class as gui attribute in link property,
                // but also to avoid same name which should be unique
                const classKeys: string[] = Object.keys(response.classes);
                for (const c of classKeys) {
                    this.existingResourceClassNames.push(
                        new RegExp('(?:^|W)' + c.split('#')[1] + '(?:$|W)')
                    );
                }

                // const propKeys: string[] = Object.keys(response.properties);

            },
            (error: ApiResponseError) => {
                this._errorHandler.showMessage(error);
            }
        );

        this.buildForm();

        this._cdr.detectChanges();

    }

    ngOnDestroy() {
        this.resourceClassFormSub.unsubscribe();
    }

    ngAfterViewChecked() {
        this._cdr.detectChanges();
    }

    //
    // form handling:

    buildForm() {

        // reset properties
        this._resourceClassFormService.resetProperties();

        if (this.edit) {

            if (this.showResourceClassForm) {
                // edit mode: res class info (label and comment)
                // get resource class info
                const resourceClasses: ResourceClassDefinitionWithAllLanguages[] = this.ontology.getClassDefinitionsByType(ResourceClassDefinitionWithAllLanguages);
                Object.keys(resourceClasses).forEach(key => {
                    if (resourceClasses[key].id === this.iri) {
                        this.resourceClassLabels = resourceClasses[key].labels;
                        this.resourceClassComments = resourceClasses[key].comments;
                    }
                });
                this.resourceClassFormSub = this._resourceClassFormService.resourceClassForm$
                    .subscribe(resourceClass => {
                        this.resourceClassForm = resourceClass;
                    });

            } else {
                // edit mode: res class cardinality
                // get list of ontology properties
                const ontoProperties: PropertyDefinition[] = this.ontology.getAllPropertyDefinitions();

                // find prop cardinality in resource class
                const ontoClasses: ClassDefinition[] = this.ontology.getAllClassDefinitions();
                Object.keys(ontoClasses).forEach(key => {
                    if (ontoClasses[key].id === this.iri) {

                        this._resourceClassFormService.setProperties(ontoClasses[key], ontoProperties);

                        this.resourceClassFormSub = this._resourceClassFormService.resourceClassForm$
                            .subscribe(resourceClass => {
                                this.resourceClassForm = resourceClass;
                                this.properties = this.resourceClassForm.get('properties') as FormArray;
                            });

                        // set default property language from resource class / first element
                        this.resourceClassForm.controls.language.setValue(ontoClasses[key].labels[0].language);
                        this.resourceClassForm.controls.language.disable();
                    }
                });
            }

        } else {
            // create mode
            this.resourceClassFormSub = this._resourceClassFormService.resourceClassForm$
                .subscribe(resourceClass => {
                    this.resourceClassForm = resourceClass;
                    this.properties = this.resourceClassForm.get('properties') as FormArray;
                });
        }

        this.resourceClassForm.valueChanges.subscribe(data => this.onValueChanged(data));
    }

    onValueChanged(data?: any) {

        if (!this.resourceClassForm) {
            return;
        }

        Object.keys(this.formErrors).map(field => {
            this.formErrors[field] = '';
            const control = this.resourceClassForm.get(field);
            if (control && control.dirty && !control.valid) {
                const messages = this.validationMessages[field];
                Object.keys(control.errors).map(key => {
                    this.formErrors[field] += messages[key] + ' ';
                });

            }
        });

    }

    //
    // property form: handle list of properties

    /**
     * add property line
     */
    addProperty() {
        this._resourceClassFormService.addProperty();
    }
    /**
     * delete property line
     */
    removeProperty(index: number) {
        this._resourceClassFormService.removeProperty(index);
    }
    /**
     * reset properties
     */
    resetProperties() {
        this._resourceClassFormService.resetProperties();
        this.addProperty();
    }
    /**
     * drag and drop property line
     */
    drop(event: CdkDragDrop<string[]>) {

        // set sort order for child component
        moveItemInArray(this.properties.controls, event.previousIndex, event.currentIndex);

        // set sort order in form value
        moveItemInArray(this.resourceClassForm.value.properties, event.previousIndex, event.currentIndex);
    }
    /**
     * set stringLiterals for label or comment from dsp-string-literal-input
     * @param  {StringLiteral[]} data
     * @param  {string} type
     */
    handleData(data: StringLiteral[], type: string) {

        switch (type) {
            case 'labels':
                this.resourceClassLabels = data;
                break;

            case 'comments':
                this.resourceClassComments = data;
                break;
        }
    }

    //
    // form navigation:

    /**
     * Go to next step: from resource-class form forward to properties form
     * In create mode only
     */
    nextStep(ev: Event) {

        // go to next step: properties form
        this.showResourceClassForm = false;

        // use response to go further with properties
        this.updateParent.emit({ title: this.resourceClassLabels[0].value, subtitle: 'Define the metadata fields for the resource class' });

        // set default property language from res class label
        this.resourceClassForm.controls.language.setValue(this.resourceClassLabels[0].language);

        // load one first property line
        if (!this.resourceClassForm.value.properties.length) {
            this.addProperty();
        }
    }
    /**
     * Go to previous step: from properties form back to resource-class form
     * In create mode only
     */
    prevStep(ev: Event) {
        ev.preventDefault();
        this.updateParent.emit({ title: this.resourceClassTitle, subtitle: 'Customize the resource class' });
        this.showResourceClassForm = true;
    }

    //
    // submit

    /**
     * Submit data to create resource class with properties and cardinalities
     */
    submitData() {
        this.loading = true;
        if (this.edit) {

            if (this.showResourceClassForm) {
                // edit mode: res class info (label and comment)
                // label
                const onto4Label = new UpdateOntology<UpdateResourceClassLabel>();
                onto4Label.id = this.ontology.id;
                onto4Label.lastModificationDate = this.lastModificationDate;

                const updateLabel = new UpdateResourceClassLabel();
                updateLabel.id = this.iri;
                updateLabel.labels = this.resourceClassLabels;
                onto4Label.entity = updateLabel;

                // comment
                const onto4Comment = new UpdateOntology<UpdateResourceClassComment>();
                onto4Comment.id = this.ontology.id;

                const updateComment = new UpdateResourceClassComment();
                updateComment.id = this.iri;
                updateComment.comments = this.resourceClassComments;
                onto4Comment.entity = updateComment;

                this._dspApiConnection.v2.onto.updateResourceClass(onto4Label).subscribe(
                    (classLabelResponse: ResourceClassDefinitionWithAllLanguages) => {
                        this.lastModificationDate = classLabelResponse.lastModificationDate;
                        onto4Comment.lastModificationDate = this.lastModificationDate;

                        this._dspApiConnection.v2.onto.updateResourceClass(onto4Comment).subscribe(
                            (classCommentResponse: ResourceClassDefinitionWithAllLanguages) => {
                                this.lastModificationDate = classCommentResponse.lastModificationDate;

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
                // edit mode: res class cardinality
                // submit properties and set cardinality
                this.submitProps(this.resourceClassForm.value.properties, this.iri);
            }

        } else {
            // create mode
            // submit resource class data to knora and create resource class incl. cardinality

            // set resource class name / id: randomized string
            const uniqueClassName: string = this._resourceClassFormService.setUniqueName(this.ontology.id);
            // or const uniqueClassName: string = this._resourceClassFormService.setUniqueName(this.ontology.id, this.resourceClassLabels[0].value, 'class');

            const onto = new UpdateOntology<CreateResourceClass>();

            onto.id = this.ontology.id;
            onto.lastModificationDate = this.lastModificationDate;

            const newResClass = new CreateResourceClass();

            newResClass.name = uniqueClassName;
            newResClass.label = this.resourceClassLabels;
            newResClass.comment = this.resourceClassComments;
            newResClass.subClassOf = [this.iri];

            onto.entity = newResClass;
            this._dspApiConnection.v2.onto.createResourceClass(onto).subscribe(
                (classResponse: ResourceClassDefinitionWithAllLanguages) => {
                    // need lmd from classResponse
                    this.lastModificationDate = classResponse.lastModificationDate;

                    // submit properties and set cardinality
                    this.submitProps(this.resourceClassForm.value.properties, classResponse.id);

                },
                (error: ApiResponseError) => {
                    this._errorHandler.showMessage(error);
                }
            );
        }

    }

    /**
     * Close dialog box and reset all forms
     */
    closeMessage() {
        this.resourceClassForm.reset();
        this.resourceClassFormSub.unsubscribe();
        this.closeDialog.emit();
    }

    submitProps(props: Property[], classIri: string) {

        let i = 1;
        from(props)
            .pipe(concatMap(
                (prop: Property) => {
                    // submit prop
                    // console.log('first pipe operator...waiting...prepare and submit prop', prop);
                    if (prop.iri) {
                        // already existing property; add it to the new list of properties

                        this.propsForCard.push(prop);
                    } else {
                        // the defined prop does not exist yet. We have to create it.
                        this.createProp(prop, classIri);
                    }
                    return new Promise(resolve => setTimeout(() => resolve(prop), 1200));
                }
            ))
            .pipe(concatMap(
                (prop: Property) => {
                    i++;
                    // console.log('second pipe operator; do sth. with prop response', prop);
                    return of(prop);
                }
            ))
            .subscribe(
                (prop: Property) => {

                    if (i > props.length) {
                        // console.log('at the end: created', prop)

                        // all properties are created and exist
                        // set the cardinality
                        this.setCardinality(this.propsForCard, classIri);
                    }
                }
            );

    }

    createProp(prop: Property, classIri?: string) {
        return new Promise((resolve, reject) => {

            // set resource property name / id: randomized string
            const uniquePropName: string = this._resourceClassFormService.setUniqueName(this.ontology.id);

            const onto = new UpdateOntology<CreateResourceProperty>();

            onto.id = this.ontology.id;
            onto.lastModificationDate = this.lastModificationDate;

            // prepare payload for property
            const newResProp = new CreateResourceProperty();
            newResProp.name = uniquePropName;
            // TODO: update prop.label and use StringLiteralInput in property-form
            newResProp.label = [
                {
                    'value': prop.label,
                    'language': this.resourceClassForm.controls.language.value
                }
            ];
            if (prop.guiAttr) {
                switch (prop.type.gui_ele) {

                    case Constants.SalsahGui + Constants.HashDelimiter + 'Colorpicker':
                        newResProp.guiAttributes = ['ncolors=' + prop.guiAttr];
                        break;
                    case Constants.SalsahGui + Constants.HashDelimiter + 'List':
                    case Constants.SalsahGui + Constants.HashDelimiter + 'Pulldown':
                    case Constants.SalsahGui + Constants.HashDelimiter + 'Radio':
                        newResProp.guiAttributes = ['hlist=<' + prop.guiAttr + '>'];
                        break;
                    case Constants.SalsahGui + Constants.HashDelimiter + 'SimpleText':
                        // TODO: could have two guiAttr fields: size and maxlength
                        // we suggest to use default value for size; we do not support this guiAttr in DSP-App
                        newResProp.guiAttributes = ['maxlength=' + prop.guiAttr];
                        break;
                    case Constants.SalsahGui + Constants.HashDelimiter + 'Spinbox':
                        // TODO: could have two guiAttr fields: min and max
                        newResProp.guiAttributes = ['min=' + prop.guiAttr, 'max=' + prop.guiAttr];
                        break;
                    case Constants.SalsahGui + Constants.HashDelimiter + 'Textarea':
                        // TODO: could have four guiAttr fields: width, cols, rows, wrap
                        // we suggest to use default values; we do not support this guiAttr in DSP-App
                        newResProp.guiAttributes = ['width=100%'];
                        break;
                }
            }
            newResProp.guiElement = prop.type.gui_ele;
            newResProp.subPropertyOf = [prop.type.subPropOf];

            if (prop.type.subPropOf === Constants.HasLinkTo) {
                newResProp.objectType = prop.guiAttr;
                // newResProp.subjectType = classIri;
            } else {
                newResProp.objectType = prop.type.objectType;
            }

            onto.entity = newResProp;

            this._dspApiConnection.v2.onto.createResourceProperty(onto).subscribe(
                (response: ResourcePropertyDefinitionWithAllLanguages) => {
                    this.lastModificationDate = response.lastModificationDate;
                    // prepare prop for cardinality
                    prop.iri = response.id;
                    this.propsForCard.push(prop);
                },
                (error: ApiResponseError) => {
                    this._errorHandler.showMessage(error);
                }
            );
        });
    }

    setCardinality(props: Property[], classIri: string) {
        const onto = new UpdateOntology<UpdateResourceClassCardinality>();

        onto.lastModificationDate = this.lastModificationDate;

        onto.id = this.ontology.id;

        const addCard = new UpdateResourceClassCardinality();

        addCard.id = classIri;

        addCard.cardinalities = [];

        props.forEach((prop, index) => {
            const propCard: IHasProperty = {
                propertyIndex: prop.iri,
                cardinality: this._resourceClassFormService.translateCardinality(prop.multiple, prop.required),
                guiOrder: index + 1
            };

            addCard.cardinalities.push(propCard);
        });

        onto.entity = addCard;

        this._dspApiConnection.v2.onto.replaceCardinalityOfResourceClass(onto).subscribe(
            (res: ResourceClassDefinitionWithAllLanguages) => {
                this.lastModificationDate = res.lastModificationDate;
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
