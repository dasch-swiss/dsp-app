import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Component, DebugElement, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { ListNodeInfo, MockOntology, ReadOntology } from '@dasch-swiss/dsp-js';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { AppInitService } from 'src/app/app-init.service';
import { CacheService } from 'src/app/main/cache/cache.service';
import { DspApiConfigToken, DspApiConnectionToken } from 'src/app/main/declarations/dsp-api-tokens';
import { TestConfig } from 'test.config';
import { PropertyInfoObject } from '../default-data/default-properties';
import { PropertyFormComponent } from './property-form.component';

/**
 * test host component to simulate parent component
 * Property is of type simple text
 */
@Component({
    template: '<app-property-form #propertyForm [propertyInfo]="propertyInfo" [canSetFullCardinality]="false"></app-property-form>'
})
class SimpleTextHostComponent {

    @ViewChild('propertyForm') propertyFormComponent: PropertyFormComponent;

    propertyInfo: PropertyInfoObject = {
        'propDef': {
            'id': 'http://0.0.0.0:3333/ontology/0001/anything/v2#hasPictureTitle',
            'subPropertyOf': ['http://api.knora.org/ontology/knora-api/v2#hasValue'],
            'label': 'Titel',
            'guiElement': 'http://api.knora.org/ontology/salsah-gui/v2#SimpleText',
            'subjectType': 'http://0.0.0.0:3333/ontology/0001/anything/v2#ThingPicture',
            'objectType': 'http://api.knora.org/ontology/knora-api/v2#TextValue',
            'isLinkProperty': false,
            'isLinkValueProperty': false,
            'isEditable': true,
            'guiAttributes': ['maxlength=255', 'size=80'],
            'comments': [],
            'labels': [{
                'language': 'de',
                'value': 'Titel'
            }, {
                'language': 'en',
                'value': 'Title'
            }, {
                'language': 'fr',
                'value': 'Titre'
            }, {
                'language': 'it',
                'value': 'Titolo'
            }]
        },
        'propType': {
            'icon': 'short_text',
            'label': 'Short',
            'description': 'Small text such as title or name',
            'subPropOf': 'http://api.knora.org/ontology/knora-api/v2#hasValue',
            'objectType': 'http://api.knora.org/ontology/knora-api/v2#TextValue',
            'guiEle': 'http://api.knora.org/ontology/salsah-gui/v2#SimpleText',
            'group': 'Text'
        }
    };

}

/**
 * test host component to simulate parent component
 * Property is of type resource link
 */
@Component({
    template: '<app-property-form #propertyForm [propertyInfo]="propertyInfo"></app-property-form>'
})
class LinkHostComponent {

    @ViewChild('propertyForm') propertyFormComponent: PropertyFormComponent;

    propertyInfo: PropertyInfoObject = {
        'propDef': {
            'id': 'http://0.0.0.0:3333/ontology/0001/anything/v2#hasOtherThing',
            'subPropertyOf': ['http://api.knora.org/ontology/knora-api/v2#hasLinkTo'],
            'label': 'Ein anderes Ding',
            'guiElement': 'http://api.knora.org/ontology/salsah-gui/v2#Searchbox',
            'subjectType': 'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
            'objectType': 'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
            'isLinkProperty': true,
            'isLinkValueProperty': false,
            'isEditable': true,
            'guiAttributes': [],
            'comments': [],
            'labels': [{
                'language': 'de',
                'value': 'Ein anderes Ding'
            }, {
                'language': 'en',
                'value': 'Another thing'
            }, {
                'language': 'fr',
                'value': 'Une autre chose'
            }, {
                'language': 'it',
                'value': 'Un\'altra cosa'
            }]
        },
        'propType': {
            'icon': 'link',
            'label': 'Resource class',
            'description': 'Refers to a resource class',
            'subPropOf': 'http://api.knora.org/ontology/knora-api/v2#hasLinkTo',
            'objectType': 'http://api.knora.org/ontology/knora-api/v2#LinkValue',
            'guiEle': 'http://api.knora.org/ontology/salsah-gui/v2#Searchbox',
            'group': 'Link'
        }
    };

}

/**
 * test host component to simulate parent component
 * Property is of type resource link
 */
@Component({
    template: '<app-property-form #propertyForm [propertyInfo]="propertyInfo"></app-property-form>'
})
class ListHostComponent {

    @ViewChild('propertyForm') propertyFormComponent: PropertyFormComponent;

    propertyInfo: PropertyInfoObject = {
        'propDef': {
            'id': 'http://0.0.0.0:3333/ontology/0001/anything/v2#hasOtherListItem',
            'subPropertyOf': ['http://api.knora.org/ontology/knora-api/v2#hasValue'],
            'comment': 'Andere listenelement',
            'label': 'Andere listenelement',
            'guiElement': 'http://api.knora.org/ontology/salsah-gui/v2#Pulldown',
            'subjectType': 'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
            'objectType': 'http://api.knora.org/ontology/knora-api/v2#ListValue',
            'isLinkProperty': false,
            'isLinkValueProperty': false,
            'isEditable': true,
            'guiAttributes': ['hlist=<http://rdfh.ch/lists/0001/otherTreeList>'],
            'comments': [{
                'language': 'de',
                'value': 'Andere listenelement'
            }, {
                'language': 'en',
                'value': 'Other list element'
            }, {
                'language': 'fr',
                'value': 'Autre elément de liste'
            }, {
                'language': 'it',
                'value': 'Altra elemento di lista'
            }],
            'labels': [{
                'language': 'de',
                'value': 'Andere listenelement'
            }, {
                'language': 'en',
                'value': 'Other list element'
            }, {
                'language': 'fr',
                'value': 'Autre elément de liste'
            }, {
                'language': 'it',
                'value': 'Altra elemento di lista'
            }]
        },
        'propType': {
            'icon': 'arrow_drop_down_circle',
            'label': 'Dropdown',
            'description': 'Dropdown menu with values from predefined list',
            'subPropOf': 'http://api.knora.org/ontology/knora-api/v2#hasValue',
            'objectType': 'http://api.knora.org/ontology/knora-api/v2#ListValue',
            'guiEle': 'http://api.knora.org/ontology/salsah-gui/v2#Pulldown',
            'group': 'List'
        }
    };

}

describe('PropertyFormComponent', () => {
    let simpleTextHostComponent: SimpleTextHostComponent;
    let simpleTextHostFixture: ComponentFixture<SimpleTextHostComponent>;

    let linkHostComponent: LinkHostComponent;
    let linkHostFixture: ComponentFixture<LinkHostComponent>;

    let listHostComponent: ListHostComponent;
    let listHostFixture: ComponentFixture<ListHostComponent>;

    beforeEach(waitForAsync(() => {

        const cacheServiceSpy = jasmine.createSpyObj('CacheService', ['get']);

        const ontologyEndpointSpyObj = {
            v2: {
                onto: jasmine.createSpyObj('onto', ['updateResourceProperty', 'createResourceProperty', 'replaceGuiElementOfProperty'])
            }
        };

        TestBed.configureTestingModule({
            declarations: [
                LinkHostComponent,
                ListHostComponent,
                SimpleTextHostComponent,
                PropertyFormComponent
            ],
            imports: [
                BrowserAnimationsModule,
                HttpClientTestingModule,
                MatAutocompleteModule,
                MatButtonModule,
                MatDialogModule,
                MatFormFieldModule,
                MatIconModule,
                MatInputModule,
                MatOptionModule,
                MatSelectModule,
                MatSnackBarModule,
                ReactiveFormsModule,
                RouterTestingModule,
                TranslateModule.forRoot()
            ],
            providers: [
                AppInitService,
                {
                    provide: DspApiConfigToken,
                    useValue: TestConfig.ApiConfig
                },
                {
                    provide: DspApiConnectionToken,
                    useValue: ontologyEndpointSpyObj
                },
                {
                    provide: CacheService,
                    useValue: cacheServiceSpy
                }
            ]
        })
            .compileComponents();
    }));

    beforeEach(() => {

        // mock cache service for currentOntology
        const cacheSpyOnto = TestBed.inject(CacheService);
        (cacheSpyOnto as jasmine.SpyObj<CacheService>).get.withArgs('currentOntology').and.callFake(
            () => {
                const response: ReadOntology = MockOntology.mockReadOntology('http://0.0.0.0:3333/ontology/0001/anything/v2');
                return of(response);
            }
        );

        // mock cache service for currentProjectOntologies
        const cacheSpyProjOnto = TestBed.inject(CacheService);
        (cacheSpyProjOnto as jasmine.SpyObj<CacheService>).get.withArgs('currentProjectOntologies').and.callFake(
            () => {
                const ontologies: ReadOntology[] = [];
                ontologies.push(MockOntology.mockReadOntology('http://0.0.0.0:3333/ontology/0001/anything/v2'));
                ontologies.push(MockOntology.mockReadOntology('http://0.0.0.0:3333/ontology/0001/minimal/v2'));
                const response: ReadOntology[] = ontologies;
                return of(response);
            }
        );

        // mock cache service for currentOntologyLists
        const cacheSpyLists = TestBed.inject(CacheService);
        (cacheSpyLists as jasmine.SpyObj<CacheService>).get.withArgs('currentOntologyLists').and.callFake(
            () => {
                const response: ListNodeInfo[] = [{
                    'comments': [],
                    'id': 'http://rdfh.ch/lists/0001/otherTreeList',
                    'isRootNode': true,
                    'labels': [{
                        'language': 'en',
                        'value': 'Tree list root'
                    }],
                    'projectIri': 'http://rdfh.ch/projects/Lw3FC39BSzCwvmdOaTyLqQ'
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
                    'projectIri': 'http://rdfh.ch/projects/Lw3FC39BSzCwvmdOaTyLqQ'
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
                    'projectIri': 'http://rdfh.ch/projects/Lw3FC39BSzCwvmdOaTyLqQ'
                }];
                return of(response);
            }
        );

        // simple text
        simpleTextHostFixture = TestBed.createComponent(SimpleTextHostComponent);
        simpleTextHostComponent = simpleTextHostFixture.componentInstance;
        simpleTextHostFixture.detectChanges();

        expect(simpleTextHostComponent).toBeTruthy();

        // link
        linkHostFixture = TestBed.createComponent(LinkHostComponent);
        linkHostComponent = linkHostFixture.componentInstance;
        linkHostFixture.detectChanges();

        expect(linkHostComponent).toBeTruthy();

        // list
        listHostFixture = TestBed.createComponent(ListHostComponent);
        listHostComponent = listHostFixture.componentInstance;
        listHostFixture.detectChanges();

        expect(listHostComponent).toBeTruthy();
    });

    it('should create an instance', () => {
        expect(simpleTextHostComponent.propertyFormComponent).toBeTruthy();
    });


    it('expect property type "text" has four labels but no comment"', () => {
        expect(simpleTextHostComponent.propertyFormComponent).toBeTruthy();
        expect(simpleTextHostComponent.propertyFormComponent.propertyInfo.propDef).toBeDefined();
        expect(simpleTextHostComponent.propertyFormComponent.propertyInfo.propType).toBeDefined();

        const form = linkHostComponent.propertyFormComponent.propertyForm;

        expect(simpleTextHostComponent.propertyFormComponent.labels).toEqual(
            [{
                'language': 'de',
                'value': 'Titel'
            }, {
                'language': 'en',
                'value': 'Title'
            }, {
                'language': 'fr',
                'value': 'Titre'
            }, {
                'language': 'it',
                'value': 'Titolo'
            }]
        );

        expect(simpleTextHostComponent.propertyFormComponent.comments).toEqual([]);

        expect(simpleTextHostComponent.propertyFormComponent.showGuiAttr).toBeFalsy();

    });

    it('should update labels when the value changes; error message should disapear', () => {

        const hostCompDe = simpleTextHostFixture.debugElement;
        const submitButton: DebugElement = hostCompDe.query(By.css('button.submit'));
        expect(submitButton.nativeElement.innerText).toContain('Update');

        simpleTextHostComponent.propertyFormComponent.handleData([{ language: 'de', value: 'New Label' }], 'label');
        simpleTextHostFixture.detectChanges();

        const formInvalidMessageDe: DebugElement = hostCompDe.query(By.css('string-literal-error'));
        expect(formInvalidMessageDe).toBeFalsy();

    });

    it('expect link to other resource called "Thing" ( = guiAttribute)', () => {
        expect(linkHostComponent.propertyFormComponent).toBeTruthy();
        expect(linkHostComponent.propertyFormComponent.propertyInfo.propDef).toBeDefined();
        expect(linkHostComponent.propertyFormComponent.propertyInfo.propType).toBeDefined();

        const form = linkHostComponent.propertyFormComponent.propertyForm;
        expect(form.controls['guiAttr'].value).toEqual('http://0.0.0.0:3333/ontology/0001/anything/v2#Thing');

    });

    it('expect link to List called "Tree list root" ( = guiAttribute)', () => {
        expect(listHostComponent.propertyFormComponent).toBeTruthy();
        expect(listHostComponent.propertyFormComponent.propertyInfo.propDef).toBeDefined();
        expect(listHostComponent.propertyFormComponent.propertyInfo.propType).toBeDefined();

        const form = listHostComponent.propertyFormComponent.propertyForm;
        expect(form.controls['guiAttr'].value).toEqual('http://rdfh.ch/lists/0001/otherTreeList');

    });

    it('expect "required" toggle switch (cardinality) to be disabled', () => {
        expect(simpleTextHostComponent.propertyFormComponent).toBeTruthy();
        expect(simpleTextHostComponent.propertyFormComponent.propertyInfo.propDef).toBeDefined();
        expect(simpleTextHostComponent.propertyFormComponent.propertyInfo.propType).toBeDefined();

        const form = simpleTextHostComponent.propertyFormComponent.propertyForm;
        expect(form.controls['required'].disabled).toBeTruthy();

    });

    it('expect "required" toggle switch (cardinality) to be enabled', () => {
        expect(linkHostComponent.propertyFormComponent).toBeTruthy();
        expect(linkHostComponent.propertyFormComponent.propertyInfo.propDef).toBeDefined();
        expect(linkHostComponent.propertyFormComponent.propertyInfo.propType).toBeDefined();

        const form = linkHostComponent.propertyFormComponent.propertyForm;
        expect(form.controls['required'].disabled).toBeFalsy();

    });
});
