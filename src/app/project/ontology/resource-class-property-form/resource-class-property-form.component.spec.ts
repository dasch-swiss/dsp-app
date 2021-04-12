import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Component, OnInit, ViewChild } from '@angular/core';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Constants, IHasProperty, KnoraApiConnection, ListNodeInfo, MockOntology, PropertyDefinition, ReadOntology, ResourcePropertyDefinitionWithAllLanguages } from '@dasch-swiss/dsp-js';
import { AppInitService, DspApiConfigToken, DspApiConnectionToken } from '@dasch-swiss/dsp-ui';
import { of, Subscription } from 'rxjs';
import { CacheService } from 'src/app/main/cache/cache.service';
import { TestConfig } from 'test.config';
import { Property, ResourceClassFormService } from '../resource-class-form/resource-class-form.service';
import { ResourceClassPropertyFormComponent } from './resource-class-property-form.component';


/**
 * test host component to simulate parent component
 * Property is of type simple text
 */
@Component({
    template: '<app-resource-class-property-form #propertyForm [propertyForm]="properties.controls[0]" [index]="0" [resClassIri]="resClassIri"></app-resource-class-property-form>'
})
class HostComponent implements OnInit {

    @ViewChild('propertyForm') resClassPropertyFormComponent: ResourceClassPropertyFormComponent;

    resourceClassForm: FormGroup;

    resourceClassFormSub: Subscription;

    properties: FormArray;

    resClassIri = Constants.Resource;

    ontology: ReadOntology = MockOntology.mockReadOntology('http://0.0.0.0:3333/ontology/0001/anything/v2');

    constructor(
        private _resourceClassFormService: ResourceClassFormService
    ) {

        this._resourceClassFormService.addProperty();
    }

    ngOnInit() {
        const ontoProperties: PropertyDefinition[] = this.ontology.getAllPropertyDefinitions();

        this.resourceClassFormSub = this._resourceClassFormService.resourceClassForm$
            .subscribe(resourceClass => {
                this.resourceClassForm = resourceClass;
                this.properties = this.resourceClassForm.get('properties') as FormArray;
            });

    }

}

xdescribe('ResourceClassPropertyFormComponent', () => {
    let component: HostComponent;
    let fixture: ComponentFixture<HostComponent>;

    const formBuilder: FormBuilder = new FormBuilder();

    const cacheServiceSpy = jasmine.createSpyObj('CacheService', ['get']);

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [
                HostComponent,
                ResourceClassPropertyFormComponent
            ],
            imports: [
                BrowserAnimationsModule,
                HttpClientTestingModule,
                MatAutocompleteModule,
                MatDialogModule,
                MatFormFieldModule,
                MatIconModule,
                MatInputModule,
                MatOptionModule,
                MatSelectModule,
                MatSlideToggleModule,
                MatSnackBarModule,
                ReactiveFormsModule
            ],
            providers: [
                // reference the new instance of formBuilder from above
                { provide: FormBuilder, useValue: formBuilder },
                AppInitService,
                {
                    provide: DspApiConfigToken,
                    useValue: TestConfig.ApiConfig
                },
                {
                    provide: DspApiConnectionToken,
                    useValue: new KnoraApiConnection(TestConfig.ApiConfig)
                },
                {
                    provide: CacheService,
                    useValue: cacheServiceSpy
                },
            ]
        })
            .compileComponents();
    }));

    beforeEach(() => {

        // mock cache service for currentOntologyLists
        const cacheSpy = TestBed.inject(CacheService);

        (cacheSpy as jasmine.SpyObj<CacheService>).get.and.callFake(
            () => {
                const response: ListNodeInfo[] = [{
                    'comments': [],
                    'id': 'http://rdfh.ch/lists/0001/otherTreeList',
                    'isRootNode': true,
                    'labels': [{
                        'language': 'en',
                        'value': 'Tree list root'
                    }],
                    'projectIri': 'http://rdfh.ch/projects/0001'
                }, {
                    'comments': [{
                        'language': 'en',
                        'value': 'a list that is not in used in ontology or data'
                    }],
                    'id': 'http://rdfh.ch/lists/0001/notUsedList',
                    'isRootNode': true,
                    'labels': [{
                        'language': 'de',
                        'value': 'unbenutzte Liste'
                    }, {
                        'language': 'en',
                        'value': 'a list that is not used'
                    }],
                    'name': 'notUsedList',
                    'projectIri': 'http://rdfh.ch/projects/0001'
                }, {
                    'comments': [{
                        'language': 'en',
                        'value': 'Anything Tree List'
                    }],
                    'id': 'http://rdfh.ch/lists/0001/treeList',
                    'isRootNode': true,
                    'labels': [{
                        'language': 'de',
                        'value': 'Listenwurzel'
                    }, {
                        'language': 'en',
                        'value': 'Tree list root'
                    }],
                    'name': 'treelistroot',
                    'projectIri': 'http://rdfh.ch/projects/0001'
                }];
                return of(response);
            }
        );

        fixture = TestBed.createComponent(HostComponent);
        component = fixture.componentInstance;

        // // pass in the form dynamically
        // component.propertyForm = formBuilder.group({
        //     type: null,
        //     label: null,
        //     multiple: null,
        //     required: null,
        //     permission: null
        // });

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
