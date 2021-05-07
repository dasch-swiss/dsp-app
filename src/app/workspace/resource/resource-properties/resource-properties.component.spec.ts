import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { By } from '@angular/platform-browser';
import {
    ApiResponseError,
    Constants,
    IHasPropertyWithPropertyDefinition,
    KnoraApiConnection,
    MockResource,
    ReadLinkValue,
    ReadResource,
    ReadValue,
    ResourcePropertyDefinition,
    SystemPropertyDefinition
} from '@dasch-swiss/dsp-js';
import {
    AppInitService,
    DspActionModule,
    DspApiConfigToken,
    DspApiConnectionToken,
    DspCoreModule,
    DspViewerModule,
    EmitEvent,
    Events,
    PropertyInfoValues,
    ValueOperationEventService
} from '@dasch-swiss/dsp-ui';
import { Subscription } from 'rxjs';
import { TestConfig } from 'test.config';
import { ResourcePropertiesComponent } from './resource-properties.component';

/**
 * test host component to simulate parent component.
 */
@Component({
    template: `
      <app-resource-properties #propView
        [parentResource]="parentResource"
        [propArray]="propArray"
        [systemPropArray]="systemPropArray"
        [showAllProps]="showAllProps"
        (referredResourceClicked)="internalLinkClicked($event)"
        (referredResourceHovered)="internalLinkHovered($event)">
      </app-resource-properties>`
})
class TestPropertyParentComponent implements OnInit, OnDestroy {

    @ViewChild('propView') resourcePropertiesComponent: ResourcePropertiesComponent;

    parentResource: ReadResource;

    propArray: PropertyInfoValues[] = [];

    systemPropArray: SystemPropertyDefinition[] = [];

    showAllProps = false;

    voeSubscriptions: Subscription[] = [];

    myNum = 0;

    linkValClicked: ReadLinkValue;

    linkValHovered: ReadLinkValue;

    constructor(public _valueOperationEventService: ValueOperationEventService) { }

    ngOnInit() {
        this.voeSubscriptions.push(this._valueOperationEventService.on(Events.ValueAdded, () => this.myNum = 1));
        this.voeSubscriptions.push(this._valueOperationEventService.on(Events.ValueUpdated, () => this.myNum = 2));
        this.voeSubscriptions.push(this._valueOperationEventService.on(Events.ValueDeleted, () => this.myNum = 3));

        MockResource.getTestThing().subscribe(
            (response: ReadResource) => {
                this.parentResource = response;

                // gather resource property information
                this.propArray = this.parentResource.entityInfo.classes[this.parentResource.type].getResourcePropertiesList().map(
                    (prop: IHasPropertyWithPropertyDefinition) => {
                        const propInfoAndValues: PropertyInfoValues = {
                            propDef: prop.propertyDefinition,
                            guiDef: prop,
                            values: this.parentResource.getValues(prop.propertyIndex)
                        };
                        return propInfoAndValues;
                    }
                );

                // sort properties by guiOrder
                this.propArray.sort((a, b) => (a.guiDef.guiOrder > b.guiDef.guiOrder) ? 1 : -1);

                // get system property information
                this.systemPropArray = this.parentResource.entityInfo.getPropertyDefinitionsByType(SystemPropertyDefinition);

            },
            (error: ApiResponseError) => {
                console.error('Error to get the mock resource', error);
            }
        );
    }

    ngOnDestroy() {
        if (this.voeSubscriptions) {
            this.voeSubscriptions.forEach(sub => sub.unsubscribe());
        }
    }

    internalLinkClicked(linkVal: ReadLinkValue) {
        this.linkValClicked = linkVal;
    }

    internalLinkHovered(linkVal: ReadLinkValue) {
        this.linkValHovered = linkVal;
    }
}

/**
 * test host component to simulate child component, here display-edit.
 */
@Component({
    selector: 'dsp-display-edit',
    template: ''
})
class TestDisplayValueComponent {

    @Input() parentResource: ReadResource;
    @Input() displayValue: ReadValue;
    @Input() propArray: PropertyInfoValues[];
    @Input() configuration?: object;

    @Output() referredResourceClicked: EventEmitter<ReadLinkValue> = new EventEmitter<ReadLinkValue>();
    @Output() referredResourceHovered: EventEmitter<ReadLinkValue> = new EventEmitter<ReadLinkValue>();

}

/**
 * test host component to simulate child component, here add-value.
 */
@Component({
    selector: 'dsp-add-value',
    template: ''
})
class TestAddValueComponent {

    @Input() parentResource: ReadResource;
    @Input() resourcePropertyDefinition: ResourcePropertyDefinition;

}

describe('ResourcePropertiesComponent', () => {
    let testHostComponent: TestPropertyParentComponent;
    let testHostFixture: ComponentFixture<TestPropertyParentComponent>;
    let voeService: ValueOperationEventService;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [
                MatIconModule,
                MatTooltipModule
            ],
            declarations: [
                TestPropertyParentComponent,
                TestDisplayValueComponent,
                TestAddValueComponent,
                ResourcePropertiesComponent
            ],
            providers: [
                ValueOperationEventService,
                AppInitService,
                {
                    provide: DspApiConfigToken,
                    useValue: TestConfig.ApiConfig
                },
                {
                    provide: DspApiConnectionToken,
                    useValue: new KnoraApiConnection(TestConfig.ApiConfig)
                }
            ]
        })
            .compileComponents();

        voeService = TestBed.inject(ValueOperationEventService);
    }));

    beforeEach(() => {
        testHostFixture = TestBed.createComponent(TestPropertyParentComponent);
        testHostComponent = testHostFixture.componentInstance;
        testHostFixture.detectChanges();

        expect(testHostComponent).toBeTruthy();
    });


    it('should get 25 properties', () => {

        expect(testHostComponent.propArray).toBeTruthy();
        expect(testHostComponent.propArray.length).toBe(25);

    });

    it('should get the resource testding', () => {

        expect(testHostComponent.parentResource).toBeTruthy();
        expect(testHostComponent.parentResource.id).toEqual('http://rdfh.ch/0001/H6gBWUuJSuuO-CilHV8kQw');
        expect(testHostComponent.parentResource.label).toEqual('testding');

    });

    it('should display a text value among the property list', () => {

        expect(testHostComponent.propArray[4].propDef.label).toEqual('Text');
        expect(testHostComponent.propArray[4].propDef.comment).toBe(undefined);
        expect(testHostComponent.propArray[4].guiDef.cardinality).toEqual(2);
        expect(testHostComponent.propArray[4].guiDef.guiOrder).toEqual(2);
        expect(testHostComponent.propArray[4].values[0].type).toEqual('http://api.knora.org/ontology/knora-api/v2#TextValue');

    });

    it('should get some system properties', () => {

        expect(testHostComponent.systemPropArray).toBeTruthy();
        expect(testHostComponent.systemPropArray.length).toEqual(13);

        // check if the first system property is an ARK url
        expect(testHostComponent.systemPropArray[0].label).toEqual('ARK URL');

    });

    it('should propagate a click event on a link value', () => {

        const displayEdit = testHostFixture.debugElement.query(By.directive(TestDisplayValueComponent));

        const linkVal = new ReadLinkValue();
        linkVal.linkedResourceIri = 'testIri';

        expect(testHostComponent.linkValClicked).toBeUndefined();

        (displayEdit.componentInstance as TestDisplayValueComponent).referredResourceClicked.emit(linkVal);

        expect(testHostComponent.linkValClicked.linkedResourceIri).toEqual('testIri');

    });

    it('should propagate a hover event on a link value', () => {

        const displayEdit = testHostFixture.debugElement.query(By.directive(TestDisplayValueComponent));

        const linkVal = new ReadLinkValue();
        linkVal.linkedResourceIri = 'testIri';

        expect(testHostComponent.linkValHovered).toBeUndefined();

        (displayEdit.componentInstance as TestDisplayValueComponent).referredResourceHovered.emit(linkVal);

        expect(testHostComponent.linkValHovered.linkedResourceIri).toEqual('testIri');

    });

    it('should trigger the callback when an event is emitted', () => {

        expect(testHostComponent.myNum).toEqual(0);

        voeService.emit(new EmitEvent(Events.ValueAdded));

        expect(testHostComponent.myNum).toEqual(1);
    });

    it('should unsubscribe from changes when destroyed', () => {
        testHostComponent.voeSubscriptions.forEach(sub => {
            expect(sub.closed).toBe(false);
        });

        testHostFixture.destroy();

        testHostComponent.voeSubscriptions.forEach(sub => {
            expect(sub.closed).toBe(true);
        });
    });

    describe('Add value', () => {
        let hostCompDe;
        let propertyViewComponentDe;

        beforeEach(() => {
            expect(testHostComponent.resourcePropertiesComponent).toBeTruthy();

            hostCompDe = testHostFixture.debugElement;

            propertyViewComponentDe = hostCompDe.query(By.directive(ResourcePropertiesComponent));

            expect(testHostComponent).toBeTruthy();

            testHostComponent.resourcePropertiesComponent.addButtonIsVisible = true;
            testHostComponent.resourcePropertiesComponent.addValueFormIsVisible = false;
            testHostFixture.detectChanges();
        });

        it('should show an add button under each property that has a value component and value and appropriate cardinality', () => {
            const addButtons = propertyViewComponentDe.queryAll(By.css('button.create'));
            expect(addButtons.length).toEqual(14);

        });

        it('should show an add button under a property with a cardinality of 1 and does not have a value', () => {

            // show all properties so that we can access properties with no values
            testHostComponent.showAllProps = true;
            testHostFixture.detectChanges();

            let addButtons = propertyViewComponentDe.queryAll(By.css('button.create'));

            // current amount of buttons should equal 17
            // because the boolean property shouldn't have an add button if it has a value
            // standoff links value and has incoming link value are system props and cannot be added: -2
            expect(addButtons.length).toEqual(17);

            // remove value from the boolean property
            testHostComponent.propArray[9].values = [];

            testHostFixture.detectChanges();

            // now the boolean property should have an add button
            // so the amount of add buttons on the page should increase by 1
            // standoff links value and has incoming link value are system props and cannot be added: -2
            addButtons = propertyViewComponentDe.queryAll(By.css('button.create'));
            expect(addButtons.length).toEqual(18);

        });

        it('should show an add value component when the add button is clicked', () => {
            const addButtonDebugElement = propertyViewComponentDe.query(By.css('button.create'));
            const addButtonNativeElement = addButtonDebugElement.nativeElement;

            expect(propertyViewComponentDe.query(By.css('.add-value'))).toBeNull();

            addButtonNativeElement.click();

            testHostFixture.detectChanges();

            const addButtons = propertyViewComponentDe.queryAll(By.css('button.create'));

            // the add button for the property with the open add value form is hidden
            expect(addButtons.length).toEqual(13);

            expect(propertyViewComponentDe.query(By.css('.add-value'))).toBeDefined();

        });

        it('should determine that adding a standoff link value is not allowed', () => {

            const standoffLinkVal = testHostComponent.propArray.filter(
                propVal => propVal.propDef.id === Constants.HasStandoffLinkToValue
            );

            expect(testHostComponent.resourcePropertiesComponent.addValueIsAllowed(standoffLinkVal[0])).toBeFalsy();

        });

        it('should determine that adding a incoming link value is not allowed', () => {

            const standoffLinkVal = testHostComponent.propArray.filter(
                propVal => propVal.propDef.id === 'http://api.knora.org/ontology/knora-api/v2#hasIncomingLinkValue'
            );

            expect(testHostComponent.resourcePropertiesComponent.addValueIsAllowed(standoffLinkVal[0])).toBeFalsy();

        });

        it('should determine that adding an int value is allowed', () => {

            const standoffLinkVal = testHostComponent.propArray.filter(
                propVal => propVal.propDef.id === 'http://0.0.0.0:3333/ontology/0001/anything/v2#hasInteger'
            );

            expect(testHostComponent.resourcePropertiesComponent.addValueIsAllowed(standoffLinkVal[0])).toBeTruthy();

        });

    });
});
