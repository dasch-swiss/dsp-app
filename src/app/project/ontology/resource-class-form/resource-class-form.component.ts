import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { AfterViewChecked, ChangeDetectorRef, Component, EventEmitter, Inject, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';
import {
    ApiResponseData,
    ApiResponseError,
    Constants,
    CreateResourceClass,
    CreateResourceProperty,
    KnoraApiConnection,
    ListsResponse,
    ReadOntology,
    ResourceClassDefinitionWithAllLanguages,
    ResourcePropertyDefinitionWithAllLanguages,
    StringLiteral,
    UpdateOntology,
    UpdateOntologyResourceClassCardinality
} from '@dasch-swiss/dsp-js';
import { StringLiteralV2 } from '@dasch-swiss/dsp-js/src/models/v2/string-literal-v2';
import { DspApiConnectionToken } from '@dasch-swiss/dsp-ui';
import { from, of, Subscription } from 'rxjs';
import { concatMap } from 'rxjs/operators';
import { CacheService } from 'src/app/main/cache/cache.service';
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
     * selected resource class is a subclass from knora base (baseClassIri)
     * e.g. knora-api:StillImageRepresentation
     */
    @Input() subClassOf: string;

    /**
     * name of resource class e.g. Still image
     * this will be used to update title of resource class form
     */
    @Input() name: string;
    // store name as resourceClassTitle on init; in this case it can't be overwritten in the next / prev navigation
    resourceClassTitle: string;

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

    // success of sending data
    success = false;

    // message after successful post
    successMessage: any = {
        status: 200,
        statusText: 'You have successfully updated the resource class and all properties'
    };

    // progress
    loading: boolean;

    // in case of an error, show message
    errorMessage: any;

    // two step form: which should be active?
    showResourceClassForm: boolean = true;

    // form group, form array (for properties) errors and validation messages
    resourceClassForm: FormGroup;

    // label and comment are stringLiterals
    resourceClassLabels: StringLiteralV2[] = [];
    resourceClassComments: StringLiteralV2[] = [];

    // sub / second form of resource class: properties form
    resourceClassFormSub: Subscription;

    // container for properties
    properties: FormArray;

    // reresource class name should be unique
    existingResourceClassNames: [RegExp];

    existingPropertyNames: [RegExp];

    // TODO: move to knora-api-js-lib
    // nameRegex: RegExp = /^(?![0-9]).(?![\u00C0-\u017F]).[a-zA-Z0-9]+\S*$/;

    // form errors on the following fields:
    formErrors = {
        'label': ''
    };

    // in case of form error: show message
    validationMessages = {
        'label': {
            'required': 'Label is required.'
        },
    };

    lastModificationDate: string;

    constructor(
        @Inject(DspApiConnectionToken) private _dspApiConnection: KnoraApiConnection,
        private _resourceClassFormService: ResourceClassFormService,
        private _cache: CacheService,
        private _cdr: ChangeDetectorRef,
    ) { }

    ngOnInit() {

        // init existing names
        this.existingResourceClassNames = [
            new RegExp('anEmptyRegularExpressionWasntPossible')
        ];
        this.existingPropertyNames = [
            new RegExp('anEmptyRegularExpressionWasntPossible')
        ];

        // set file representation or default reresource class as title
        this.resourceClassTitle = this.name;

        this._cache.get('currentOntology').subscribe(
            (response: ReadOntology) => {
                this.ontology = response;

                this.lastModificationDate = this.ontology.lastModificationDate;

                // get all ontology resource classs:
                // can be used to select resource class as gui attribute in link property,
                // but also to avoid same name which should be unique
                const classKeys: string[] = Object.keys(response.classes);
                console.log(classKeys);
                for (const c of classKeys) {
                    this.existingResourceClassNames.push(
                        new RegExp('(?:^|W)' + c.split('#')[1] + '(?:$|W)')
                    )
                }

                const propKeys: string[] = Object.keys(response.properties);
                console.log(propKeys);
            },
            (error: any) => {
                console.error(error);
            }
        );

        // get all lists; will be used to set guit attribut in list property
        this._dspApiConnection.admin.listsEndpoint.getListsInProject(this.projectIri).subscribe(
            (response: ApiResponseData<ListsResponse>) => {
                this._cache.set('currentOntologyLists', response.body.lists);
            },
            (error: ApiResponseError) => {
                console.error(error);
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

        this.resourceClassFormSub = this._resourceClassFormService.resourceClassForm$
            .subscribe(resourceClass => {
                this.resourceClassForm = resourceClass;
                this.properties = this.resourceClassForm.get('properties') as FormArray;
            });

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
     */
    nextStep(ev: Event) {
        ev.preventDefault();
        // go to next step: properties form
        this.showResourceClassForm = false;

        // use response to go further with properties
        this.updateParent.emit({ title: this.resourceClassLabels[0].value, subtitle: 'Define the metadata for resource class' });

        // load one first property line
        if (!this.resourceClassForm.value.properties.length) {
            this.addProperty();
        }
    }
    /**
     * Go to previous step: from properties form back to resource-class form
     */
    prevStep(ev: Event) {
        ev.preventDefault();
        this.updateParent.emit({ title: this.resourceClassTitle, subtitle: 'Customize resource class' });
        this.showResourceClassForm = true;
    }

    //
    // submit

    /**
     * Submit data to create resource class with properties and cardinalities
     */
    submitData() {
        this.loading = true;

        // set resource class name / id
        const uniqueClassName: string = this._resourceClassFormService.setUniqueName(this.ontology.id, this.resourceClassLabels[0].value);

        const onto = new UpdateOntology<CreateResourceClass>();

        onto.id = this.ontology.id;
        onto.lastModificationDate = this.lastModificationDate;

        const newResClass = new CreateResourceClass();

        newResClass.name = uniqueClassName
        newResClass.label = this.resourceClassLabels;
        newResClass.comment = this.resourceClassComments;
        newResClass.subClassOf = [this.subClassOf];

        onto.entity = newResClass;

        // submit resource class data to knora and create resource class incl. cardinality
        // console.log('submit resource class data:', resourceClassData);
        // let i: number = 0;
        this._dspApiConnection.v2.onto.createResourceClass(onto).subscribe(
            (classResponse: ResourceClassDefinitionWithAllLanguages) => {
                console.log('classResponse', classResponse);
                // need lmd from classResponse
                this.lastModificationDate = classResponse.lastModificationDate;

                // post prop data; one by one
                // const props = this.resourceClassForm.value.properties;

                this.submitProps(this.resourceClassForm.value.properties, classResponse.id);

                console.warn('when will this console.log run?')


                // this.getLastModificationDate(this.ontology.id);

                // await this.createProp(props, classResponse.id);



                // props.map(async (prop: Property) => {

                // });
                // for(let i = 0; i < props.length; i++){
                // // for (let prop: Property of props) {





                // const newResProp = new CreateResourceProperty();

                // newResProp.name = uniquePropName
                // newResProp.label = prop;
                // newResProp.comment = this.resourceClassComments;
                // newResProp. = [this.subClassOf];

                // onto.entity = newResClass;
                // };

                // this._dspApiConnection.v2.onto.createResourceProperty()





                // prepare last modification date and properties data
                // lastModificationDate = classResponse.

                // ['knora-api:lastModificationDate']['@value'];
                // const props = from(this.resourceClassForm.value.properties);

                // let c: number = 0;

                // post prop data; one by one
                // props.subscribe(
                //     (prop: any) => {

                //         console.log('prop from form', prop);

                /* TODO: select and reuse existing ObjectProperty doesn't work yet; s. https://github.com/dasch-swiss/knora-app/pull/229#issuecomment-598276151
                 if (prop.name) {
                    // const propertyId: string = this._resourceClassFormService.getOntologyName(this.ontology.id) + ':' + prop.name;
                    // property exists already; update class with prop cardinality and gui-order only
                    // update class with cardinality and gui-order
                    this._ontologyService.setPropertyRestriction(
                        this.ontology.id,
                        lastModificationDate,
                        classResponse['@graph'][0]['@id'],
                        this._resourceClassFormService.getOntologyName(this.ontology.id) + ':' + prop.name,
                        this.setCardinality(prop.multiple, prop.requirerd),
                        c
                    ).subscribe(
                        (cardinalityResponse: any) => {
                            lastModificationDate = cardinalityResponse['knora-api:lastModificationDate']['@value'];

                            // close the dialog box
                            this.loading = false;
                            this.closeDialog.emit();
                        },
                        (error: ApiServiceError) => {
                            console.error('failed on setPropertyRestriction', error);
                        }
                    );
                } else {
                */
                // create new property
                // property data
                // const propData: NewProperty = {
                //     name: this._resourceClassFormService.setUniqueName(this.ontology.id),
                //     label: prop.label,
                //     comment: prop.label,
                //     subPropOf: prop.type.subPropOf,
                //     guiElement: prop.type.gui_ele,
                //     guiOrder: c,
                //     cardinality: this.setCardinality(prop.multiple, prop.requirerd),
                //     guiAttributes: []
                // };

                // console.log('newProperty data', propData);

                // // submit property data
                // this._ontologyService.addProperty(this.ontology.id, lastModificationDate, classResponse['@graph'][0]['@id'], propData).subscribe(
                //     (propResponse: ApiServiceResult) => {
                //         lastModificationDate = propResponse['knora-api:lastModificationDate']['@value'];

                //         // update class with cardinality and gui-order
                //         this._ontologyService.setPropertyRestriction(
                //             this.ontology.id,
                //             lastModificationDate,
                //             classResponse['@graph'][0]['@id'],
                //             propResponse['@graph'][0]['@id'],
                //             propData.cardinality,
                //             propData.guiOrder
                //         ).subscribe(
                //             (cardinalityResponse: any) => {
                //                 lastModificationDate = cardinalityResponse['knora-api:lastModificationDate']['@value'];

                //                 // TODO: submit next property; recursive method

                //                 // close the dialog box
                //                 this.loading = false;
                //                 this.closeDialog.emit();
                //             },
                //             (error: ApiServiceError) => {
                //                 console.error('failed on setPropertyRestriction', error);
                //             }
                //         );
                //     },
                //     (error: ApiServiceError) => {
                //         console.error('failed on addProperty', error);
                //     }
                // );
                // // }

                // c++;
                //     }
                // );

            },
            (error: ApiResponseError) => {
                console.error('failed on addResourceClass', error);
            }
        );


        // show message to close dialog box
        // this.closeMessage();
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
        console.log(props);

        let i = 1;

        from(props)
            .pipe(concatMap(
                (prop: Property) => {
                    // console.log('first pipe operator...waiting...', this.lastModificationDate);
                    // submit prop
                    console.log('prepare and submit prop', prop)
                    this.createProp(prop, classIri, i);
                    return new Promise(resolve => setTimeout(() => resolve(prop), 1200));
                }
            ))
            .pipe(concatMap(
                (prop: Property) => {
                    i++;
                    console.log('do sth. with prop response', prop);
                    return of(prop);
                }
            ))
            .subscribe(
                (prop: Property) => {
                    // this.getOntology(this.ontologyId);
                    if (i === props.length) {
                        console.log('created; reset ontology cache', prop)

                        // close the dialog box
                        this.loading = false;
                        this.closeDialog.emit();
                    }
                }
            );

    }

    createProp(prop: Property, classIri: string, index: number) {
        return new Promise((resolve, reject) => {
            // set resource property name / id
            const uniquePropName: string = this._resourceClassFormService.setUniqueName(this.ontology.id, prop.label);

            const onto = new UpdateOntology<CreateResourceProperty>();

            onto.id = this.ontology.id;

            // prepare payload for property
            const newResProp = new CreateResourceProperty();
            newResProp.name = uniquePropName;
            // TODO: update prop.label and use StringLiteralInput in property-form
            newResProp.label = [{ "value": prop.label }];
            if (prop.guiAttr) {
                newResProp.guiAttributes = [prop.guiAttr];
            }
            newResProp.guiElement = prop.type.gui_ele;
            newResProp.subPropertyOf = [prop.type.subPropOf];
            if (prop.type.subPropOf === Constants.HasLinkTo) {
                newResProp.objectType = prop.guiAttr;
                newResProp.subjectType = classIri;
            } else {
                newResProp.objectType = prop.type.objectType;
            }

            onto.lastModificationDate = this.lastModificationDate;

            onto.entity = newResProp;

            this._dspApiConnection.v2.onto.createResourceProperty(onto).subscribe(
                (response: ResourcePropertyDefinitionWithAllLanguages) => {
                    console.log(index);
                    this.lastModificationDate = response.lastModificationDate;
                    // update cardinality
                    this.setCardinality(response.id, classIri, prop.multiple, prop.required, index);
                },
                (error: ApiResponseError) => {
                    console.error(error);
                }
            )
        })
    }

    setCardinality(propIri: string, classIri: string, multiple: boolean, required: boolean, index: number) {

        const addCard = new UpdateOntologyResourceClassCardinality();

        addCard.lastModificationDate = this.lastModificationDate;

        addCard.id = this.ontology.id;

        const cardinality = this._resourceClassFormService.translateCardinality(multiple, required);

        addCard.cardinalities = [
            {
                propertyIndex: propIri,
                cardinality: cardinality,
                resourceClass: classIri,
                guiOrder: index
            }
        ];


        this._dspApiConnection.v2.onto.addCardinalityToResourceClass(addCard).subscribe(
            (res: ResourceClassDefinitionWithAllLanguages) => {
                this.lastModificationDate = res.lastModificationDate;
            }
        );

    }

}
