import { ClipboardModule } from '@angular/cdk/clipboard';
import {
    Component,
    EventEmitter,
    Input,
    OnDestroy,
    OnInit,
    Output,
    ViewChild,
} from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import {
    ApiResponseError,
    Constants,
    IHasPropertyWithPropertyDefinition,
    MockProjects,
    MockResource,
    MockUsers,
    ProjectsEndpointAdmin,
    ReadLinkValue,
    ReadResource,
    ReadResourceSequence,
    ReadValue,
    ResourcePropertyDefinition,
    SystemPropertyDefinition,
} from '@dasch-swiss/dsp-js';
import { of, Subscription } from 'rxjs';
import { AppConfigService } from '@dasch-swiss/vre/shared/app-config';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { DspResource } from '../dsp-resource';
import { IncomingService } from '../services/incoming.service';
import { UserService } from '../services/user.service';
import {
    EmitEvent,
    Events,
    ValueOperationEventService,
} from '../services/value-operation-event.service';
import {
    PropertiesComponent,
    PropertyInfoValues,
} from './properties.component';

/**
 * test host component to simulate parent component.
 */
@Component({
    template: ` <app-properties #propView [resource]="parentResource">
    </app-properties>`,
})
class TestPropertyParentComponent implements OnInit, OnDestroy {
    @ViewChild('propView') propertiesComponent: PropertiesComponent;

    parentResource: DspResource;

    voeSubscriptions: Subscription[] = [];

    myNum = 0;

    constructor(
        public _valueOperationEventService: ValueOperationEventService
    ) {}

    ngOnInit() {
        this.voeSubscriptions.push(
            this._valueOperationEventService.on(
                Events.ValueAdded,
                () => (this.myNum = 1)
            )
        );
        this.voeSubscriptions.push(
            this._valueOperationEventService.on(
                Events.ValueUpdated,
                () => (this.myNum = 2)
            )
        );
        this.voeSubscriptions.push(
            this._valueOperationEventService.on(
                Events.ValueDeleted,
                () => (this.myNum = 3)
            )
        );

        MockResource.getTestThing().subscribe(
            (response: ReadResource) => {
                this.parentResource = new DspResource(response);

                // gather resource property information
                this.parentResource.resProps =
                    this.parentResource.res.entityInfo.classes[
                        this.parentResource.res.type
                    ]
                        .getResourcePropertiesList()
                        .map((prop: IHasPropertyWithPropertyDefinition) => {
                            const propInfoAndValues: PropertyInfoValues = {
                                propDef: prop.propertyDefinition,
                                guiDef: prop,
                                values: this.parentResource.res.getValues(
                                    prop.propertyIndex
                                ),
                            };
                            return propInfoAndValues;
                        });

                // sort properties by guiOrder
                this.parentResource.resProps.sort((a, b) =>
                    a.guiDef.guiOrder > b.guiDef.guiOrder ? 1 : -1
                );

                // get system property information
                this.parentResource.systemProps =
                    this.parentResource.res.entityInfo.getPropertyDefinitionsByType(
                        SystemPropertyDefinition
                    );
            },
            (error: ApiResponseError) => {
                console.error('Error to get the mock resource', error);
            }
        );
    }

    ngOnDestroy() {
        if (this.voeSubscriptions) {
            this.voeSubscriptions.forEach((sub) => sub.unsubscribe());
        }
    }
}

/**
 * test host component to simulate child component, here display-edit.
 */
@Component({
    selector: 'app-display-edit',
    template: '',
})
class TestDisplayValueComponent {
    @Input() displayValue: ReadValue;
    @Input() propArray: PropertyInfoValues[];
    @Input() parentResource: DspResource;
    @Input() configuration?: object;
    @Input() canDelete: boolean;
    @Input() projectStatus: boolean;
    @Input() valueUuidToHighlight: string;

    @Output() referredResourceClicked: EventEmitter<ReadLinkValue> =
        new EventEmitter<ReadLinkValue>();
    @Output() referredResourceHovered: EventEmitter<ReadLinkValue> =
        new EventEmitter<ReadLinkValue>();
}

/**
 * test host component to simulate child component, here add-value.
 */
@Component({
    selector: 'app-add-value',
    template: '',
})
class TestAddValueComponent {
    @Input() parentResource: DspResource;
    @Input() resourcePropertyDefinition: ResourcePropertyDefinition;
}

/**
 * test component that mocks PermissionInfoComponent
 */
@Component({ selector: 'app-permission-info', template: '' })
class MockPermissionInfoComponent {
    @Input() hasPermissions: string;
    @Input() userHasPermission: string;
    constructor() {}
}

describe('PropertiesComponent', () => {
    let testHostComponent: TestPropertyParentComponent;
    let testHostFixture: ComponentFixture<TestPropertyParentComponent>;
    let voeService: ValueOperationEventService;

    beforeEach(waitForAsync(() => {
        const adminSpyObj = {
            admin: {
                projectsEndpoint: jasmine.createSpyObj('projectsEndpoint', [
                    'getProjectByIri',
                ]),
            },
        };

        const userServiceSpy = jasmine.createSpyObj('UserService', ['getUser']);

        const incomingServiceSpy = jasmine.createSpyObj('IncomingService', [
            'getIncomingLinks',
        ]);

        const appInitSpy = {
            dspAppConfig: {
                iriBase: 'http://rdfh.ch',
            },
        };

        TestBed.configureTestingModule({
            imports: [
                BrowserAnimationsModule,
                ClipboardModule,
                MatDialogModule,
                MatIconModule,
                MatMenuModule,
                MatSnackBarModule,
                MatTooltipModule,
                RouterTestingModule,
            ],
            declarations: [
                TestPropertyParentComponent,
                TestDisplayValueComponent,
                TestAddValueComponent,
                PropertiesComponent,
                MockPermissionInfoComponent,
            ],
            providers: [
                ValueOperationEventService,
                AppConfigService,
                {
                    provide: DspApiConnectionToken,
                    useValue: adminSpyObj,
                },
                {
                    provide: UserService,
                    useValue: userServiceSpy,
                },
                {
                    provide: IncomingService,
                    useValue: incomingServiceSpy,
                },
                {
                    provide: AppConfigService,
                    useValue: appInitSpy,
                },
            ],
        }).compileComponents();

        voeService = TestBed.inject(ValueOperationEventService);
    }));

    // mock localStorage
    beforeEach(() => {
        let store = {};

        spyOn(localStorage, 'getItem').and.callFake(
            (key: string): string => store[key] || null
        );
        spyOn(localStorage, 'removeItem').and.callFake((key: string): void => {
            delete store[key];
        });
        spyOn(localStorage, 'setItem').and.callFake(
            (key: string, value: string): string => (store[key] = <any>value)
        );
        spyOn(localStorage, 'clear').and.callFake(() => {
            store = {};
        });
    });

    beforeEach(() => {
        const adminSpy = TestBed.inject(DspApiConnectionToken);

        // mock getProjectByIri response
        (
            adminSpy.admin
                .projectsEndpoint as jasmine.SpyObj<ProjectsEndpointAdmin>
        ).getProjectByIri.and.callFake(() => {
            const project = MockProjects.mockProject();
            return of(project);
        });

        // mock getUserByIri response
        const userSpy = TestBed.inject(UserService);

        // mock getUserByIri response
        (userSpy as jasmine.SpyObj<UserService>).getUser.and.callFake(() => {
            const user = MockUsers.mockUser();

            return of(user.body);
        });

        const incomingLinksSpy = TestBed.inject(IncomingService);

        (
            incomingLinksSpy as jasmine.SpyObj<IncomingService>
        ).getIncomingLinks.and.callFake(() => {
            const resources = new ReadResource();
            const incomingLinks = new ReadResourceSequence([resources], true);
            return of(incomingLinks);
        });

        testHostFixture = TestBed.createComponent(TestPropertyParentComponent);
        testHostComponent = testHostFixture.componentInstance;
        testHostFixture.detectChanges();

        expect(testHostComponent).toBeTruthy();
    });

    it('should get one incoming link', () => {
        expect(
            testHostComponent.propertiesComponent.incomingLinkResources.length
        ).toEqual(1);
    });

    it('should get the resource testding', () => {
        expect(testHostComponent.parentResource).toBeTruthy();
        expect(testHostComponent.parentResource.res.id).toEqual(
            'http://rdfh.ch/0001/H6gBWUuJSuuO-CilHV8kQw'
        );
        expect(testHostComponent.parentResource.res.label).toEqual('testding');
    });

    describe('Toolbar', () => {
        let hostCompDe;
        let propertyToolbarComponentDe;

        beforeEach(() => {
            expect(testHostComponent.propertiesComponent).toBeTruthy();

            hostCompDe = testHostFixture.debugElement;

            propertyToolbarComponentDe = hostCompDe.query(
                By.directive(PropertiesComponent)
            );

            expect(testHostComponent).toBeTruthy();

            testHostFixture.detectChanges();
        });

        it('should have the label "testding"', () => {
            const resLabelDebugElement = propertyToolbarComponentDe.query(
                By.css('h3.label')
            );
            const resLabelNativeElement = resLabelDebugElement.nativeElement;

            expect(resLabelNativeElement.textContent.trim()).toBe('testding');
        });

        it('should toggle list of properties', () => {
            const resLabelDebugElement = propertyToolbarComponentDe.query(
                By.css('button.toggle-props')
            );
            const resLabelNativeElement = resLabelDebugElement.nativeElement;
            // the button contains an icon "unfold_more" and the text "Increase properties"
            expect(resLabelNativeElement.textContent.trim()).toBe(
                'unfold_more'
            );

            resLabelNativeElement.click();

            testHostFixture.detectChanges();

            // the button contains an icon "unfold_less" and the text "Decrease properties"
            expect(resLabelNativeElement.textContent.trim()).toBe(
                'unfold_less'
            );
        });
    });

    // --> TODO: currently not possible to test copy to clipboard from Material Angular
    // https://stackoverflow.com/questions/60337742/test-copy-to-clipboard-function

    describe('List of properties', () => {
        it('should get 25 properties', () => {
            expect(testHostComponent.parentResource.resProps).toBeTruthy();
            expect(testHostComponent.parentResource.resProps.length).toBe(25);
        });

        it('should get the resource testding', () => {
            expect(testHostComponent.parentResource.res).toBeTruthy();
            expect(testHostComponent.parentResource.res.id).toEqual(
                'http://rdfh.ch/0001/H6gBWUuJSuuO-CilHV8kQw'
            );
            expect(testHostComponent.parentResource.res.label).toEqual(
                'testding'
            );
        });

        it('should display a text value among the property list', () => {
            expect(
                testHostComponent.parentResource.resProps[4].propDef.label
            ).toEqual('Text');
            expect(
                testHostComponent.parentResource.resProps[4].propDef.comment
            ).toBe(undefined);
            expect(
                testHostComponent.parentResource.resProps[4].guiDef.cardinality
            ).toEqual(2);
            expect(
                testHostComponent.parentResource.resProps[4].guiDef.guiOrder
            ).toEqual(2);
            expect(
                testHostComponent.parentResource.resProps[4].values[0].type
            ).toEqual('http://api.knora.org/ontology/knora-api/v2#TextValue');
        });

        it('should get some system properties', () => {
            expect(testHostComponent.parentResource.systemProps).toBeTruthy();
            expect(testHostComponent.parentResource.systemProps.length).toEqual(
                13
            );

            // check if the first system property is an ARK url
            expect(
                testHostComponent.parentResource.systemProps[0].label
            ).toEqual('ARK URL');
        });

        it('should trigger the callback when an event is emitted', () => {
            expect(testHostComponent.myNum).toEqual(0);

            voeService.emit(new EmitEvent(Events.ValueAdded));

            expect(testHostComponent.myNum).toEqual(1);
        });

        it('should unsubscribe from changes when destroyed', () => {
            testHostComponent.voeSubscriptions.forEach((sub) => {
                expect(sub.closed).toBe(false);
            });

            testHostFixture.destroy();

            testHostComponent.voeSubscriptions.forEach((sub) => {
                expect(sub.closed).toBe(true);
            });
        });
    });

    describe('Add value', () => {
        let hostCompDe;
        let propertyViewComponentDe;

        beforeEach(() => {
            expect(testHostComponent.propertiesComponent).toBeTruthy();

            hostCompDe = testHostFixture.debugElement;

            propertyViewComponentDe = hostCompDe.query(
                By.directive(PropertiesComponent)
            );

            expect(testHostComponent).toBeTruthy();

            testHostComponent.propertiesComponent.addButtonIsVisible = true;
            testHostComponent.propertiesComponent.addValueFormIsVisible = false;
            testHostFixture.detectChanges();
        });

        it('should show an add button under each property that has a value component and value and appropriate cardinality', () => {
            const addButtons = propertyViewComponentDe.queryAll(
                By.css('button.create')
            );
            expect(addButtons.length).toEqual(14);
        });

        it('should show an add button under a property with a cardinality of 1 and does not have a value', () => {
            // show all properties so that we can access properties with no values
            const toggleAllPropsElement = testHostFixture.debugElement.query(
                By.css('button.toggle-props')
            );
            toggleAllPropsElement.nativeElement.click();

            testHostFixture.detectChanges();

            let addButtons = propertyViewComponentDe.queryAll(
                By.css('button.create')
            );

            // current amount of buttons should equal 17
            // standoff links value and has incoming link value are system props and cannot be added: -2
            expect(addButtons.length).toEqual(17);

            // remove value from the boolean property
            testHostComponent.parentResource.resProps[9].values = [];

            testHostFixture.detectChanges();

            // now the boolean property should have an add button
            // standoff links value and has incoming link value are system props and cannot be added: -2
            addButtons = propertyViewComponentDe.queryAll(
                By.css('button.create')
            );
            expect(addButtons.length).toEqual(18);
        });

        it('should show an add value component when the add button is clicked', () => {
            const addButtonDebugElement = propertyViewComponentDe.query(
                By.css('button.create')
            );
            const addButtonNativeElement = addButtonDebugElement.nativeElement;

            expect(
                propertyViewComponentDe.query(By.css('.add-value'))
            ).toBeNull();

            addButtonNativeElement.click();

            testHostFixture.detectChanges();

            const addButtons = propertyViewComponentDe.queryAll(
                By.css('button.create')
            );

            // the add button for the property with the open add value form is hidden
            expect(addButtons.length).toEqual(13);

            expect(
                propertyViewComponentDe.query(By.css('.add-value'))
            ).toBeDefined();
        });

        it('should determine that adding a standoff link value is not allowed', () => {
            const standoffLinkVal =
                testHostComponent.parentResource.resProps.filter(
                    (propVal) =>
                        propVal.propDef.id === Constants.HasStandoffLinkToValue
                );

            expect(
                testHostComponent.propertiesComponent.addValueIsAllowed(
                    standoffLinkVal[0]
                )
            ).toBeFalsy();
        });

        it('should determine that adding a incoming link value is not allowed', () => {
            const standoffLinkVal =
                testHostComponent.parentResource.resProps.filter(
                    (propVal) =>
                        propVal.propDef.id ===
                        'http://api.knora.org/ontology/knora-api/v2#hasIncomingLinkValue'
                );

            expect(
                testHostComponent.propertiesComponent.addValueIsAllowed(
                    standoffLinkVal[0]
                )
            ).toBeFalsy();
        });

        it('should determine that adding an int value is allowed', () => {
            const standoffLinkVal =
                testHostComponent.parentResource.resProps.filter(
                    (propVal) =>
                        propVal.propDef.id ===
                        'http://0.0.0.0:3333/ontology/0001/anything/v2#hasInteger'
                );

            expect(
                testHostComponent.propertiesComponent.addValueIsAllowed(
                    standoffLinkVal[0]
                )
            ).toBeTruthy();
        });
    });
});
