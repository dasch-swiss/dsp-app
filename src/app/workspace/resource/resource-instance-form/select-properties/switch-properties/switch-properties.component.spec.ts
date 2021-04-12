import { CommonModule } from '@angular/common';
import { Component, Inject, Input, OnInit, ViewChild } from '@angular/core';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { CreateIntValue, CreateValue, MockOntology, ReadResource, ResourcePropertyDefinition } from '@dasch-swiss/dsp-js';
import { IntValueComponent } from '@dasch-swiss/dsp-ui';
import { SwitchPropertiesComponent } from './switch-properties.component';


/**
 * test host component to simulate parent component.
 */
@Component({
    template: `
    <app-switch-properties
    #switchProps
    [property]="property"
    [parentResource]="parentResource"
    [parentForm]="parentForm"
    [formName]="property.label + '_' + index">
    </app-switch-properties>`
})
class TestSwitchPropertiesParentComponent implements OnInit {

    @ViewChild('switchProps') switchPropertiesComponent: SwitchPropertiesComponent;

    property: ResourcePropertyDefinition;

    parentResource: ReadResource;

    parentForm: FormGroup;

    formName: string;

    ngOnInit() {
        this.property = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        ).properties[
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasInteger'
        ] as ResourcePropertyDefinition;
    }

}

/**
 * mock value component to use in tests.
 */
@Component({
    selector: 'dsp-int-value'
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

describe('SwitchPropertiesComponent', () => {
    let testHostComponent: TestSwitchPropertiesParentComponent;
    let testHostFixture: ComponentFixture<TestSwitchPropertiesParentComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [
                SwitchPropertiesComponent,
                MockCreateIntValueComponent,
                TestSwitchPropertiesParentComponent
            ],
            providers: [
                CommonModule,
                FormBuilder
            ]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        testHostFixture = TestBed.createComponent(TestSwitchPropertiesParentComponent);
        testHostComponent = testHostFixture.componentInstance;
        testHostFixture.detectChanges();
        expect(testHostComponent).toBeTruthy();
    });

    it('should create an IntValue component', () => {
        expect(testHostComponent.switchPropertiesComponent.createValueComponent instanceof MockCreateIntValueComponent).toBe(true);
        expect(testHostComponent.switchPropertiesComponent.createValueComponent.mode).toEqual('create');
    });
});
