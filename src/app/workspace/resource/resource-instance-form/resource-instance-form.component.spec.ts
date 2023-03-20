import { Component, DebugElement, Inject, Input, OnInit, Output, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatLegacyOptionModule as MatOptionModule } from '@angular/material/legacy-core';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MatLegacySnackBarModule as MatSnackBarModule } from '@angular/material/legacy-snack-bar';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import {
    ApiResponseData,
    CreateIntValue,
    CreateResource,
    CreateTextValueAsString,
    CreateValue,
    MockOntology,
    MockProjects,
    MockResource,
    MockUsers,
    ReadOntology,
    ReadResource,
    ResourceClassAndPropertyDefinitions,
    ResourceClassDefinition,
    ResourcePropertyDefinition,
    ResourcesEndpointV2,
    StoredProject,
    UserResponse,
    UsersEndpointAdmin
} from '@dasch-swiss/dsp-js';
import { OntologyCache } from '@dasch-swiss/dsp-js/src/cache/ontology-cache/OntologyCache';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { AjaxResponse } from 'rxjs/ajax';
import { AppInitService } from 'src/app/app-init.service';
import { CacheService } from 'src/app/main/cache/cache.service';
import { DspApiConnectionToken } from 'src/app/main/declarations/dsp-api-tokens';
import { BaseValueDirective } from 'src/app/main/directive/base-value.directive';
import { Session, SessionService } from 'src/app/main/services/session.service';
import { ValueService } from '../services/value.service';
import { IntValueComponent } from '../values/int-value/int-value.component';
import { TextValueAsStringComponent } from '../values/text-value/text-value-as-string/text-value-as-string.component';
import { ResourceInstanceFormComponent } from './resource-instance-form.component';
import { SwitchPropertiesComponent } from './select-properties/switch-properties/switch-properties.component';

const resolvedPromise = Promise.resolve(null);

/**
 * test host component to simulate parent component.
 */
@Component({
    template: `
        <app-resource-instance-form #resourceInstanceFormComp [resourceClassIri]="resourceClassIri" [projectIri]="projectIri"></app-resource-instance-form>`
})
class TestHostComponent {

    @ViewChild('resourceInstanceFormComp') resourceInstanceFormComponent: ResourceInstanceFormComponent;
    resourceClassIri = 'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing';
    projectIri = 'http://rdfh.ch/projects/0001';

}

/**
 * mock select-properties component to use in tests.
 */
@Component({
    selector: 'app-select-properties',
    template: `
        <app-text-value-as-string #createVal
            [mode]="'create'"
            [commentDisabled]="true"
            [valueRequiredValidator]="true"
            [parentForm]="parentForm"
            [formName]="'label'">
        </app-text-value-as-string>
    `
})
class MockSelectPropertiesComponent {
    @ViewChildren('switchProp') switchPropertiesComponent: QueryList<SwitchPropertiesComponent>;

    // input for resource's label
    @ViewChild('createVal') createValueComponent: BaseValueDirective;

    @Input() properties: ResourcePropertyDefinition[];

    @Input() ontologyInfo: ResourceClassAndPropertyDefinitions;

    @Input() resourceClass: ResourceClassDefinition;

    @Input() parentForm: UntypedFormGroup;

    @Input() currentOntoIri: string;

    @Input() selectedResourceClass: ResourceClassDefinition;

    parentResource = new ReadResource();

    constructor(private _valueService: ValueService) { }
}

/**
 * mock switch-properties component to use in tests.
 */
@Component({
    selector: 'app-switch-properties'
})
class MockSwitchPropertiesComponent {
    @ViewChild('createVal') createValueComponent: BaseValueDirective;

    @Input() property: ResourcePropertyDefinition;

    @Input() parentResource: ReadResource;

    @Input() parentForm: UntypedFormGroup;

    @Input() formName: string;
}

/**
 * mock value component to use in tests.
 */
@Component({
    selector: 'dsp-int-value'
})
class MockCreateIntValueComponent implements OnInit {

    @ViewChild('createVal') createValueComponent: IntValueComponent;

    @Input() parentForm: UntypedFormGroup;

    @Input() formName: string;

    @Input() mode;

    @Input() displayValue;

    form: UntypedFormGroup;

    valueFormControl: UntypedFormControl;

    constructor(@Inject(UntypedFormBuilder) private _fb: UntypedFormBuilder) { }

    ngOnInit(): void {
        this.valueFormControl = new UntypedFormControl(null, [Validators.required]);

        this.form = this._fb.group({
            test: this.valueFormControl
        });
    }

    getNewValue(): CreateValue {
        const createIntVal = new CreateIntValue();

        createIntVal.int = 123;

        return createIntVal;
    }

    updateCommentVisibility(): void { }
}

/**
 * mock value component to use in tests.
 */
@Component({
    selector: 'app-text-value-as-string'
})
class MockCreateTextValueComponent implements OnInit {

    @ViewChild('createVal') createValueComponent: TextValueAsStringComponent;

    @Input() parentForm: UntypedFormGroup;

    @Input() formName: string;

    @Input() mode;

    @Input() displayValue;

    @Input() commentDisabled?: boolean;

    @Input() valueRequiredValidator: boolean;

    form: UntypedFormGroup;

    valueFormControl: UntypedFormControl;
    constructor(@Inject(UntypedFormBuilder) private _fb: UntypedFormBuilder) { }
    ngOnInit(): void {
        this.valueFormControl = new UntypedFormControl(null, [Validators.required]);
        this.form = this._fb.group({
            label: this.valueFormControl
        });
    }
    getNewValue(): CreateValue {
        const createTextVal = new CreateTextValueAsString();
        createTextVal.text = 'My Label';
        return createTextVal;
    }
    updateCommentVisibility(): void { }
}

@Component({
    selector: 'app-progress-indicator',
    template: ''
})
class MockProgressIndicatorComponent {

}

describe('ResourceInstanceFormComponent', () => {
    let testHostComponent: TestHostComponent;
    let testHostFixture: ComponentFixture<TestHostComponent>;
    let resourceInstanceFormComponentDe: DebugElement;

    beforeEach(waitForAsync(() => {
        const dspConnSpy = {
            admin: {
                usersEndpoint: jasmine.createSpyObj('usersEndpoint', ['getUserByUsername'])
            },
            v2: {
                onto: jasmine.createSpyObj('onto', ['getOntologiesByProjectIri', 'getOntology', 'getResourceClassDefinition']),
                ontologyCache: jasmine.createSpyObj('ontologyCache', ['getOntology', 'getResourceClassDefinition', 'reloadCachedItem']),
                res: jasmine.createSpyObj('res', ['createResource'])
            }
        };

        const sessionServiceSpy = jasmine.createSpyObj('SessionService', ['getSession']);

        const cacheServiceSpy = jasmine.createSpyObj('CacheService', ['get']);

        const appInitSpy = {
            dspAppConfig: {
                iriBase: 'http://rdfh.ch'
            }
        };

        const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

        TestBed.configureTestingModule({
            declarations: [
                ResourceInstanceFormComponent,
                TestHostComponent,
                MockSelectPropertiesComponent,
                MockSwitchPropertiesComponent,
                MockCreateIntValueComponent,
                MockCreateTextValueComponent,
                MockProgressIndicatorComponent
            ],
            imports: [
                BrowserAnimationsModule,
                MatButtonModule,
                MatDialogModule,
                MatFormFieldModule,
                MatOptionModule,
                MatSelectModule,
                MatSnackBarModule,
                ReactiveFormsModule,
                RouterTestingModule,
                TranslateModule.forRoot()
            ],
            providers: [
                {
                    provide: DspApiConnectionToken,
                    useValue: dspConnSpy
                },
                {
                    provide: SessionService,
                    useValue: sessionServiceSpy
                },
                {
                    provide: CacheService,
                    useValue: cacheServiceSpy
                },
                {
                    provide: AppInitService,
                    useValue: appInitSpy
                },
                {
                    provide: ActivatedRoute,
                    useValue: {
                        parent: {
                            snapshot: {
                                url: [
                                    { path: 'project' }
                                ]
                            }
                        },
                        snapshot: {
                            url: [
                                { path: 'ontology' },
                                { path: 'anything' },
                                { path: 'thing' },
                                { path: 'add' }
                            ],
                        }
                    }
                },
                {
                    provide: Router,
                    useValue: routerSpy
                },
                ValueService
            ]
        })
            .compileComponents();

    }));

    beforeEach(() => {

        const sessionSpy = TestBed.inject(SessionService);

        (sessionSpy as jasmine.SpyObj<SessionService>).getSession.and.callFake(
            () => {
                const session: Session = {
                    id: 12345,
                    user: {
                        name: 'username',
                        jwt: 'myToken',
                        lang: 'en',
                        sysAdmin: false,
                        projectAdmin: []
                    }
                };

                return session;
            }
        );

        const cacheSpy = TestBed.inject(CacheService);

        (cacheSpy as jasmine.SpyObj<CacheService>).get.and.callFake(
            () => {
                const response: UserResponse = new UserResponse();

                const project = MockProjects.mockProject();

                response.user.projects = new Array<StoredProject>();

                response.user.projects.push(project.body.project);

                return of(ApiResponseData.fromAjaxResponse({ response } as AjaxResponse));
            }
        );

        const dspConnSpy = TestBed.inject(DspApiConnectionToken);

        (dspConnSpy.v2.ontologyCache as jasmine.SpyObj<OntologyCache>).getResourceClassDefinition.and.callFake(
            (resClassIri: string) => of(MockOntology.mockIResourceClassAndPropertyDefinitions('http://0.0.0.0:3333/ontology/0001/anything/v2#Thing'))
        );

        (dspConnSpy.v2.ontologyCache as jasmine.SpyObj<OntologyCache>).reloadCachedItem.and.callFake(
            (key: string) => {
                const response: ReadOntology = MockOntology.mockReadOntology('http://0.0.0.0:3333/ontology/0001/anything/v2');
                return of(response);
            }
        );

        // mock router
        const routerSpy = TestBed.inject(Router);

        (routerSpy as jasmine.SpyObj<Router>).navigate.and.returnValue(Promise.resolve(true));

        testHostFixture = TestBed.createComponent(TestHostComponent);
        testHostComponent = testHostFixture.componentInstance;
        testHostFixture.detectChanges();

        (dspConnSpy.admin.usersEndpoint as jasmine.SpyObj<UsersEndpointAdmin>).getUserByUsername.and.callFake(
            () => {
                const loggedInUser = MockUsers.mockUser();
                return of(loggedInUser);
            }
        );


        const hostCompDe = testHostFixture.debugElement;

        resourceInstanceFormComponentDe = hostCompDe.query(By.directive(ResourceInstanceFormComponent));
    });

    it('should show the select-properties component', () => {

        const selectPropertiesComp = resourceInstanceFormComponentDe.query(By.directive(MockSelectPropertiesComponent));

        expect(selectPropertiesComp).toBeTruthy();

    });

    it('should submit the form', () => {
        const dspConnSpy = TestBed.inject(DspApiConnectionToken);

        (dspConnSpy.v2.res as jasmine.SpyObj<ResourcesEndpointV2>).createResource.and.callFake(
            () => {
                let resource = new ReadResource();

                MockResource.getTestThing().subscribe((res) => {
                    resource = res;
                });

                return of(resource);
            }
        );

        const anythingOnto = MockOntology.mockReadOntology('http://0.0.0.0:3333/ontology/0001/anything/v2');

        // get resource class definitions
        const resourceClasses = anythingOnto.getClassDefinitionsByType(ResourceClassDefinition);

        testHostComponent.resourceInstanceFormComponent.resourceClass = resourceClasses[1];

        testHostComponent.resourceInstanceFormComponent.resourceLabel = 'My Label';

        testHostComponent.resourceInstanceFormComponent.properties = new Array<ResourcePropertyDefinition>();

        MockResource.getTestThing().subscribe(res => {
            const resourcePropDef = (res.entityInfo as ResourceClassAndPropertyDefinitions).getAllPropertyDefinitions()[9];
            testHostComponent.resourceInstanceFormComponent.properties.push(resourcePropDef as ResourcePropertyDefinition);
        });

        testHostFixture.detectChanges();

        const selectPropertiesComp = resourceInstanceFormComponentDe.query(By.directive(MockSelectPropertiesComponent));

        expect(selectPropertiesComp).toBeTruthy();

        const label = new CreateTextValueAsString();
        label.text = 'My Label';

        const props = {};
        const createVal = new CreateIntValue();
        createVal.int = 123;
        props['http://0.0.0.0:3333/ontology/0001/anything/v2#hasInteger'] = [createVal];

        const expectedCreateResource = new CreateResource();
        expectedCreateResource.label = 'My Label';
        expectedCreateResource.type = 'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing';
        expectedCreateResource.properties = props;

        // --> TODO create a Router spy to mock the navigation
        testHostComponent.resourceInstanceFormComponent.submitData();

        expect(dspConnSpy.v2.res.createResource).toHaveBeenCalledTimes(1);

        // --> TODO check if the spy was called with the correct argument
        // expect(dspConnSpy.v2.res.createResource).toHaveBeenCalledWith(expectedCreateResource);

    });
});
