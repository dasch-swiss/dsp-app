import { CommonModule } from '@angular/common';
import { Component, Inject, Input, OnInit, ViewChild } from '@angular/core';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import {
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import {
  CreateIntValue,
  CreateValue,
  MockOntology,
  ReadResource,
  ResourcePropertyDefinition,
} from '@dasch-swiss/dsp-js';
import { IntValueComponent } from '../../../values/int-value/int-value.component';
import { SwitchPropertiesComponent } from './switch-properties.component';

/**
 * test host component to simulate parent component.
 */
@Component({
  template: ` <app-switch-properties
    #switchProps
    [property]="property"
    [parentResource]="parentResource"
    [parentForm]="parentForm"
    [formName]="property.label + '_' + index">
  </app-switch-properties>`,
})
class TestSwitchPropertiesParentComponent implements OnInit {
  @ViewChild('switchProps')
  switchPropertiesComponent: SwitchPropertiesComponent;

  property: ResourcePropertyDefinition;

  parentResource: ReadResource;

  parentForm: UntypedFormGroup;

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
  selector: 'app-int-value',
})
class MockCreateIntValueComponent implements OnInit {
  @ViewChild('createVal') createValueComponent: IntValueComponent;

  @Input() parentForm: UntypedFormGroup;

  @Input() formName: string;

  @Input() mode;

  @Input() displayValue;

  @Input() valueRequiredValidator = true;

  form: UntypedFormGroup;

  valueFormControl: UntypedFormControl;

  constructor(@Inject(UntypedFormBuilder) private _fb: UntypedFormBuilder) {}

  ngOnInit(): void {
    this.valueFormControl = new UntypedFormControl(null, [Validators.required]);

    this.form = this._fb.group({
      test: this.valueFormControl,
    });
  }

  getNewValue(): CreateValue {
    const createIntVal = new CreateIntValue();

    createIntVal.int = 123;

    return createIntVal;
  }

  updateCommentVisibility(): void {}
}

describe('SwitchPropertiesComponent', () => {
  let testHostComponent: TestSwitchPropertiesParentComponent;
  let testHostFixture: ComponentFixture<TestSwitchPropertiesParentComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        SwitchPropertiesComponent,
        MockCreateIntValueComponent,
        TestSwitchPropertiesParentComponent,
      ],
      imports: [RouterTestingModule],
      providers: [CommonModule, UntypedFormBuilder],
    }).compileComponents();
  }));

  beforeEach(() => {
    testHostFixture = TestBed.createComponent(
      TestSwitchPropertiesParentComponent
    );
    testHostComponent = testHostFixture.componentInstance;
    testHostFixture.detectChanges();
    expect(testHostComponent).toBeTruthy();
  });

  it('should create an IntValue component', () => {
    expect(
      testHostComponent.switchPropertiesComponent
        .createValueComponent instanceof MockCreateIntValueComponent
    ).toBe(true);
    expect(
      testHostComponent.switchPropertiesComponent.createValueComponent.mode
    ).toEqual('create');
  });
});
