import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, DebugElement, EventEmitter, Inject, Input, OnInit, Output, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonHarness } from '@angular/material/button/testing';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { ApiResponseData, Constants, CreateIntValue, CreateResource, CreateValue, MockOntology, MockProjects, MockResource, MockUsers, OntologiesEndpointV2, OntologiesMetadata, ReadOntology, ReadResource, ResourceClassAndPropertyDefinitions, ResourceClassDefinition, ResourcePropertyDefinition, ResourcesEndpointV2, StoredProject, UserResponse, UsersEndpointAdmin } from '@dasch-swiss/dsp-js';
import { OntologyCache } from '@dasch-swiss/dsp-js/src/cache/ontology-cache/OntologyCache';
import { DspApiConnectionToken, IntValueComponent, ResourceViewComponent, Session, SessionService, ValueService } from '@dasch-swiss/dsp-ui';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { AjaxResponse } from 'rxjs/ajax';
import { CacheService } from 'src/app/main/cache/cache.service';
import { ResourceInstanceFormComponent } from './resource-instance-form.component';
import { SwitchPropertiesComponent } from './select-properties/switch-properties/switch-properties.component';
import { BaseValueComponent } from 'src/app/base-value.component';
import { Router } from '@angular/router';

// https://dev.to/krumpet/generic-type-guard-in-typescript-258l
type Constructor<T> = { new(...args: any[]): T };

const typeGuard = <T>(o: any, className: Constructor<T>): o is T => {
    return o instanceof className;
};

/**
 * Test host component to simulate parent component.
 */
@Component({
    template: `
        <app-resource-instance-form #resourceInstanceFormComp></app-resource-instance-form>`
})
class TestHostComponent implements OnInit {

    @ViewChild('resourceInstanceFormComp') resourceInstanceFormComponent: ResourceInstanceFormComponent;

    constructor() {}

    ngOnInit() {
    }

}

/**
 * Mock select-project component to use in tests.
 */
@Component({
    selector: `app-select-project`
})
class MockSelectProjectComponent implements OnInit {
    @Input() formGroup: FormGroup;
    @Input() usersProjects: StoredProject[];
    @Output() projectSelected = new EventEmitter<string>();

    form: FormGroup;

    constructor(@Inject(FormBuilder) private _fb: FormBuilder) { }

    ngOnInit() {
        this.form = this._fb.group({
            projects: [null, Validators.required]
        });

        this.formGroup.addControl('projects', this.form);
    }
}

/**
 * Mock select-ontology component to use in tests.
 */
@Component({
    selector: `app-select-ontology`
})
class MockSelectOntologyComponent implements OnInit {
    @Input() formGroup: FormGroup;
    @Input() ontologiesMetadata: OntologiesMetadata;
    @Output() ontologySelected = new EventEmitter<string>();

    form: FormGroup;

    constructor(@Inject(FormBuilder) private _fb: FormBuilder) { }

    ngOnInit() {
        this.form = this._fb.group({
            ontologies: ['null, Validators.required']
        });

        this.formGroup.addControl('ontologies', this.form);
    }
}

/**
 * Mock select-resource-class component to use in tests.
 */
@Component({
    selector: `app-select-resource-class`
})
class MockSelectResourceClassComponent implements OnInit {
    @Input() formGroup: FormGroup;
    @Input() resourceClassDefinitions: ResourceClassDefinition[];

    label: string;
    form: FormGroup;

    constructor(@Inject(FormBuilder) private _fb: FormBuilder) { }

    ngOnInit() {
        this.form = this._fb.group({
            resources: ['null' , Validators.required],
            label: ['']
        });

        this.formGroup.addControl('resources', this.form);
    }
}

/**
 * Mock select-properties component to use in tests.
 */
@Component({
    selector: `app-select-properties`
})
class MockSelectPropertiesComponent {
    @ViewChildren('switchProp') switchPropertiesComponent: QueryList<SwitchPropertiesComponent>;

    @Input() propertiesAsArray: Array<ResourcePropertyDefinition>;

    @Input() ontologyInfo: ResourceClassAndPropertyDefinitions;

    @Input() resourceClass: ResourceClassDefinition;

    @Input() parentForm: FormGroup;

    parentResource = new ReadResource();

    constructor(private _valueService: ValueService) { }
}

/**
 * Mock switch-properties component to use in tests.
 */
@Component({
    selector: `app-switch-properties`
})
class MockSwitchPropertiesComponent {
    @ViewChild('createVal') createValueComponent: BaseValueComponent;

    @Input() property: ResourcePropertyDefinition;

    @Input() parentResource: ReadResource;

    @Input() parentForm: FormGroup;

    @Input() formName: string;
}

/**
 * Mock value component to use in tests.
 */
@Component({
    selector: `dsp-int-value`
})
class MockCreateIntValueComponent implements OnInit {

    @ViewChild('createVal') createValueComponent: IntValueComponent;

    @Input() parentForm: FormGroup;

    @Input() formName: string;

    @Input() mode;

    @Input() displayValue;

    form: FormGroup;

    valueFormControl: FormControl;

    constructor(@Inject(FormBuilder) private _fb: FormBuilder) { }

    ngOnInit(): void {
        this.valueFormControl = new FormControl(null, [Validators.required]);

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

describe('ResourceInstanceFormComponent', () => {
    let testHostComponent: TestHostComponent;
    let testHostFixture: ComponentFixture<TestHostComponent>;
    let resourceInstanceFormComponentDe: DebugElement;
    let loader: HarnessLoader;

    beforeEach(async(() => {
        const dspConnSpy = {
            admin: {
                usersEndpoint: jasmine.createSpyObj('usersEndpoint', ['getUserByUsername'])
            },
            v2: {
                onto: jasmine.createSpyObj('onto', ['getOntologiesByProjectIri']),
                ontologyCache: jasmine.createSpyObj('ontologyCache', ['getOntology', 'getResourceClassDefinition']),
                res: jasmine.createSpyObj('res', ['createResource'])
            }
        };

        const sessionServiceSpy = jasmine.createSpyObj('SessionService', ['getSession']);

        const cacheServiceSpy = jasmine.createSpyObj('CacheService', ['get']);

        const routerSpy = jasmine.createSpyObj('Router', ['navigate', 'navigateByUrl']);

        TestBed.configureTestingModule({
            declarations: [
                ResourceInstanceFormComponent,
                TestHostComponent,
                MockSelectProjectComponent,
                MockSelectOntologyComponent,
                MockSelectResourceClassComponent,
                MockSelectPropertiesComponent,
                MockSwitchPropertiesComponent,
                MockCreateIntValueComponent
            ],
            imports: [
                RouterTestingModule,
                ReactiveFormsModule,
                MatSelectModule,
                MatOptionModule,
                BrowserAnimationsModule,
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
                // {
                //     provide: Router,
                //     useValue: routerSpy
                // },
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

                return of(ApiResponseData.fromAjaxResponse({response} as AjaxResponse));
            }
        );

        // const routerSpy = TestBed.inject(Router);

        // (routerSpy as jasmine.SpyObj<Router>).navigate.and.stub();
        // (routerSpy as jasmine.SpyObj<Router>).navigateByUrl.and.stub();

        testHostFixture = TestBed.createComponent(TestHostComponent);
        testHostComponent = testHostFixture.componentInstance;
        loader = TestbedHarnessEnvironment.loader(testHostFixture);
        testHostFixture.detectChanges();

        const dspConnSpy = TestBed.inject(DspApiConnectionToken);

        (dspConnSpy.admin.usersEndpoint as jasmine.SpyObj<UsersEndpointAdmin>).getUserByUsername.and.callFake(
            () => {
                const loggedInUser = MockUsers.mockUser();
                return of(loggedInUser);
            }
        );

        const hostCompDe = testHostFixture.debugElement;

        resourceInstanceFormComponentDe = hostCompDe.query(By.directive(ResourceInstanceFormComponent));
    });

    it('should initialize the usersProjects array', () => {
        expect(testHostComponent.resourceInstanceFormComponent.usersProjects.length).toEqual(1);
    });

    it('should show the select project component', () => {

        const comp = resourceInstanceFormComponentDe.query(By.directive(MockSelectProjectComponent));

        expect((comp.componentInstance as MockSelectProjectComponent).usersProjects.length).toEqual(1);
    });

    it('should show the select ontology component', () => {
        const dspConnSpy = TestBed.inject(DspApiConnectionToken);

        (dspConnSpy.v2.onto as jasmine.SpyObj<OntologiesEndpointV2>).getOntologiesByProjectIri.and.callFake(
            () => {
                const anythingOnto = MockOntology.mockOntologiesMetadata();
                return of(anythingOnto);
            }
        );

        const selectProjectComp = resourceInstanceFormComponentDe.query(By.directive(MockSelectProjectComponent));

        (selectProjectComp.componentInstance as MockSelectProjectComponent).projectSelected.emit('http://0.0.0.0:3333/ontology/0001/anything/v2');

        testHostFixture.detectChanges();

        const selectOntoComp = resourceInstanceFormComponentDe.query(By.directive(MockSelectOntologyComponent));

        expect((selectOntoComp.componentInstance as MockSelectOntologyComponent).ontologiesMetadata.ontologies.length).toEqual(10);

        expect(dspConnSpy.v2.onto.getOntologiesByProjectIri).toHaveBeenCalledTimes(1);
    });

    it('should show the select resource class component', () => {
        const dspConnSpy = TestBed.inject(DspApiConnectionToken);

        (dspConnSpy.v2.ontologyCache as jasmine.SpyObj<OntologyCache>).getOntology.and.callFake(
            () => {

                const anythingOnto = MockOntology.mockReadOntology('http://0.0.0.0:3333/ontology/0001/anything/v2');

                const ontoMap: Map<string, ReadOntology> = new Map();

                ontoMap.set('http://0.0.0.0:3333/ontology/0001/anything/v2', anythingOnto);

                return of(ontoMap);
            }
        );

        testHostComponent.resourceInstanceFormComponent.ontologiesMetadata = MockOntology.mockOntologiesMetadata();

        testHostFixture.detectChanges();

        const selectOntoComp = resourceInstanceFormComponentDe.query(By.directive(MockSelectOntologyComponent));

        (selectOntoComp.componentInstance as MockSelectOntologyComponent).ontologySelected.emit('http://0.0.0.0:3333/ontology/0001/anything/v2');

        testHostFixture.detectChanges();

        const selectResourceClassComp = resourceInstanceFormComponentDe.query(By.directive(MockSelectResourceClassComponent));

        expect((selectResourceClassComp.componentInstance as MockSelectResourceClassComponent).resourceClassDefinitions.length).toEqual(8);
    });

    it('should show the select-properties component', async () => {

        const dspConnSpy = TestBed.inject(DspApiConnectionToken);

        (dspConnSpy.v2.ontologyCache as jasmine.SpyObj<OntologyCache>).getOntology.and.callFake(
            () => {

                const anythingOnto = MockOntology.mockReadOntology('http://0.0.0.0:3333/ontology/0001/anything/v2');

                const ontoMap: Map<string, ReadOntology> = new Map();

                ontoMap.set('http://0.0.0.0:3333/ontology/0001/anything/v2', anythingOnto);

                return of(ontoMap);
            }
        );

        const selectProjectComp = resourceInstanceFormComponentDe.query(By.directive(MockSelectProjectComponent));

        (selectProjectComp.componentInstance as MockSelectProjectComponent).form.controls.projects.setValue('http://rdfh.ch/projects/0001');

        testHostComponent.resourceInstanceFormComponent.ontologiesMetadata = MockOntology.mockOntologiesMetadata();

        testHostFixture.detectChanges();

        const selectOntoComp = resourceInstanceFormComponentDe.query(By.directive(MockSelectOntologyComponent));

        (selectOntoComp.componentInstance as MockSelectOntologyComponent).form.controls.ontologies.setValue('http://0.0.0.0:3333/ontology/0001/anything/v2');

        (selectOntoComp.componentInstance as MockSelectOntologyComponent).ontologySelected.emit('http://0.0.0.0:3333/ontology/0001/anything/v2');

        testHostFixture.detectChanges();

        const selectResourceClassComp = resourceInstanceFormComponentDe.query(By.directive(MockSelectResourceClassComponent));

        expect(selectResourceClassComp).toBeTruthy();

        (selectResourceClassComp.componentInstance as MockSelectResourceClassComponent).form.controls.resources.setValue('http://0.0.0.0:3333/ontology/0001/anything/v2#Thing');
        (selectResourceClassComp.componentInstance as MockSelectResourceClassComponent).form.controls.label.setValue('My Label');

        testHostComponent.resourceInstanceFormComponent.selectedResourceClass = (selectResourceClassComp.componentInstance as MockSelectResourceClassComponent).resourceClassDefinitions[1];

        testHostComponent.resourceInstanceFormComponent.resourceLabel = 'My Label';

        testHostFixture.detectChanges();

        expect(testHostComponent.resourceInstanceFormComponent.selectResourceForm.valid).toBeTruthy();

        const nextButton = await loader.getHarness(MatButtonHarness.with({selector: '.form-next'}));

        await nextButton.click();

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

        const resClasses = MockOntology.mockReadOntology('http://0.0.0.0:3333/ontology/0001/anything/v2').classes;

        const resClassIris = Object.keys(resClasses);

        // get resource class definitions
        const resourceClasses = resClassIris.filter(resClassIri => {
            return typeGuard(resClasses[resClassIri], ResourceClassDefinition);
        }).map(
            (resClassIri: string) => {
                return resClasses[resClassIri] as ResourceClassDefinition;
            }
        );

        testHostComponent.resourceInstanceFormComponent.selectedResourceClass = resourceClasses[1];

        testHostComponent.resourceInstanceFormComponent.resourceLabel = 'My Label';

        testHostComponent.resourceInstanceFormComponent.showNextStepForm = false;

        testHostComponent.resourceInstanceFormComponent.propertiesAsArray = new Array<ResourcePropertyDefinition>();

        MockResource.getTestThing().subscribe( res => {
            const resourcePropDef = (res.entityInfo as ResourceClassAndPropertyDefinitions).getAllPropertyDefinitions()[9];
            testHostComponent.resourceInstanceFormComponent.propertiesAsArray.push(resourcePropDef as ResourcePropertyDefinition);
        });

        testHostFixture.detectChanges();

        const selectPropertiesComp = resourceInstanceFormComponentDe.query(By.directive(MockSelectPropertiesComponent));

        expect(selectPropertiesComp).toBeTruthy();

        const props = {};
        const createVal = new CreateIntValue();
        createVal.int = 123;
        props['http://0.0.0.0:3333/ontology/0001/anything/v2#hasInteger'] = [createVal];

        const expectedCreateResource = new CreateResource();
        expectedCreateResource.label = 'My Label';
        expectedCreateResource.type = 'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing';
        expectedCreateResource.properties = props;

        // TODO: create a Router spy to mock the navigation
        testHostComponent.resourceInstanceFormComponent.submitData();

        expect(dspConnSpy.v2.res.createResource).toHaveBeenCalledTimes(1);

        // TODO: check if the spy was called with the correct argument
        // expect(dspConnSpy.v2.res.createResource).toHaveBeenCalledWith(expectedCreateResource);

    });
});
