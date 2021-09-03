import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Component, DebugElement, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { MockOntology, ReadOntology } from '@dasch-swiss/dsp-js';
import { DspActionModule } from '@dasch-swiss/dsp-ui';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { CacheService } from 'src/app/main/cache/cache.service';
import { DspApiConnectionToken } from 'src/app/main/declarations/dsp-api-tokens';
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

describe('PropertyFormComponent', () => {
    let simpleTextHostComponent: SimpleTextHostComponent;
    let simpleTextHostFixture: ComponentFixture<SimpleTextHostComponent>;

    let linkHostComponent: LinkHostComponent;
    let linkHostFixture: ComponentFixture<LinkHostComponent>;

    beforeEach(waitForAsync(() => {

        const cacheServiceSpyOnto = jasmine.createSpyObj('CacheServiceOnto', ['get']);
        const cacheServiceSpyLists = jasmine.createSpyObj('CacheServiceLists', ['get']);

        const ontologyEndpointSpyObj = {
            v2: {
                onto: jasmine.createSpyObj('onto', ['updateResourceProperty', 'createResourceProperty', 'replaceGuiElementOfProperty'])
            }
        };

        TestBed.configureTestingModule({
            declarations: [
                LinkHostComponent,
                SimpleTextHostComponent,
                PropertyFormComponent
            ],
            imports: [
                BrowserAnimationsModule,
                DspActionModule,
                HttpClientTestingModule,
                MatAutocompleteModule,
                MatButtonModule,
                MatFormFieldModule,
                MatIconModule,
                MatInputModule,
                MatOptionModule,
                MatSelectModule,
                ReactiveFormsModule,
                RouterTestingModule,
                TranslateModule.forRoot()
            ],
            providers: [
                {
                    provide: DspApiConnectionToken,
                    useValue: ontologyEndpointSpyObj
                },
                {
                    provide: CacheService,
                    useValue: cacheServiceSpyOnto
                },
                {
                    provide: CacheService,
                    useValue: cacheServiceSpyLists
                }
            ]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        const cacheSpyOnto = TestBed.inject(CacheService);

        // mock cache service for currentOntology
        (cacheSpyOnto as jasmine.SpyObj<CacheService>).get.and.callFake(
            () => {
                const response: ReadOntology = MockOntology.mockReadOntology('http://0.0.0.0:3333/ontology/0001/anything/v2');
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

    it('should update labels when the value changes', () => {

        const hostCompDe = simpleTextHostFixture.debugElement;
        const submitButton: DebugElement = hostCompDe.query(By.css('button.submit'));
        expect(submitButton.nativeElement.innerText).toContain('Update');

        simpleTextHostComponent.propertyFormComponent.handleData([], 'labels');
        simpleTextHostFixture.detectChanges();

        const formInvalidMessageDe: DebugElement = hostCompDe.query(By.css('mat-hint'));
        expect(formInvalidMessageDe.nativeElement.innerText).toEqual(' Label is required ');

    });

    it('expect link to other resource called "Thing"', () => {
        expect(linkHostComponent.propertyFormComponent).toBeTruthy();
        expect(linkHostComponent.propertyFormComponent.propertyInfo.propDef).toBeDefined();
        expect(linkHostComponent.propertyFormComponent.propertyInfo.propType).toBeDefined();

        const form = linkHostComponent.propertyFormComponent.propertyForm;

        expect(form.controls['guiAttr'].value).toEqual('http://0.0.0.0:3333/ontology/0001/anything/v2#Thing');

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
