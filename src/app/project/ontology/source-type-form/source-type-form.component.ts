import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { AfterViewChecked, ChangeDetectorRef, Component, EventEmitter, Inject, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormArray, FormGroup, Validators } from '@angular/forms';
import { existingNamesValidator } from '@knora/action';
import { ApiResponseData, ApiResponseError, KnoraApiConnection, ListsResponse, ReadOntology, StringLiteral } from '@knora/api';
import { KnoraApiConnectionToken, OntologyService } from '@knora/core';
import { Subscription } from 'rxjs';
import { CacheService } from 'src/app/main/cache/cache.service';
import { SourceTypeFormService } from './source-type-form.service';

// nested form components; solution from:
// https://medium.com/@joshblf/dynamic-nested-reactive-forms-in-angular-654c1d4a769a

@Component({
    selector: 'app-source-type-form',
    templateUrl: './source-type-form.component.html',
    styleUrls: ['./source-type-form.component.scss']
})
export class SourceTypeFormComponent implements OnInit, OnDestroy, AfterViewChecked {

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
     * this will be used to update title of source type form
     */
    @Input() name: string;
    // store name as sourceTypeTitle on init; in this case it can't be overwritten in the next / prev navigation
    sourceTypeTitle: string;

    /**
     * emit event, when closing dialog
     */
    @Output() closeDialog: EventEmitter<any> = new EventEmitter<any>();

    /**
     * update title and subtitle in dialog header (by switching from step 1 (source type) to step 2 (properties))
     */
    @Output() updateParent: EventEmitter<{ title: string, subtitle: string }> = new EventEmitter<{ title: string, subtitle: string }>();

    // current ontology; will get it from cache by key 'currentOntology'
    ontology: ReadOntology;

    // success of sending data
    success = false;

    // message after successful post
    successMessage: any = {
        status: 200,
        statusText: 'You have successfully updated the source type and all properties'
    };

    // progress
    loading: boolean;

    // in case of an error, show message
    errorMessage: any;

    // two step form: which should be active?
    showSourceTypeForm: boolean = true;

    // form group, form array (for properties) errors and validation messages
    sourceTypeForm: FormGroup;

    // label and comment are stringLiterals
    sourceTypeLabels: StringLiteral[] = [];
    sourceTypeComments: StringLiteral[] = [];

    // sub / second form of source type: properties form
    sourceTypeFormSub: Subscription;

    // container for properties
    properties: FormArray;

    // resource type name should be unique
    existingSourceTypeNames: [RegExp];

    existingPropertyNames: [RegExp];

    nameRegex: RegExp = /^(?![0-9]).(?![\u00C0-\u017F]).[a-zA-Z0-9]+\S*$/;

    nameMinLength = 3;
    nameMaxLength = 16;

    // form errors on the following fields:
    formErrors = {
        'name': '',
        'label': ''
    };

    // in case of form error: show message
    validationMessages = {
        'name': {
            'required': 'Name is required.',
            'minlength': 'Name must be at least ' + this.nameMinLength + ' characters long.',
            'maxlength': 'Name cannot be more than ' + this.nameMaxLength + ' characters long.',
            'pattern': 'Name shouldn\'t start with a number; Spaces and special characters are not allowed.',
            'existingName': 'This name exists already.'
        },
        'label': {
            'required': 'Label is required.'
        },
    };

    constructor(
        @Inject(KnoraApiConnectionToken) private knoraApiConnection: KnoraApiConnection,
        private _ontologyService: OntologyService,
        private _cache: CacheService,
        private _cdr: ChangeDetectorRef,
        private _sourceTypeFormService: SourceTypeFormService
    ) { }

    ngOnInit() {

        // init existing names
        this.existingSourceTypeNames = [
            new RegExp('anEmptyRegularExpressionWasntPossible')
        ];
        this.existingPropertyNames = [
            new RegExp('anEmptyRegularExpressionWasntPossible')
        ];

        // set file representation or default resource type as title
        this.sourceTypeTitle = this.name;

        this._cache.get('currentOntology').subscribe(
            (response: ReadOntology) => {
                this.ontology = response;

                // get all ontology source types:
                // can be used to select source type as gui attribute in link property,
                // but also to avoid same name which should be unique
                const classKeys: string[] = Object.keys(response.classes);
                for (const c of classKeys) {
                    this.existingSourceTypeNames.push(
                        new RegExp('(?:^|W)' + c.split('#')[1] + '(?:$|W)')
                    )
                }
            },
            (error: any) => {
                console.error(error);
            }
        );

        // get all lists; will be used to set guit attribut in list property
        this.knoraApiConnection.admin.listsEndpoint.getListsInProject(this.projectIri).subscribe(
            (response: ApiResponseData<ListsResponse>) => {
                this._cache.set('currentOntologyLists', response.body.lists);
            },
            (error: ApiResponseError) => {
                console.error(error);
            }
        );

        this.buildForm();

        // this.sourceTypeForm.statusChanges.subscribe((data) => {
        //     // do something on form changes
        // });

        this._cdr.detectChanges();

    }

    ngOnDestroy() {
        this.sourceTypeFormSub.unsubscribe();
    }

    ngAfterViewChecked() {
        this._cdr.detectChanges();
    }

    //
    // form handling:

    /**
     * build form
     */
    buildForm() {

        // reset properties
        this._sourceTypeFormService.resetProperties();

        this.sourceTypeFormSub = this._sourceTypeFormService.sourceTypeForm$
            .subscribe(sourceType => {
                this.sourceTypeForm = sourceType;
                this.properties = this.sourceTypeForm.get('properties') as FormArray;
            });

        this.sourceTypeForm.controls['name'].setValidators([
            Validators.required,
            Validators.minLength(this.nameMinLength),
            Validators.maxLength(this.nameMaxLength),
            existingNamesValidator(this.existingSourceTypeNames),
            Validators.pattern(this.nameRegex)
        ]);
        this.sourceTypeForm.controls['name'].updateValueAndValidity();

        this.sourceTypeForm.valueChanges.subscribe(data => this.onValueChanged(data));
    }

    onValueChanged(data?: any) {

        if (!this.sourceTypeForm) {
            return;
        }

        Object.keys(this.formErrors).map(field => {
            this.formErrors[field] = '';
            const control = this.sourceTypeForm.get(field);
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
        this._sourceTypeFormService.addProperty();
    }
    /**
     * delete property line
     */
    removeProperty(index: number) {
        this._sourceTypeFormService.removeProperty(index);
    }
    /**
     * reset properties
     */
    resetProperties() {
        this._sourceTypeFormService.resetProperties();
        this.addProperty();
    }
    /**
     * drag and drop property line
     */
    drop(event: CdkDragDrop<string[]>) {

        // set sort order for child component
        moveItemInArray(this.properties.controls, event.previousIndex, event.currentIndex);

        // set sort order in form value
        moveItemInArray(this.sourceTypeForm.value.properties, event.previousIndex, event.currentIndex);
    }
    /**
     * set stringLiterals for label or comment from kui-string-literal-input
     * @param  {StringLiteral[]} data
     * @param  {string} type
     */
    handleData(data: StringLiteral[], type: string) {

        switch (type) {
            case 'labels':
                this.sourceTypeLabels = data;
                break;

            case 'comments':
                this.sourceTypeComments = data;
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
        // this.loading = true;
        // go to next step: properties form
        this.showSourceTypeForm = false;

        // use response to go further with properties
        this.updateParent.emit({ title: this.sourceTypeForm.controls['name'].value, subtitle: 'Define the metadata for source type' });

        // load one first property line
        if (!this.sourceTypeForm.value.properties.length) {
            this.addProperty();
        }
        // this.loading = false;
    }
    /**
     * Go to previous step: from properties form back to resource-class form
     */
    prevStep(ev: Event) {
        ev.preventDefault();
        // this.loading = true;
        this.updateParent.emit({ title: this.sourceTypeTitle, subtitle: 'Customize source type' });
        this.showSourceTypeForm = true;
        // this.loading = false;
    }

    //
    // submit

    /**
     * Submit data to create resource class with properties and cardinalities
     */
    submitData() {
        this.loading = true;

        let lastModificationDate: string = this.ontology.lastModificationDate;


        // fix variables:

        // - ontologyIri from this.ontology

        // - ontologyLastModificationDate from this.ontology

        // - classIri

        // - baseClassIri

        // for each property:
        // - propertyIri
        // - basePropertyIri --> can be knora-api:hasValue, knora-api:hasLinkTo, or any of their subproperties, with the exception of file properties
        // - cardinality
        // - subjectType    --> subclass of knora-api:Resource e.g. images:bild || images:person
        // - objectType     --> literal datatype: e.g. xsd:string || knora-api:Date

        // from salsah-gui-ontology
        // - guiElementIri
        // - guiAttribute
        // - guiOrder

        // first step: get data from first form: source type

        if (!this.sourceTypeComments.length) {
            this.sourceTypeComments = this.sourceTypeLabels;
        }

        // set resource class data; should be: NewResourceClass
        const resourceTypeData: any = {
            name: this.sourceTypeForm.controls['name'].value,
            labels: this.sourceTypeLabels,
            comments: this.sourceTypeComments,
            subClassOf: this.subClassOf
        };

        // set properties data
        // TODO: build props
        // const resourcePropertyData: NewProperty[] = [];
        // let i = 0;
        // for (const prop of this.sourceTypeForm.value.properties) {
        //     // console.warn('prop from form:', prop);
        //     const newProp: NewProperty = {
        //         label: prop.label,
        //         comment: prop.label,
        //         subPropOf: prop.type.subPropOf,
        //         guiElement: prop.type.gui_ele,
        //         guiOrder: i,
        //         cardinality: this.setCardinality(prop.multiple, prop.requirerd),
        //         guiAttributes: []
        //     };
        //     resourcePropertyData.push(newProp);



        //     i++;
        // }



        // submit source type data to knora and create source type incl. cardinality
        // console.log('submit source type data:', resourceTypeData);
        // let i: number = 0;

        /* NOT YET IMPLEMENTED!!!
        this._ontologyService.addResourceClass(this.ontology.id, lastModificationDate, resourceTypeData).subscribe(
            (classResponse: ApiServiceResult) => {
                console.log('classResponse', classResponse);

                // set properties data
                lastModificationDate = classResponse['knora-api:lastModificationDate']['@value'];
                // console.log('lastModDate (class response)', lastModificationDate);

                let c: number = 0;
                const props = from(this.sourceTypeForm.value.properties);

                props.subscribe(
                    (prop: any) => {
                        console.log(prop);

                    }
                );


                // for (let i = 0; i < props.length; i++) {
                //     const propData: NewProperty = {
                //         label: props[i].label,
                //         comment: props[i].label,
                //         subPropOf: props[i].type.subPropOf,
                //         guiElement: props[i].type.gui_ele,
                //         guiOrder: i,
                //         cardinality: this.setCardinality(props[i].multiple, props[i].requirerd),
                //         guiAttributes: []
                //     };

                //     if (i === c) {
                //         console.log(i + ') Post property', props[i].label);
                //         this._ontologyService.addProperty(this.ontology.id, lastModificationDate, classResponse['@graph'][0]['@id'], propData).subscribe(
                //             (propertyResponse: ApiServiceResult) => {
                //                 lastModificationDate = propertyResponse['knora-api:lastModificationDate']['@value'];

                //                 // update class with cardinality and gui-order
                //                 console.log(i + ') Set prop restriction', props[i].label);
                //                 this._ontologyService.setPropertyRestriction(
                //                     this.ontology.id,
                //                     lastModificationDate,
                //                     classResponse['@graph'][0]['@id'],
                //                     propertyResponse['@graph'][0]['@id'],
                //                     propData.cardinality,
                //                     propData.guiOrder
                //                 ).subscribe(
                //                     (cardinalityResponse: any) => {
                //                         console.log(i + ') cardinalityResponse', cardinalityResponse);
                //                         lastModificationDate = cardinalityResponse['knora-api:lastModificationDate']['@value'];
                //                     },
                //                     (error: ApiServiceError) => {
                //                         console.error('failed on setPropertyRestriction', error);
                //                     }
                //                 );
                //             },
                //             (error: ApiServiceError) => {
                //                 console.error('failed on addProperty', error);
                //             }
                //         );
                //     } else {
                //         c++;
                //     }

                // }




                // propsArray.subscribe(
                //     (prop: any) => {
                //         const propData: NewProperty = {
                //             label: prop.label,
                //             comment: prop.label,
                //             subPropOf: prop.type.subPropOf,
                //             guiElement: prop.type.gui_ele,
                //             guiOrder: i,
                //             cardinality: this.setCardinality(prop.multiple, prop.requirerd),
                //             guiAttributes: []
                //         };
                //         if (i !== i - 1) {

                //         }
                //         console.log(i + ') Post property', prop.label);
                //         this._ontologyService.addProperty(this.ontology.id, lastModificationDate, classResponse['@graph'][0]['@id'], propData).pipe(
                //             map((propertyResponse: ApiServiceResult) => {
                //                 console.log('map', propertyResponse);
                //                 lastModificationDate = propertyResponse['knora-api:lastModificationDate']['@value'];
                //                 console.log(i + ') lastModDate (map prop response)', lastModificationDate);
                //                 i++;
                //             }),
                //             mergeMap(update => lastModificationDate = update['knora-api:lastModificationDate']['@value'])
                //         ).subscribe(
                //             (echo) => {
                //                 console.log('subscribe', echo);
                //                 lastModificationDate = echo['knora-api:lastModificationDate']['@value'];
                //                 console.log(i + ') lastModDate (subscribe prop response)', lastModificationDate);
                //             }
                //         );
                //     }
                // );

                // let i: number = 0;
                // while (i < this.sourceTypeForm.value.properties.length) {
                //     const prop = this.sourceTypeForm.value.properties[i];

                //     const propData: NewProperty = {
                //         label: prop.label,
                //         comment: prop.label,
                //         subPropOf: prop.type.subPropOf,
                //         guiElement: prop.type.gui_ele,
                //         guiOrder: i,
                //         cardinality: this.setCardinality(prop.multiple, prop.requirerd),
                //         guiAttributes: []
                //     };

                //     console.log(i + ') Post property', prop.label);
                //     this.recursivePost(this.ontology.id, lastModificationDate, classResponse['@graph'][0]['@id'], propData).subscribe(
                //         (response: any) => {
                //             console.log('recursive post response', response);
                //             i++;
                //         }
                //     );

                // this._ontologyService.addProperty(this.ontology.id, lastModificationDate, classResponse['@graph'][0]['@id'], propData).pipe(
                //     map((propertyResponse: ApiServiceResult) => {
                //         // console.log(i + ') propertyResponse', propertyResponse);
                //         lastModificationDate = propertyResponse['knora-api:lastModificationDate']['@value'];
                //         console.log(i + ') lastModDate (prop response)', lastModificationDate);
                //     },
                //         (error: ApiServiceError) => {
                //             console.error('failed on addProperty', error);
                //         })
                // ).subscribe(
                //     (echo) => {
                //         console.log('subscribe', echo);
                //         i++;
                //     }
                // );
                // }


                // .subscribe(
                //     (propertyResponse: ApiServiceResult) => {

                //         // update class with cardinality and gui-order
                //         // console.log(i + ') Set prop restriction', prop.label);
                //         // this._ontologyService.setPropertyRestriction(
                //         //     this.ontology.id,
                //         //     lastModificationDate,
                //         //     classResponse['@graph'][0]['@id'],
                //         //     propertyResponse['@graph'][0]['@id'],
                //         //     propData.cardinality,
                //         //     propData.guiOrder).subscribe(
                //         //         (cardinalityResponse: any) => {
                //         //             console.log(i + ') cardinalityResponse', cardinalityResponse);
                //         //             lastModificationDate = cardinalityResponse['knora-api:lastModificationDate']['@value'];
                //         //             setTimeout(() => {
                //         //                 i++;
                //         //             });
                //         //         },
                //         //         (error: ApiServiceError) => {
                //         //             console.error('failed on setPropertyRestriction', error);
                //         //         }
                //         //     );

                //         setTimeout(() => {
                //             i++;
                //         }, 2000);
                //     },

                // close the dialog box
                this.loading = false;

            },
            (error: ApiServiceError) => {
                console.error('failed on addResourceClass', error);
            }
        );

        */

        // show message to close dialog box
        // this.closeMessage();
    }
    /**
     * Convert cardinality values (multiple? & required?) from form to string 1-0, 0-n, 1, 0-1
     * @param  {boolean} multiple
     * @param  {boolean} required
     * @returns string
     */
    setCardinality(multiple: boolean, required: boolean): string {
        // result should be:
        // "1", "0-1", "1-n", "0-n"
        if (multiple && required) {
            return '1-n';
        } else if (multiple && !required) {
            return '0-n';
        } else if (!multiple && required) {
            return '1';
        } else {
            return '0-1';
        }
    }

    /**
     * Close dialog box and reset all forms
     */
    closeMessage() {
        this.sourceTypeForm.reset();
        this.sourceTypeFormSub.unsubscribe();
        this.closeDialog.emit();
    }

    /* addProperty: NOT YET IMPLEMENTED!!!

    recursivePost(ontologyIri: string, lmd: string, classIri: string, data: NewProperty): Observable<any> {
        return this._ontologyService.addProperty(ontologyIri, lmd, classIri, data).pipe(
            map(response => {
                console.log('map response from addProperty', response);
            })
        );
    } */

    // TODO: submit data
    // we have to implement the following jsonLD objects and paths to post data

    /*

    ontology (should already be implemented in knora-ui core module)

    post /v2/ontologies

    ontology = {
        "knora-api:ontologyName": onto_name,
        "knora-api:attachedToProject": {
            "@id": project_iri
        },
        "rdfs:label": label,
        "@context": {
            "rdfs": 'http://www.w3.org/2000/01/rdf-schema#',
            "knora-api": 'http://api.knora.org/ontology/knora-api/v2#'
        }
    }

    *+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+
    *+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+

    cardinality

    post: /v2/ontologies/cardinalities

    cardinality = {
        "@id": onto_iri,
        "@type": "owl:Ontology",
        "knora-api:lastModificationDate": last_onto_date,
        "@graph": [{
            "@id": class_iri,
            "@type": "owl:Class",
            "rdfs:subClassOf": {
                "@type": "owl:Restriction",
                occurrence[0]: occurrence[1],
                "owl:onProperty": {
                    "@id": prop_iri
                }
            }
        }],
        "@context": {
            "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
            "knora-api": "http://api.knora.org/ontology/knora-api/v2#",
            "owl": "http://www.w3.org/2002/07/owl#",
            "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
            "xsd": "http://www.w3.org/2001/XMLSchema#",
            onto_name: onto_iri + "#"
        }
    }

    switcher = {
        "1": ("owl:cardinality", 1),
        "0-1": ("owl:maxCardinality", 1),
        "0-n": ("owl:minCardinality", 0),
        "1-n": ("owl:minCardinality", 1)
    }

    *+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+
    *+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+

    property

    post: /v2/ontologies/properties

    property = {
        "@id": onto_iri,
        "@type": "owl:Ontology",
        "knora-api:lastModificationDate": last_onto_date,
        "@graph": [
            propdata
        ],
        "@context": {
            "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
            "knora-api": "http://api.knora.org/ontology/knora-api/v2#",
            "salsah-gui": "http://api.knora.org/ontology/salsah-gui/v2#",
            "owl": "http://www.w3.org/2002/07/owl#",
            "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
            "xsd": "http://www.w3.org/2001/XMLSchema#",
            onto_name: onto_iri + "#"
        }
    }

    propdata = {
        "@id": onto_name + ":" + prop_name,
        "@type": "owl:ObjectProperty",
        "rdfs:label": labels,
        "rdfs:comment": comments,
        "rdfs:subPropertyOf": super_props,
        "salsah-gui:guiElement": {
            "@id": gui_element
        }
    }

    super_props:

    "hasValue",
    "hasLinkTo",
    "hasColor",
    "hasComment",
    "hasGeometry",
    "isPartOf",
    "isRegionOf",
    "isAnnotationOf",
    "seqnum"

    *+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+
    *+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+

    resource class ( = "source type" in the simple user interface)

    post: /v2/ontologies/classes

    res_class = {
        "@id": onto_iri,
        "@type": "owl:Ontology",
        "knora-api:lastModificationDate": last_onto_date,
        "@graph": [{
            "@id": onto_name + ":" + class_name,
            "@type": "owl:Class",
            "rdfs:label": labels,
            "rdfs:comment": comments,
            "rdfs:subClassOf": {
                "@id": super_class
            }
        }],
        "@context": {
            "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
            "knora-api": "http://api.knora.org/ontology/knora-api/v2#",
            "owl": "http://www.w3.org/2002/07/owl#",
            "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
            "xsd": "http://www.w3.org/2001/XMLSchema#",
            onto_name: onto_iri + "#"
        }
    }

    super_class:

    "Resource",
    "StillImageRepresentation",
    "TextRepresentation",
    "AudioRepresentation",
    "DDDRepresentation",
    "DocumentRepresentation",
    "MovingImageRepresentation",
    "Annotation",
    "LinkObj",
    "Region"


    */

}
