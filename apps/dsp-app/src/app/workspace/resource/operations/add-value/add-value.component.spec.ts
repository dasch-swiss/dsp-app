import { Component, Inject, Input, OnInit, ViewChild } from '@angular/core';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import {
    UntypedFormBuilder,
    UntypedFormControl,
    UntypedFormGroup,
    Validators,
} from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
    ApiResponseError,
    CreateIntValue,
    CreateValue,
    MockResource,
    ReadIntValue,
    ReadResource,
    ResourcePropertyDefinition,
    UpdateResource,
    ValuesEndpointV2,
    WriteValueResponse,
} from '@dasch-swiss/dsp-js';
import { of, throwError } from 'rxjs';
import { AjaxError } from 'rxjs/ajax';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import {
    AddedEventValue,
    EmitEvent,
    Events,
    ValueOperationEventService,
} from '../../services/value-operation-event.service';
import { AddValueComponent } from './add-value.component';

@Component({
    selector: 'app-int-value',
    template: '',
})
class TestIntValueComponent implements OnInit {
    @Input() mode;

    @Input() displayValue;

    form: UntypedFormGroup;

    valueFormControl: UntypedFormControl;

    constructor(@Inject(UntypedFormBuilder) private _fb: UntypedFormBuilder) {}

    ngOnInit(): void {
        this.valueFormControl = new UntypedFormControl(null, [
            Validators.required,
        ]);

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

@Component({
    selector: 'app-time-value',
    template: '',
})
class TestTimeValueComponent {
    @Input() mode;

    @Input() displayValue;
}

/**
 * test host component to simulate parent component.
 */
@Component({
    selector: 'app-add-value-host-component',
    template: ` <app-add-value
        *ngIf="resourcePropertyDefinition"
        #testAddVal
        [resourcePropertyDefinition]="resourcePropertyDefinition"
        [parentResource]="readResource"
    ></app-add-value>`,
})
class DspAddValueTestComponent implements OnInit {
    @ViewChild('testAddVal') testAddValueComponent: AddValueComponent;

    readResource: ReadResource;
    resourcePropertyDefinition: ResourcePropertyDefinition;

    ngOnInit() {
        MockResource.getTestThing().subscribe((res) => {
            this.readResource = res;
        });
    }

    assignResourcePropDef(propIri: string) {
        const definitionForProp = this.readResource.entityInfo
            .getAllPropertyDefinitions()
            .filter(
                (resourcePropDef: ResourcePropertyDefinition) =>
                    resourcePropDef.id === propIri
            ) as ResourcePropertyDefinition[];

        if (definitionForProp.length !== 1) {
            throw console.error('Property definition not found');
        }

        this.resourcePropertyDefinition = definitionForProp[0];
    }
}

describe('AddValueComponent', () => {
    let testHostComponent: DspAddValueTestComponent;
    let testHostFixture: ComponentFixture<DspAddValueTestComponent>;

    beforeEach(waitForAsync(() => {
        const valuesSpyObj = {
            v2: {
                values: jasmine.createSpyObj('values', [
                    'createValue',
                    'getValue',
                ]),
            },
        };

        const eventSpy = jasmine.createSpyObj('ValueOperationEventService', [
            'emit',
        ]);

        TestBed.configureTestingModule({
            imports: [BrowserAnimationsModule, MatIconModule],
            declarations: [
                AddValueComponent,
                DspAddValueTestComponent,
                TestIntValueComponent,
                TestTimeValueComponent,
            ],
            providers: [
                {
                    provide: DspApiConnectionToken,
                    useValue: valuesSpyObj,
                },
                {
                    provide: ValueOperationEventService,
                    useValue: eventSpy,
                },
                UntypedFormBuilder,
            ],
        }).compileComponents();
    }));

    beforeEach(() => {
        const valueEventSpy = TestBed.inject(ValueOperationEventService);

        (
            valueEventSpy as jasmine.SpyObj<ValueOperationEventService>
        ).emit.and.stub();

        testHostFixture = TestBed.createComponent(DspAddValueTestComponent);
        testHostComponent = testHostFixture.componentInstance;
        testHostFixture.detectChanges();

        expect(testHostComponent).toBeTruthy();
    });

    it('should choose the apt component for an integer value', () => {
        testHostComponent.assignResourcePropDef(
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasInteger'
        );

        testHostFixture.detectChanges();

        expect(testHostComponent.testAddValueComponent).toBeTruthy();

        expect(testHostComponent.resourcePropertyDefinition.objectType).toEqual(
            'http://api.knora.org/ontology/knora-api/v2#IntValue'
        );

        expect(
            testHostComponent.testAddValueComponent
                .createValueComponent instanceof TestIntValueComponent
        ).toBeTruthy();
    });

    it('should choose the apt component for a time value', () => {
        testHostComponent.assignResourcePropDef(
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasTimeStamp'
        );

        testHostFixture.detectChanges();

        expect(testHostComponent.testAddValueComponent).toBeTruthy();

        expect(testHostComponent.resourcePropertyDefinition.objectType).toEqual(
            'http://api.knora.org/ontology/knora-api/v2#TimeValue'
        );

        expect(
            testHostComponent.testAddValueComponent
                .createValueComponent instanceof TestTimeValueComponent
        ).toBeTruthy();
    });

    describe('add new value', () => {
        let hostCompDe;
        let addValueComponentDe;

        beforeEach(() => {
            testHostComponent.assignResourcePropDef(
                'http://0.0.0.0:3333/ontology/0001/anything/v2#hasInteger'
            );

            testHostFixture.detectChanges();

            expect(testHostComponent.testAddValueComponent).toBeTruthy();

            hostCompDe = testHostFixture.debugElement;

            addValueComponentDe = hostCompDe.query(
                By.directive(AddValueComponent)
            );

            expect(testHostComponent).toBeTruthy();

            testHostComponent.testAddValueComponent.createModeActive = true;

            testHostFixture.detectChanges();
        });

        it('should add a new value to a property', () => {
            const valuesSpy = TestBed.inject(DspApiConnectionToken);

            const valueEventSpy = TestBed.inject(ValueOperationEventService);

            (
                valuesSpy.v2.values as jasmine.SpyObj<ValuesEndpointV2>
            ).createValue.and.callFake(() => {
                const response = new WriteValueResponse();

                response.id = 'newID';
                response.type = 'type';
                response.uuid = 'uuid';

                return of(response);
            });

            (
                valuesSpy.v2.values as jasmine.SpyObj<ValuesEndpointV2>
            ).getValue.and.callFake(() => {
                const createdVal = new ReadIntValue();

                createdVal.id = 'newID';
                createdVal.int = 1;

                const resource = new ReadResource();

                resource.properties = {
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    'http://0.0.0.0:3333/ontology/0001/anything/v2#hasInteger':
                        [createdVal],
                };

                return of(resource);
            });

            expect(
                testHostComponent.testAddValueComponent.createModeActive
            ).toBeTruthy();

            testHostComponent.testAddValueComponent.createValueComponent.form.setValue(
                { test: 123 }
            );

            testHostFixture.detectChanges();

            const saveButtonDebugElement = addValueComponentDe.query(
                By.css('button.save')
            );
            const saveButtonNativeElement =
                saveButtonDebugElement.nativeElement;

            expect(saveButtonNativeElement).toBeDefined();

            saveButtonNativeElement.click();

            testHostFixture.detectChanges();

            const expectedUpdateResource = new UpdateResource();

            expectedUpdateResource.id =
                'http://rdfh.ch/0001/H6gBWUuJSuuO-CilHV8kQw';
            expectedUpdateResource.type =
                'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing';
            expectedUpdateResource.property =
                'http://0.0.0.0:3333/ontology/0001/anything/v2#hasInteger';

            const expectedCreateVal = new CreateIntValue();
            expectedCreateVal.int =
                testHostComponent.testAddValueComponent.createValueComponent.form.value.test;

            expectedUpdateResource.value = expectedCreateVal;

            const newReadValue = new ReadIntValue();
            newReadValue.id = 'newID';
            newReadValue.int = 1;

            expect(valuesSpy.v2.values.createValue).toHaveBeenCalledWith(
                expectedUpdateResource
            );
            expect(valuesSpy.v2.values.createValue).toHaveBeenCalledTimes(1);

            expect(valuesSpy.v2.values.getValue).toHaveBeenCalledTimes(1);
            expect(valuesSpy.v2.values.getValue).toHaveBeenCalledWith(
                testHostComponent.readResource.id,
                'uuid'
            );

            expect(valueEventSpy.emit).toHaveBeenCalledTimes(1);
            expect(valueEventSpy.emit).toHaveBeenCalledWith(
                new EmitEvent(
                    Events.ValueAdded,
                    new AddedEventValue(newReadValue)
                )
            );
        });

        it('should handle an ApiResponseError with status of 400 correctly', () => {
            const valuesSpy = TestBed.inject(DspApiConnectionToken);

            const error = ApiResponseError.fromAjaxError({} as AjaxError);

            error.status = 400;

            (
                valuesSpy.v2.values as jasmine.SpyObj<ValuesEndpointV2>
            ).createValue.and.returnValue(throwError(error));

            expect(
                testHostComponent.testAddValueComponent.createModeActive
            ).toBeTruthy();

            testHostComponent.testAddValueComponent.createValueComponent.form.controls.test.clearValidators();
            testHostComponent.testAddValueComponent.createValueComponent.form.controls.test.updateValueAndValidity();
            testHostFixture.detectChanges();

            const saveButtonDebugElement = addValueComponentDe.query(
                By.css('button.save')
            );
            const saveButtonNativeElement =
                saveButtonDebugElement.nativeElement;

            expect(saveButtonNativeElement).toBeDefined();

            saveButtonNativeElement.click();

            testHostFixture.detectChanges();

            const formErrors =
                testHostComponent.testAddValueComponent.createValueComponent
                    .valueFormControl.errors;

            const expectedErrors = {
                duplicateValue: true,
            };

            expect(formErrors).toEqual(expectedErrors);
        });
    });
});
