import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, DebugElement, EventEmitter, Inject, Input, OnInit, Output, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatOptionModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
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
    OntologiesEndpointV2,
    OntologiesMetadata, ReadResource,
    ResourceClassAndPropertyDefinitions,
    ResourceClassDefinition,
    ResourcePropertyDefinition,
    ResourcesEndpointV2,
    StoredProject,
    UserResponse,
    UsersEndpointAdmin
} from '@dasch-swiss/dsp-js';
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
        <app-resource-instance-form #resourceInstanceFormComp></app-resource-instance-form>`
})
class TestHostComponent implements OnInit {

    @ViewChild('resourceInstanceFormComp') resourceInstanceFormComponent: ResourceInstanceFormComponent;

    constructor() { }

    ngOnInit() {
    }

}

/**
 * mock select-project component to use in tests.
 */
@Component({
    selector: 'app-select-project'
})
class MockSelectProjectComponent implements OnInit {
    @Input() formGroup: UntypedFormGroup;
    @Input() usersProjects: StoredProject[];
    @Input() selectedProject?: string;
    @Output() projectSelected = new EventEmitter<string>();

    form: UntypedFormGroup;

    constructor(@Inject(UntypedFormBuilder) private _fb: UntypedFormBuilder) { }

    ngOnInit() {
        this.form = this._fb.group({
            projects: [null, Validators.required]
        });

        resolvedPromise.then(() => {
            // add form to the parent form group
            this.formGroup.addControl('projects', this.form);
        });
    }
}

/**
 * mock select-ontology component to use in tests.
 */
@Component({
    selector: 'app-select-ontology'
})
class MockSelectOntologyComponent implements OnInit {
    @Input() formGroup: UntypedFormGroup;
    @Input() ontologiesMetadata: OntologiesMetadata;
    @Input() selectedOntology?: string;
    @Output() ontologySelected = new EventEmitter<string>();

    form: UntypedFormGroup;

    constructor(@Inject(UntypedFormBuilder) private _fb: UntypedFormBuilder) { }

    ngOnInit() {
        this.form = this._fb.group({
            ontologies: [null, Validators.required]
        });

        resolvedPromise.then(() => {
            // add form to the parent form group
            this.formGroup.addControl('ontologies', this.form);
        });
    }
}

/**
 * mock select-resource-class component to use in tests.
 */
@Component({
    selector: 'app-select-resource-class'
})
class MockSelectResourceClassComponent implements OnInit {
    @Input() formGroup: UntypedFormGroup;
    @Input() resourceClassDefinitions: ResourceClassDefinition[];
    @Input() selectedResourceClass?: string;

    form: UntypedFormGroup;

    constructor(@Inject(UntypedFormBuilder) private _fb: UntypedFormBuilder) { }

    ngOnInit() {
        this.form = this._fb.group({
            resources: [null, Validators.required]
        });

        resolvedPromise.then(() => {
            // add form to the parent form group
            this.formGroup.addControl('resources', this.form);
        });
    }
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

describe('ResourceInstanceFormComponent', () => {
    let testHostComponent: TestHostComponent;
    let testHostFixture: ComponentFixture<TestHostComponent>;
    let resourceInstanceFormComponentDe: DebugElement;
    let loader: HarnessLoader;

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
        // const routerSpy = jasmine.createSpyObj('Router', ['navigate', 'navigateByUrl']);

        TestBed.configureTestingModule({
            declarations: [
                ResourceInstanceFormComponent,
                TestHostComponent,
                MockSelectProjectComponent,
                MockSelectOntologyComponent,
                MockSelectResourceClassComponent,
                MockSelectPropertiesComponent,
                MockSwitchPropertiesComponent,
                MockCreateIntValueComponent,
                MockCreateTextValueComponent
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

                return of(ApiResponseData.fromAjaxResponse({ response } as AjaxResponse));
            }
        );

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

        expect((selectOntoComp.componentInstance as MockSelectOntologyComponent).ontologiesMetadata.ontologies.length).toEqual(11);

        expect(dspConnSpy.v2.onto.getOntologiesByProjectIri).toHaveBeenCalledTimes(1);
    });

    it('should show the select resource class component', () => {
        const dspConnSpy = TestBed.inject(DspApiConnectionToken);

        (dspConnSpy.v2.onto as jasmine.SpyObj<OntologiesEndpointV2>).getOntology.and.callFake(
            () => {

                const anythingOnto = MockOntology.mockReadOntology('http://0.0.0.0:3333/ontology/0001/anything/v2');
                return of(anythingOnto);
            }
        );

        testHostComponent.resourceInstanceFormComponent.ontologiesMetadata = MockOntology.mockOntologiesMetadata();

        testHostFixture.detectChanges();

        const selectOntoComp = resourceInstanceFormComponentDe.query(By.directive(MockSelectOntologyComponent));

        (selectOntoComp.componentInstance as MockSelectOntologyComponent).ontologySelected.emit('http://0.0.0.0:3333/ontology/0001/anything/v2');

        testHostFixture.detectChanges();

        const selectResourceClassComp = resourceInstanceFormComponentDe.query(By.directive(MockSelectResourceClassComponent));

        expect((selectResourceClassComp.componentInstance as MockSelectResourceClassComponent).resourceClassDefinitions.length).toEqual(12);
    });

    it('should show the select-properties component', async () => {

        const dspConnSpy = TestBed.inject(DspApiConnectionToken);

        (dspConnSpy.v2.onto as jasmine.SpyObj<OntologiesEndpointV2>).getOntology.and.callFake(
            () => {

                const anythingOnto = MockOntology.mockReadOntology('http://0.0.0.0:3333/ontology/0001/anything/v2');
                return of(anythingOnto);
            }
        );

        const nextButton = await loader.getHarness(MatButtonHarness.with({ selector: '.form-next' }));

        const selectProjectComp = resourceInstanceFormComponentDe.query(By.directive(MockSelectProjectComponent));

        (selectProjectComp.componentInstance as MockSelectProjectComponent).form.controls.projects.setValue('http://rdfh.ch/projects/Lw3FC39BSzCwvmdOaTyLqQ');

        testHostComponent.resourceInstanceFormComponent.selectedProject = 'http://rdfh.ch/projects/Lw3FC39BSzCwvmdOaTyLqQ';

        testHostComponent.resourceInstanceFormComponent.ontologiesMetadata = MockOntology.mockOntologiesMetadata();

        testHostFixture.detectChanges();

        expect(nextButton.isDisabled).toBeTruthy();

        const selectOntoComp = resourceInstanceFormComponentDe.query(By.directive(MockSelectOntologyComponent));

        (selectOntoComp.componentInstance as MockSelectOntologyComponent).form.controls.ontologies.setValue('http://0.0.0.0:3333/ontology/0001/anything/v2');

        (selectOntoComp.componentInstance as MockSelectOntologyComponent).ontologySelected.emit('http://0.0.0.0:3333/ontology/0001/anything/v2');

        testHostComponent.resourceInstanceFormComponent.selectedOntology = 'http://0.0.0.0:3333/ontology/0001/anything/v2';

        testHostFixture.detectChanges();

        expect(nextButton.isDisabled).toBeTruthy();

        const selectResourceClassComp = resourceInstanceFormComponentDe.query(By.directive(MockSelectResourceClassComponent));

        expect(selectResourceClassComp).toBeTruthy();

        (selectResourceClassComp.componentInstance as MockSelectResourceClassComponent).form.controls.resources.setValue('http://0.0.0.0:3333/ontology/0001/anything/v2#Thing');

        testHostComponent.resourceInstanceFormComponent.selectedResourceClass = (selectResourceClassComp.componentInstance as MockSelectResourceClassComponent).resourceClassDefinitions[1];

        testHostComponent.resourceInstanceFormComponent.resourceLabel = 'My Label';

        testHostFixture.detectChanges();

        expect(testHostComponent.resourceInstanceFormComponent.selectResourceForm.valid).toBeTruthy();

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

        const anythingOnto = MockOntology.mockReadOntology('http://0.0.0.0:3333/ontology/0001/anything/v2');

        // get resource class definitions
        const resourceClasses = anythingOnto.getClassDefinitionsByType(ResourceClassDefinition);

        testHostComponent.resourceInstanceFormComponent.selectedResourceClass = resourceClasses[1];

        testHostComponent.resourceInstanceFormComponent.resourceLabel = 'My Label';

        testHostComponent.resourceInstanceFormComponent.showNextStepForm = false;

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
