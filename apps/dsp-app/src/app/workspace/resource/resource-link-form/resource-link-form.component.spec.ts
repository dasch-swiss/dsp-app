import {
    Component,
    DebugElement,
    EventEmitter,
    Inject,
    Input,
    OnInit,
    Output,
    ViewChild,
} from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import {
    UntypedFormBuilder,
    UntypedFormGroup,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import {
    ApiResponseData,
    Constants,
    CreateLinkValue,
    CreateResource,
    MockProjects,
    MockResource,
    MockUsers,
    ReadResource,
    ResourcesEndpointV2,
    StoredProject,
    UserResponse,
    UsersEndpointAdmin,
} from '@dasch-swiss/dsp-js';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { AjaxResponse } from 'rxjs/ajax';
import { AppConfigService } from '@dasch-swiss/vre/shared/app-config';
import { ApplicationStateService } from '@dasch-swiss/vre/shared/app-state-service';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { Session, SessionService } from '@dasch-swiss/vre/shared/app-session';
import { FilteredResources } from '../../results/list-view/list-view.component';
import { ResourceLinkFormComponent } from './resource-link-form.component';
import { MockProvider } from 'ng-mocks';
import { AppLoggingService } from '@dasch-swiss/vre/shared/app-logging';

const resolvedPromise = Promise.resolve(null);

/**
 * test host component to simulate parent component.
 */
@Component({
    template: ` <app-resource-link-form
        #resourceLinkFormComp
        [resources]="resources"
    ></app-resource-link-form>`,
})
class TestHostComponent implements OnInit {
    @ViewChild('resourceLinkFormComp')
    resourceLinkFormComponent: ResourceLinkFormComponent;

    resources: FilteredResources = {
        count: 3,
        resListIndex: [3, 2, 1],
        resInfo: [
            {
                id: 'http://rdfh.ch/0803/83616f8d8501',
                label: '65r',
            },
            {
                id: 'http://rdfh.ch/0803/71e0b9958a01',
                label: '76r',
            },
            {
                id: 'http://rdfh.ch/0803/683d5cd26f01',
                label: '17v',
            },
        ],
        selectionType: 'multiple',
    };

    constructor() {}

    ngOnInit() {}
}

/**
 * mock select-project component to use in tests.
 */
@Component({
    selector: 'app-select-project',
})
class MockSelectProjectComponent implements OnInit {
    @Input() formGroup: UntypedFormGroup;
    @Input() usersProjects: StoredProject[];
    @Output() projectSelected = new EventEmitter<string>();

    form: UntypedFormGroup;

    constructor(@Inject(UntypedFormBuilder) private _fb: UntypedFormBuilder) {}

    ngOnInit() {
        this.form = this._fb.group({
            projects: [null, Validators.required],
        });

        resolvedPromise.then(() => {
            // add form to the parent form group
            this.formGroup.addControl('projects', this.form);
        });
    }
}

describe('ResourceLinkFormComponent', () => {
    let testHostComponent: TestHostComponent;
    let testHostFixture: ComponentFixture<TestHostComponent>;
    let resourceLinkFormComponentDe: DebugElement;

    beforeEach(waitForAsync(() => {
        const dspConnSpy = {
            admin: {
                usersEndpoint: jasmine.createSpyObj('usersEndpoint', [
                    'getUserByUsername',
                ]),
            },
            v2: {
                onto: jasmine.createSpyObj('onto', [
                    'getOntologiesByProjectIri',
                ]),
                ontologyCache: jasmine.createSpyObj('ontologyCache', [
                    'getOntology',
                    'getResourceClassDefinition',
                ]),
                res: jasmine.createSpyObj('res', ['createResource']),
            },
        };

        const sessionServiceSpy = jasmine.createSpyObj('SessionService', [
            'getSession',
        ]);

        const applicationStateServiceSpy = jasmine.createSpyObj(
            'ApplicationStateService',
            ['get']
        );

        const appInitSpy = {
            dspAppConfig: {
                iriBase: 'http://rdfh.ch',
            },
        };

        TestBed.configureTestingModule({
            declarations: [
                ResourceLinkFormComponent,
                TestHostComponent,
                MockSelectProjectComponent,
            ],
            imports: [
                BrowserAnimationsModule,
                MatButtonModule,
                MatDialogModule,
                MatFormFieldModule,
                MatIconModule,
                MatInputModule,
                MatSelectModule,
                MatSnackBarModule,
                MatTooltipModule,
                ReactiveFormsModule,
                RouterTestingModule,
                TranslateModule.forRoot(),
            ],
            providers: [
                AppConfigService,
                MockProvider(AppLoggingService),
                {
                    provide: DspApiConnectionToken,
                    useValue: dspConnSpy,
                },
                {
                    provide: SessionService,
                    useValue: sessionServiceSpy,
                },
                {
                    provide: ApplicationStateService,
                    useValue: applicationStateServiceSpy,
                },
                {
                    provide: AppConfigService,
                    useValue: appInitSpy,
                },
            ],
        }).compileComponents();
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
                        projectAdmin: [],
                    },
                };

                return session;
            }
        );

        const applicationStateServiceSpy = TestBed.inject(
            ApplicationStateService
        );

        (
            applicationStateServiceSpy as jasmine.SpyObj<ApplicationStateService>
        ).get.and.callFake(() => {
            const response: UserResponse = new UserResponse();

            const project = MockProjects.mockProject();

            response.user.projects = new Array<StoredProject>();

            response.user.projects.push(project.body.project);

            return of(response.user);
        });

        testHostFixture = TestBed.createComponent(TestHostComponent);
        testHostComponent = testHostFixture.componentInstance;
        testHostFixture.detectChanges();

        const dspConnSpy = TestBed.inject(DspApiConnectionToken);

        (
            dspConnSpy.admin.usersEndpoint as jasmine.SpyObj<UsersEndpointAdmin>
        ).getUserByUsername.and.callFake(() => {
            const loggedInUser = MockUsers.mockUser();
            return of(loggedInUser);
        });

        const hostCompDe = testHostFixture.debugElement;

        resourceLinkFormComponentDe = hostCompDe.query(
            By.directive(ResourceLinkFormComponent)
        );
    });

    it('should initialize the usersProjects array', () => {
        expect(
            testHostComponent.resourceLinkFormComponent.usersProjects.length
        ).toEqual(1);
    });

    it('should show the select project component', () => {
        const comp = resourceLinkFormComponentDe.query(
            By.directive(MockSelectProjectComponent)
        );

        expect(
            (comp.componentInstance as MockSelectProjectComponent).usersProjects
                .length
        ).toEqual(1);
    });

    it('should submit the form', () => {
        const dspConnSpy = TestBed.inject(DspApiConnectionToken);

        (
            dspConnSpy.v2.res as jasmine.SpyObj<ResourcesEndpointV2>
        ).createResource.and.callFake(() => {
            let resource = new ReadResource();

            MockResource.getTestThing().subscribe((res) => {
                resource = res;
            });

            return of(resource);
        });

        testHostComponent.resourceLinkFormComponent.form.controls[
            'label'
        ].setValue('My Label');

        testHostFixture.detectChanges();

        const props = {};
        const createVal: CreateLinkValue[] = [];
        // res 1
        testHostComponent.resources.resInfo.forEach((res) => {
            const linkVal = new CreateLinkValue();
            linkVal.linkedResourceIri = res.id;
            linkVal.type = Constants.LinkValue;
            createVal.push(linkVal);
        });

        props[Constants.HasLinkToValue] = createVal;

        const expectedCreateResource = new CreateResource();
        expectedCreateResource.label = 'My Label';
        expectedCreateResource.type = Constants.LinkObj;
        expectedCreateResource.properties = props;

        // --> TODO create a Router spy to mock the navigation
        testHostComponent.resourceLinkFormComponent.submitData();

        expect(dspConnSpy.v2.res.createResource).toHaveBeenCalledTimes(1);
    });
});
