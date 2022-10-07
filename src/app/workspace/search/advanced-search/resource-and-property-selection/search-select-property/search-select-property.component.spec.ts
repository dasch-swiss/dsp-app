import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { Component, Inject, Input, OnInit, ViewChild } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { UntypedFormBuilder, UntypedFormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { HarnessLoader } from '@angular/cdk/testing';
import {
    Cardinality,
    Constants,
    MockOntology,
    ResourceClassDefinition,
    ResourcePropertyDefinition
} from '@dasch-swiss/dsp-js';
import { MatSelectHarness } from '@angular/material/select/testing';
import { MatSlideToggleHarness } from '@angular/material/slide-toggle/testing';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ComparisonOperatorAndValue, Equals, ValueLiteral } from './specify-property-value/operator';
import { SearchSelectPropertyComponent } from './search-select-property.component';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

/**
 * test host component to simulate parent component.
 */
@Component({
    template: `
        <app-search-select-property #selectProp
        [formGroup]="form" [index]="0" [activeResourceClass]="activeResourceClass" [properties]="propertyDefs" [topLevel]="topLevel"></app-search-select-property>`
})
class TestHostComponent implements OnInit {

    @ViewChild('selectProp') selectProperty: SearchSelectPropertyComponent;

    form: UntypedFormGroup;

    propertyDefs: ResourcePropertyDefinition[];

    activeResourceClass: ResourceClassDefinition;

    topLevel: boolean;

    constructor(@Inject(UntypedFormBuilder) private _fb: UntypedFormBuilder) {
    }

    ngOnInit() {
        this.form = this._fb.group({});

        const resProps = MockOntology.mockReadOntology('http://0.0.0.0:3333/ontology/0001/anything/v2').getPropertyDefinitionsByType(ResourcePropertyDefinition);

        this.propertyDefs = resProps;

        this.topLevel = true;
    }

}

/**
 * test component to simulate specify property value component.
 */
@Component({
    selector: 'app-specify-property-value',
    template: ''
})
class TestSpecifyPropertyValueComponent implements OnInit {

    @Input() formGroup: UntypedFormGroup;

    @Input() property: ResourcePropertyDefinition;

    @Input() topLevel: boolean;

    getComparisonOperatorAndValueLiteralForProperty(): ComparisonOperatorAndValue {
        return new ComparisonOperatorAndValue(new Equals(), new ValueLiteral('1', 'http://www.w3.org/2001/XMLSchema#integer'));
    }

    ngOnInit() {
    }

}

describe('SearchSelectPropertyComponent', () => {
    let testHostComponent: TestHostComponent;
    let testHostFixture: ComponentFixture<TestHostComponent>;

    let loader: HarnessLoader;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [
                BrowserAnimationsModule,
                MatCheckboxModule,
                MatOptionModule,
                MatSelectModule,
                MatSlideToggleModule,
                ReactiveFormsModule
            ],
            declarations: [
                SearchSelectPropertyComponent,
                TestHostComponent,
                TestSpecifyPropertyValueComponent
            ]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        testHostFixture = TestBed.createComponent(TestHostComponent);
        testHostComponent = testHostFixture.componentInstance;
        loader = TestbedHarnessEnvironment.loader(testHostFixture);

        testHostFixture.detectChanges();
    });

    it('should create', () => {
        expect(testHostComponent).toBeTruthy();
        expect(testHostComponent.selectProperty).toBeTruthy();
    });

    it('should initialise the Inputs correctly', () => {

        expect(testHostComponent.selectProperty.formGroup).toBeDefined();
        expect(testHostComponent.selectProperty.index).toEqual(0);
        expect(testHostComponent.selectProperty.activeResourceClass).toBeUndefined();
        expect(Object.keys(testHostComponent.selectProperty.properties).length).toEqual(24);
        expect(testHostComponent.selectProperty.properties.length).toEqual(24);
    });

    it('should add a new control to the parent form', waitForAsync(() => {

        // the control is added to the form as an async operation
        // https://angular.io/guide/testing#async-test-with-async
        testHostFixture.whenStable().then(
            () => {
                expect(testHostComponent.form.contains('property0')).toBe(true);
            }
        );

    }));

    it('should init the MatSelect and MatOptions correctly', async () => {

        const select = await loader.getHarness(MatSelectHarness);
        const initVal = await select.getValueText();

        // placeholder
        expect(initVal).toEqual('Select Properties');

        await select.open();

        const options = await select.getOptions();

        expect(options.length).toEqual(24);

    });

    it('should set the active property', async () => {

        expect(testHostComponent.selectProperty.propertySelected).toBeUndefined();

        const select = await loader.getHarness(MatSelectHarness);
        await select.open();

        const options = await select.getOptions();

        await options[0].click();

        expect(testHostComponent.selectProperty.propertySelected.id).toEqual('http://0.0.0.0:3333/ontology/0001/anything/v2#hasBlueThing');

        expect(testHostComponent.selectProperty.specifyPropertyValue.property).toBeDefined();
        expect(testHostComponent.selectProperty.specifyPropertyValue.property.id).toEqual('http://0.0.0.0:3333/ontology/0001/anything/v2#hasBlueThing');

    });

    it('should not show the sort slide-toggle when no property is selected', async () => {

        const slideToggle = await loader.getAllHarnesses(MatSlideToggleHarness);

        expect(slideToggle.length).toEqual(0);

    });

    it('should show the sort slide-toggle when a property with cardinality 1 is selected for the top level resource', async () => {

        const select = await loader.getHarness(MatSelectHarness);
        await select.open();

        const options = await select.getOptions();
        expect(await options[4].getText()).toEqual('Date');

        await options[4].click();

        const resClass = new ResourceClassDefinition();
        resClass.propertiesList = [{
            propertyIndex: 'http://0.0.0.0:3333/ontology/0001/anything/v2#hasDate',
            cardinality: Cardinality._1,
            isInherited: true
        }];

        testHostComponent.activeResourceClass = resClass;

        testHostFixture.detectChanges();

        const slideToggle = await loader.getAllHarnesses(MatSlideToggleHarness);

        expect(slideToggle.length).toEqual(1);

    });

    it('should not show the sort slide-toggle when a property with cardinality 1 is selected for a linked resource', async () => {

        testHostComponent.topLevel = false;

        const select = await loader.getHarness(MatSelectHarness);
        await select.open();

        const options = await select.getOptions();
        expect(await options[4].getText()).toEqual('Date');

        await options[4].click();

        const resClass = new ResourceClassDefinition();
        resClass.propertiesList = [{
            propertyIndex: 'http://0.0.0.0:3333/ontology/0001/anything/v2#hasDate',
            cardinality: Cardinality._1,
            isInherited: true
        }];

        testHostComponent.activeResourceClass = resClass;

        testHostFixture.detectChanges();

        const slideToggle = await loader.getAllHarnesses(MatSlideToggleHarness);

        expect(slideToggle.length).toEqual(0);

    });

    it('should get the specified value for the selected property', async () => {

        const select = await loader.getHarness(MatSelectHarness);
        await select.open();

        const options = await select.getOptions();

        expect(await options[11].getText()).toEqual('Integer');

        await options[11].click();

        const propWithVal = testHostComponent.selectProperty.getPropertySelectedWithValue();

        expect(propWithVal.property.id).toEqual('http://0.0.0.0:3333/ontology/0001/anything/v2#hasInteger');

        expect(propWithVal.valueLiteral.value).toEqual(new ValueLiteral('1', Constants.XsdInteger));
        expect(propWithVal.valueLiteral.comparisonOperator).toEqual(new Equals());

        expect(propWithVal.isSortCriterion).toBe(false);

    });

    it('should reinitialise the properties', async () => {

        expect(testHostComponent.selectProperty.propertySelected).toBeUndefined();

        const select = await loader.getHarness(MatSelectHarness);
        await select.open();

        const options = await select.getOptions();

        await options[0].click();

        expect(testHostComponent.selectProperty.propertySelected.id).toEqual('http://0.0.0.0:3333/ontology/0001/anything/v2#hasBlueThing');

        testHostComponent.propertyDefs
            = MockOntology.mockReadOntology('http://0.0.0.0:3333/ontology/0001/anything/v2').getPropertyDefinitionsByType(ResourcePropertyDefinition);

        testHostFixture.detectChanges();

        expect(testHostComponent.selectProperty.propertySelected).toBeUndefined();
    });

    it('should remove the control from the parent form and unsubscribe from value changes when destroyed', waitForAsync(() => {

        expect(testHostComponent.selectProperty.propertyChangesSubscription.closed).toBe(false);

        // tODO: find out why testHostFixture.destroy() does not trigger the component's ngOnDestroy
        testHostComponent.selectProperty.ngOnDestroy();

        // the control is added to the form as an async operation
        // https://angular.io/guide/testing#async-test-with-async
        testHostFixture.whenStable().then(
            () => {
                expect(testHostComponent.form.contains('property0')).toBe(false);
                expect(testHostComponent.selectProperty.propertyChangesSubscription.closed).toBe(true);
            }
        );

    }));
});
