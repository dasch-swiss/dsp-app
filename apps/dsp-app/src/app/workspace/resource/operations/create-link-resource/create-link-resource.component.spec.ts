import {
  Component,
  DebugElement,
  Inject,
  Input,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import {
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
  ApiResponseData,
  CreateIntValue,
  CreateResource,
  CreateTextValueAsString,
  CreateValue,
  MockOntology,
  MockProjects,
  MockResource,
  ProjectResponse,
  ProjectsEndpointAdmin,
  ReadResource,
  ResourceClassAndPropertyDefinitions,
  ResourceClassDefinition,
  ResourcePropertyDefinition,
  ResourcesEndpointV2,
} from '@dasch-swiss/dsp-js';
import { OntologyCache } from '@dasch-swiss/dsp-js/src/cache/ontology-cache/OntologyCache';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { AppLoggingService } from '@dasch-swiss/vre/shared/app-logging';
import { BaseValueDirective } from '@dsp-app/src/app/main/directive/base-value.directive';
import { TranslateModule } from '@ngx-translate/core';
import { MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { AjaxResponse } from 'rxjs/ajax';
import { SwitchPropertiesComponent } from '../../resource-instance-form/select-properties/switch-properties/switch-properties.component';
import { ValueService } from '../../services/value.service';
import { IntValueComponent } from '../../values/int-value/int-value.component';
import { TextValueAsStringComponent } from '../../values/text-value/text-value-as-string/text-value-as-string.component';

import { CreateLinkResourceComponent } from './create-link-resource.component';

/**
 * test host component to simulate parent component.
 */
@Component({
  template: ` <app-create-link-resource
    [parentResource]="parentResource"
    [propDef]="propDef"
    [resourceClassDef]="resourceClassDef"
    #createLinkResourceComp></app-create-link-resource>`,
})
class TestHostComponent implements OnInit {
  @ViewChild('createLinkResourceComp')
  createLinkResourceComponent: CreateLinkResourceComponent;

  parentResource: ReadResource;
  propDef: string;
  resourceClassDef: string;

  ngOnInit() {
    MockResource.getTestThing().subscribe(res => {
      this.parentResource = res;
      this.propDef =
        'http://0.0.0.0:3333/ontology/0001/anything/v2#hasOtherThingValue';
      this.resourceClassDef =
        'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing';
    });
  }
}

/**
 * mock select-properties component to use in tests.
 */
@Component({
  selector: 'app-select-properties',
  template: `
    <app-text-value-as-string
      #createVal
      [mode]="'create'"
      [commentDisabled]="true"
      [valueRequiredValidator]="true"
      [parentForm]="parentForm"
      [formName]="'label'">
    </app-text-value-as-string>
  `,
})
class MockSelectPropertiesComponent {
  @ViewChildren('switchProp')
  switchPropertiesComponent: QueryList<SwitchPropertiesComponent>;

  // input for resource's label
  @ViewChild('createVal') createValueComponent: BaseValueDirective;

  @Input() properties: ResourcePropertyDefinition[];

  @Input() ontologyInfo: ResourceClassAndPropertyDefinitions;

  @Input() selectedResourceClass: ResourceClassDefinition;

  @Input() parentForm: UntypedFormGroup;

  @Input() currentOntoIri: string;

  parentResource = new ReadResource();

  constructor(private _valueService: ValueService) {}
}

/**
 * mock switch-properties component to use in tests.
 */
@Component({
  selector: 'app-switch-properties',
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
  selector: 'app-int-value',
})
class MockCreateIntValueComponent implements OnInit {
  @ViewChild('createVal') createValueComponent: IntValueComponent;

  @Input() parentForm: UntypedFormGroup;

  @Input() formName: string;

  @Input() mode;

  @Input() displayValue;

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

/**
 * mock value component to use in tests.
 */
@Component({
  selector: 'app-text-value-as-string',
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
  constructor(@Inject(UntypedFormBuilder) private _fb: UntypedFormBuilder) {}
  ngOnInit(): void {
    this.valueFormControl = new UntypedFormControl(null, [Validators.required]);
    this.form = this._fb.group({
      label: this.valueFormControl,
    });
  }
  getNewValue(): CreateValue {
    const createTextVal = new CreateTextValueAsString();
    createTextVal.text = 'My Label';
    return createTextVal;
  }
  updateCommentVisibility(): void {}
}

describe('CreateLinkResourceComponent', () => {
  let testHostComponent: TestHostComponent;
  let testHostFixture: ComponentFixture<TestHostComponent>;
  let createLinkResourceComponentDe: DebugElement;

  beforeEach(waitForAsync(() => {
    const dspConnSpy = {
      v2: {
        ontologyCache: jasmine.createSpyObj('ontologyCache', [
          'getOntology',
          'getResourceClassDefinition',
        ]),
        res: jasmine.createSpyObj('res', ['createResource']),
      },
      admin: {
        projectsEndpoint: jasmine.createSpyObj('projectsEndpoint', [
          'getProjectByShortcode',
        ]),
      },
    };

    TestBed.configureTestingModule({
      declarations: [
        CreateLinkResourceComponent,
        TestHostComponent,
        MockSelectPropertiesComponent,
        MockCreateTextValueComponent,
        MockSwitchPropertiesComponent,
        MockCreateIntValueComponent,
      ],
      imports: [
        BrowserAnimationsModule,
        MatButtonModule,
        MatDialogModule,
        MatFormFieldModule,
        MatSnackBarModule,
        ReactiveFormsModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        MockProvider(AppLoggingService),
        {
          provide: DspApiConnectionToken,
          useValue: dspConnSpy,
        },
        ValueService,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    const dspConnSpy = TestBed.inject(DspApiConnectionToken);

    (
      dspConnSpy.v2.ontologyCache as jasmine.SpyObj<OntologyCache>
    ).getResourceClassDefinition.and.callFake(() =>
      of(
        MockOntology.mockIResourceClassAndPropertyDefinitions(
          'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing'
        )
      )
    );

    testHostFixture = TestBed.createComponent(TestHostComponent);
    testHostComponent = testHostFixture.componentInstance;
    testHostFixture.detectChanges();
    expect(testHostComponent).toBeTruthy();

    const hostCompDe = testHostFixture.debugElement;

    createLinkResourceComponentDe = hostCompDe.query(
      By.directive(CreateLinkResourceComponent)
    );
  });

  it('should initialize the properties array', async () => {
    expect(
      testHostComponent.createLinkResourceComponent.properties.length
    ).toEqual(18);
  });

  it('should submit the form', () => {
    const dspConnSpy = TestBed.inject(DspApiConnectionToken);

    // mock projects endpoint
    (
      dspConnSpy.admin.projectsEndpoint as jasmine.SpyObj<ProjectsEndpointAdmin>
    ).getProjectByShortcode.and.callFake(() => {
      const response = new ProjectResponse();

      const mockProjects = MockProjects.mockProjects();

      response.project = mockProjects.body.projects[0];

      return of(ApiResponseData.fromAjaxResponse({ response } as AjaxResponse));
    });

    (
      dspConnSpy.v2.res as jasmine.SpyObj<ResourcesEndpointV2>
    ).createResource.and.callFake(() => {
      let resource = new ReadResource();

      MockResource.getTestThing().subscribe(res => {
        resource = res;
      });

      return of(resource);
    });

    testHostComponent.createLinkResourceComponent.properties =
      new Array<ResourcePropertyDefinition>();

    MockResource.getTestThing().subscribe(res => {
      const resourcePropDef = (
        res.entityInfo as ResourceClassAndPropertyDefinitions
      ).getAllPropertyDefinitions()[9];
      testHostComponent.createLinkResourceComponent.properties.push(
        resourcePropDef as ResourcePropertyDefinition
      );
    });

    testHostFixture.detectChanges();

    const selectPropertiesComp = createLinkResourceComponentDe.query(
      By.directive(MockSelectPropertiesComponent)
    );

    expect(selectPropertiesComp).toBeTruthy();

    const label = new CreateTextValueAsString();
    label.text = 'My Label';

    const props = {};
    const createVal = new CreateIntValue();
    createVal.int = 123;
    props['http://0.0.0.0:3333/ontology/0001/anything/v2#hasInteger'] = [
      createVal,
    ];

    const expectedCreateResource = new CreateResource();
    expectedCreateResource.label = 'My Label';
    expectedCreateResource.type =
      'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing';
    expectedCreateResource.properties = props;

    testHostComponent.createLinkResourceComponent.onSubmit();

    expect(dspConnSpy.v2.res.createResource).toHaveBeenCalledTimes(1);
  });
});
