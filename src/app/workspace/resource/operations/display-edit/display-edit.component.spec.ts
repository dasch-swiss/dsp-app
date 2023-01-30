/* eslint-disable @typescript-eslint/no-unused-expressions */
import { OverlayContainer } from '@angular/cdk/overlay';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, EventEmitter, Inject, Input, OnInit, Output, ViewChild } from '@angular/core';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDialogHarness } from '@angular/material/dialog/testing';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
    ApiResponseError,
    Constants,
    DeleteValue,
    DeleteValueResponse,
    MockResource,
    MockUsers,
    ReadBooleanValue,
    ReadColorValue,
    ReadDecimalValue,
    ReadGeonameValue,
    ReadIntervalValue,
    ReadIntValue,
    ReadLinkValue,
    ReadListValue,
    ReadResource,
    ReadTextValueAsHtml,
    ReadTextValueAsString, ReadTextValueAsXml,
    ReadTimeValue,
    ReadUriValue,
    ReadValue,
    ResourcePropertyDefinition,
    UpdateIntValue,
    UpdateResource,
    UpdateValue,
    ValuesEndpointV2,
    WriteValueResponse
} from '@dasch-swiss/dsp-js';
import { of, throwError } from 'rxjs';
import { AjaxError } from 'rxjs/ajax';
import { ConfirmationDialogComponent } from 'src/app/main/action/confirmation-dialog/confirmation-dialog.component';
import { DspApiConnectionToken } from 'src/app/main/declarations/dsp-api-tokens';
import { PropertyInfoValues } from '../../properties/properties.component';
import { UserService } from '../../services/user.service';
import {
    DeletedEventValue,
    EmitEvent,
    Events,
    UpdatedEventValues,
    ValueOperationEventService
} from '../../services/value-operation-event.service';
import { ValueService } from '../../services/value.service';
import { DisplayEditComponent } from './display-edit.component';

@Component({
    selector: 'app-text-value-as-string',
    template: ''
})
class TestTextValueAsStringComponent {
    @Input() displayValue?: ReadTextValueAsString;
    @Input() textArea?: boolean = false;

    @Input() mode;

    @Input() guiElement: 'simpleText' | 'textArea' | 'richText' = 'simpleText';
}

@Component({
    selector: 'app-list-value',
    template: ''
})
class TestListValueComponent {
    @Input() mode;

    @Input() displayValue;

    @Input() propertyDef;
}

@Component({
    selector: 'app-link-value',
    template: ''
})
class TestLinkValueComponent {
    @Input() displayValue?: ReadLinkValue;
    @Input() parentResource: ReadResource;
    @Input() propIri: string;
    @Input() currentOntoIri: string;

    @Input() mode;

    @Output() referredResourceClicked: EventEmitter<ReadLinkValue> = new EventEmitter();

    @Output() referredResourceHovered: EventEmitter<ReadLinkValue> = new EventEmitter();
}

@Component({
    selector: 'app-text-value-as-html',
    template: ''
})
class TestTextValueAsHtmlComponent {

    @Input() mode;

    @Input() displayValue;
}

@Component({
    selector: 'app-text-value-as-xml',
    template: ''
})
class TestTextValueAsXmlComponent {

    @Input() mode;

    @Input() displayValue;

    @Output() internalLinkClicked: EventEmitter<string> = new EventEmitter<string>();

    @Output() internalLinkHovered: EventEmitter<string> = new EventEmitter<string>();
}

@Component({
    selector: 'app-uri-value',
    template: ''
})
class TestUriValueComponent {

    @Input() mode;

    @Input() displayValue;
}

@Component({
    selector: 'app-int-value',
    template: ''
})
class TestIntValueComponent implements OnInit {

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

    getUpdatedValue(): UpdateValue {
        const updateIntVal = new UpdateIntValue();

        updateIntVal.id = this.displayValue.id;
        updateIntVal.int = 1;

        return updateIntVal;
    }

    updateCommentVisibility(): void { }
}

@Component({
    selector: 'app-boolean-value',
    template: ''
})
class TestBooleanValueComponent {

    @Input() mode;

    @Input() displayValue;

}

@Component({
    selector: 'app-interval-value',
    template: ''
})
class TestIntervalValueComponent {

    @Input() mode;

    @Input() displayValue;

}

@Component({
    selector: 'app-decimal-value',
    template: ''
})
class TestDecimalValueComponent {

    @Input() mode;

    @Input() displayValue;

}

@Component({
    selector: 'app-time-value',
    template: ''
})
class TestTimeValueComponent {
    @Input() mode;

    @Input() displayValue;
}

@Component({
    selector: 'app-color-value',
    template: ''
})
class TestColorValueComponent {
    @Input() mode;

    @Input() displayValue;
}

@Component({
    selector: 'app-geoname-value',
    template: ''
})
class TestGeonameValueComponent {

    @Input() mode;

    @Input() displayValue;

}

@Component({
    selector: 'app-date-value',
    template: ''
})
class TestDateValueComponent {
    @Input() mode;

    @Input() displayValue;
}

@Component({ selector: 'app-confirmation-message', template: '' })
class TestConfirmationMessageComponent {
    @Input() value: ReadValue;

    constructor() { }
}

/**
 * test host component to simulate parent component.
 */
@Component({
    selector: 'lib-host-component',
    template: `
      <app-display-edit *ngIf="readValue" #displayEditVal
                        [parentResource]="readResource"
                        [projectStatus]="true"
                        [displayValue]="readValue"
                        [propArray]="propArray"
                        [canDelete]="deleteIsAllowed"
                        (referredResourceClicked)="internalLinkClicked($event)"
                        (referredResourceHovered)="internalLinkHovered($event)"
      ></app-display-edit>`
})
class TestHostDisplayValueComponent implements OnInit {

    @ViewChild('displayEditVal') displayEditValueComponent: DisplayEditComponent;

    readResource: ReadResource;
    readValue: ReadValue;
    propArray: PropertyInfoValues[] = [];

    mode: 'read' | 'update' | 'create' | 'search';

    deleteIsAllowed: boolean;

    linkValClicked: ReadLinkValue | string = 'init'; // "init" is set because there is a test that checks that this does not emit for standoff links
    // (and if it emits undefined because of a bug, we cannot check)
    linkValHovered: ReadLinkValue | string = 'init'; // see comment above

    ngOnInit() {

        MockResource.getTestThing().subscribe(res => {
            this.readResource = res;

            this.mode = 'read';

            this.deleteIsAllowed = true;
        });
    }

    // assigns a value when called -> app-display-edit will be instantiated
    assignValue(prop: string, comment?: string) {
        const readVal =
            this.readResource.getValues(prop)[0];

        readVal.userHasPermission = 'M';

        readVal.valueHasComment = comment;

        // standoff link value handling
        // a text value linking to another resource has a corresponding standoff link value
        if (prop === 'http://0.0.0.0:3333/ontology/0001/anything/v2#hasRichtext') {

            // adapt ReadLinkValue so it looks like a standoff link value
            const standoffLinkVal: ReadLinkValue
                = this.readResource.getValuesAs('http://0.0.0.0:3333/ontology/0001/anything/v2#hasOtherThingValue', ReadLinkValue)[0];

            standoffLinkVal.linkedResourceIri = 'testIri';

            const propDefinition = this.readResource.entityInfo.properties['http://0.0.0.0:3333/ontology/0001/anything/v2#hasOtherThingValue'];
            propDefinition.id = Constants.HasStandoffLinkToValue;

            const guiDefinition = this.readResource.entityInfo.classes['http://0.0.0.0:3333/ontology/0001/anything/v2#Thing'].propertiesList.filter(
                propDefForGui => propDefForGui.propertyIndex === 'http://0.0.0.0:3333/ontology/0001/anything/v2#hasOtherThingValue'
            );

            guiDefinition[0].propertyIndex = Constants.HasStandoffLinkToValue;

            const propInfo: PropertyInfoValues = {
                values: [standoffLinkVal],
                propDef: propDefinition,
                guiDef: guiDefinition[0]
            };

            // add standoff link value to property array
            this.propArray.push(propInfo);
        }

        this.readValue = readVal;
    }

    internalLinkClicked(linkVal: ReadLinkValue) {
        this.linkValClicked = linkVal;
    }

    internalLinkHovered(linkVal: ReadLinkValue) {
        this.linkValHovered = linkVal;
    }
}

describe('DisplayEditComponent', () => {
    let testHostComponent: TestHostDisplayValueComponent;
    let testHostFixture: ComponentFixture<TestHostDisplayValueComponent>;

    beforeEach(waitForAsync(() => {

        const valuesSpyObj = {
            v2: {
                values: jasmine.createSpyObj('values', ['updateValue', 'getValue', 'deleteValue'])
            }
        };

        const eventSpy = jasmine.createSpyObj('ValueOperationEventService', ['emit']);

        const userServiceSpy = jasmine.createSpyObj('UserService', ['getUser']);

        const valueServiceSpy = jasmine.createSpyObj('ValueService', ['getValueTypeOrClass', 'getTextValueGuiEle', 'isReadOnly']);

        TestBed.configureTestingModule({
            imports: [
                BrowserAnimationsModule,
                MatIconModule,
                MatDialogModule,
                MatTooltipModule,
                ReactiveFormsModule
            ],
            declarations: [
                DisplayEditComponent,
                ConfirmationDialogComponent,
                TestHostDisplayValueComponent,
                TestTextValueAsStringComponent,
                TestTextValueAsHtmlComponent,
                TestTextValueAsXmlComponent,
                TestIntValueComponent,
                TestLinkValueComponent,
                TestIntervalValueComponent,
                TestListValueComponent,
                TestBooleanValueComponent,
                TestUriValueComponent,
                TestDecimalValueComponent,
                TestGeonameValueComponent,
                TestTimeValueComponent,
                TestColorValueComponent,
                TestDateValueComponent,
                TestConfirmationMessageComponent
            ],
            providers: [
                {
                    provide: DspApiConnectionToken,
                    useValue: valuesSpyObj
                },
                {
                    provide: ValueOperationEventService,
                    useValue: eventSpy
                },
                {
                    provide: UserService,
                    useValue: userServiceSpy
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: {}
                },
                {
                    provide: MatDialogRef,
                    useValue: {}
                },
                {
                    provide: ValueService,
                    useValue: valueServiceSpy
                }
            ]
        })
            .compileComponents();

    }));

    beforeEach(() => {

        const userSpy = TestBed.inject(UserService);

        // mock getUserByIri response
        (userSpy as jasmine.SpyObj<UserService>).getUser.and.callFake(
            () => {
                const user = MockUsers.mockUser();

                return of(user.body);
            }
        );

        const valueServiceSpy = TestBed.inject(ValueService);

        // actual ValueService
        // mocking the service's behaviour would duplicate the actual implementation
        const valueService = new ValueService();

        // spy for getValueTypeOrClass
        (valueServiceSpy as jasmine.SpyObj<ValueService>).getValueTypeOrClass.and.callFake(
            (value: ReadValue) => valueService.getValueTypeOrClass(value)
        );

        // spy for getTextValueGuiEle
        (valueServiceSpy as jasmine.SpyObj<ValueService>).getTextValueGuiEle.and.callFake(
            (guiEle: string) => valueService.getTextValueGuiEle(guiEle)
        );

        // spy for isReadOnly
        (valueServiceSpy as jasmine.SpyObj<ValueService>).isReadOnly.and.callFake(
            (typeOrClass: string, value: ReadValue, propDef: ResourcePropertyDefinition) => valueService.isReadOnly(typeOrClass, value, propDef)
        );

        testHostFixture = TestBed.createComponent(TestHostDisplayValueComponent);
        testHostComponent = testHostFixture.componentInstance;
        testHostFixture.detectChanges();

        expect(testHostComponent).toBeTruthy();
    });

    describe('display a value with the appropriate component', () => {

        it('should choose the apt component for a plain text value in the template', () => {

            const valueServiceSpy = TestBed.inject(ValueService);

            testHostComponent.assignValue('http://0.0.0.0:3333/ontology/0001/anything/v2#hasText');
            testHostFixture.detectChanges();

            expect(testHostComponent.displayEditValueComponent.displayValueComponent instanceof TestTextValueAsStringComponent).toBe(true);
            expect(testHostComponent.displayEditValueComponent.displayValueComponent.displayValue instanceof ReadTextValueAsString).toBe(true);
            expect(testHostComponent.displayEditValueComponent.displayValueComponent.mode).toEqual('read');

            // make sure the value service has been called as expected on initialization

            expect(valueServiceSpy.getValueTypeOrClass).toHaveBeenCalledTimes(1);
            expect(valueServiceSpy.getValueTypeOrClass).toHaveBeenCalledWith(jasmine.objectContaining({
                type: 'http://api.knora.org/ontology/knora-api/v2#TextValue'
            }));

            expect(valueServiceSpy.isReadOnly).toHaveBeenCalledTimes(1);
            expect(valueServiceSpy.isReadOnly).toHaveBeenCalledWith(
                'ReadTextValueAsString',
                jasmine.objectContaining({
                    type: 'http://api.knora.org/ontology/knora-api/v2#TextValue'
                }),
                jasmine.objectContaining({
                    id: 'http://0.0.0.0:3333/ontology/0001/anything/v2#hasText'
                })
            );

        });

        it('should choose the apt component for an XML value in the template', () => {

            testHostComponent.assignValue('http://0.0.0.0:3333/ontology/0001/anything/v2#hasRichtext');
            testHostFixture.detectChanges();

            expect(testHostComponent.displayEditValueComponent.displayValueComponent instanceof TestTextValueAsXmlComponent).toBe(true);
            expect(testHostComponent.displayEditValueComponent.displayValueComponent.displayValue instanceof ReadTextValueAsXml).toBe(true);
            expect(testHostComponent.displayEditValueComponent.displayValueComponent.mode).toEqual('read');

        });

        it('should react to clicking on a standoff link', () => {

            // assign value also updates the standoff link in propArray
            testHostComponent.assignValue('http://0.0.0.0:3333/ontology/0001/anything/v2#hasRichtext');
            testHostFixture.detectChanges();

            expect(testHostComponent.linkValClicked).toEqual('init');

            (testHostComponent.displayEditValueComponent.displayValueComponent as unknown as TestTextValueAsXmlComponent).internalLinkClicked.emit('testIri');

            expect((testHostComponent.linkValClicked as ReadLinkValue).linkedResourceIri).toEqual('testIri');

        });

        it('should not react to clicking on a standoff link when there is no corresponding standoff link value', () => {

            // assign value also updates the standoff link in propArray
            testHostComponent.assignValue('http://0.0.0.0:3333/ontology/0001/anything/v2#hasRichtext');

            // simulate situation
            // where the standoff link was not updated
            testHostComponent.propArray[0].values = [];

            testHostFixture.detectChanges();

            expect(testHostComponent.linkValClicked).toEqual('init');

            (testHostComponent.displayEditValueComponent.displayValueComponent as unknown as TestTextValueAsXmlComponent).internalLinkClicked.emit('testIri');

            expect(testHostComponent.linkValClicked).toEqual('init');
        });

        it('should react to hovering on a standoff link', () => {

            // assign value also updates the standoff link in propArray
            testHostComponent.assignValue('http://0.0.0.0:3333/ontology/0001/anything/v2#hasRichtext');
            testHostFixture.detectChanges();

            expect(testHostComponent.linkValHovered).toEqual('init');

            (testHostComponent.displayEditValueComponent.displayValueComponent as unknown as TestTextValueAsXmlComponent).internalLinkHovered.emit('testIri');

            expect((testHostComponent.linkValHovered as ReadLinkValue).linkedResourceIri).toEqual('testIri');

        });

        it('should not react to hovering on a standoff link when there is no corresponding standoff link value', () => {

            // assign value also updates the standoff link in propArray
            testHostComponent.assignValue('http://0.0.0.0:3333/ontology/0001/anything/v2#hasRichtext');

            // simulate situation
            // where the standoff link was not updated
            testHostComponent.propArray[0].values = [];

            testHostFixture.detectChanges();

            expect(testHostComponent.linkValHovered).toEqual('init');

            (testHostComponent.displayEditValueComponent.displayValueComponent as unknown as TestTextValueAsXmlComponent).internalLinkHovered.emit('testIri');

            expect(testHostComponent.linkValHovered).toEqual('init');

        });

        it('should choose the apt component for an HTML text value in the template', () => {

            const inputVal: ReadTextValueAsHtml = new ReadTextValueAsHtml();

            inputVal.property = 'http://0.0.0.0:3333/ontology/0001/anything/v2#hasRichtext';
            inputVal.hasPermissions = 'CR knora-admin:Creator|M knora-admin:ProjectMember|V knora-admin:KnownUser|RV knora-admin:UnknownUser';
            inputVal.userHasPermission = 'CR';
            inputVal.type = 'http://api.knora.org/ontology/knora-api/v2#TextValue';
            inputVal.id = 'http://rdfh.ch/0001/H6gBWUuJSuuO-CilHV8kQw/values/TEST_ID';
            inputVal.html =
                '<p>This is a <b>very</b> simple HTML document with a <a href="https://www.google.ch" target="_blank" class="app-link">link</a></p>';

            testHostComponent.readValue = inputVal;

            testHostFixture.detectChanges();

            expect(testHostComponent.displayEditValueComponent.displayValueComponent instanceof TestTextValueAsHtmlComponent).toBe(true);
            expect(testHostComponent.displayEditValueComponent.displayValueComponent.displayValue instanceof ReadTextValueAsHtml).toBe(true);
            expect(testHostComponent.displayEditValueComponent.displayValueComponent.mode).toEqual('read');
        });

        it('should choose the apt component for an integer value in the template', () => {
            testHostComponent.assignValue('http://0.0.0.0:3333/ontology/0001/anything/v2#hasInteger');
            testHostFixture.detectChanges();

            expect(testHostComponent.displayEditValueComponent).toBeTruthy();

            expect(testHostComponent.displayEditValueComponent.displayValueComponent instanceof TestIntValueComponent).toBe(true);
            expect(testHostComponent.displayEditValueComponent.displayValueComponent.displayValue instanceof ReadIntValue).toBe(true);
            expect(testHostComponent.displayEditValueComponent.displayValueComponent.mode).toEqual('read');
        });

        it('should choose the apt component for a boolean value in the template', () => {
            testHostComponent.assignValue('http://0.0.0.0:3333/ontology/0001/anything/v2#hasBoolean');
            testHostFixture.detectChanges();

            expect(testHostComponent.displayEditValueComponent).toBeTruthy();

            expect(testHostComponent.displayEditValueComponent.displayValueComponent instanceof TestBooleanValueComponent).toBe(true);
            expect(testHostComponent.displayEditValueComponent.displayValueComponent.displayValue instanceof ReadBooleanValue).toBe(true);
            expect(testHostComponent.displayEditValueComponent.displayValueComponent.mode).toEqual('read');
        });

        it('should choose the apt component for a URI value in the template', () => {
            testHostComponent.assignValue('http://0.0.0.0:3333/ontology/0001/anything/v2#hasUri');
            testHostFixture.detectChanges();

            expect(testHostComponent.displayEditValueComponent).toBeTruthy();

            expect(testHostComponent.displayEditValueComponent.displayValueComponent instanceof TestUriValueComponent).toBe(true);
            expect(testHostComponent.displayEditValueComponent.displayValueComponent.displayValue instanceof ReadUriValue).toBe(true);
            expect(testHostComponent.displayEditValueComponent.displayValueComponent.mode).toEqual('read');
        });

        it('should choose the apt component for a decimal value in the template', () => {

            testHostComponent.assignValue('http://0.0.0.0:3333/ontology/0001/anything/v2#hasDecimal');
            testHostFixture.detectChanges();

            expect(testHostComponent.displayEditValueComponent.displayValueComponent instanceof TestDecimalValueComponent).toBe(true);
            expect(testHostComponent.displayEditValueComponent.displayValueComponent.displayValue instanceof ReadDecimalValue).toBe(true);
            expect(testHostComponent.displayEditValueComponent.displayValueComponent.mode).toEqual('read');
        });

        it('should choose the apt component for a color value in the template', () => {

            testHostComponent.assignValue('http://0.0.0.0:3333/ontology/0001/anything/v2#hasColor');
            testHostFixture.detectChanges();

            expect(testHostComponent.displayEditValueComponent.displayValueComponent instanceof TestColorValueComponent).toBe(true);
            expect(testHostComponent.displayEditValueComponent.displayValueComponent.displayValue instanceof ReadColorValue).toBe(true);
            expect(testHostComponent.displayEditValueComponent.displayValueComponent.mode).toEqual('read');
        });

        it('should choose the apt component for an interval value in the template', () => {

            testHostComponent.assignValue('http://0.0.0.0:3333/ontology/0001/anything/v2#hasInterval');
            testHostFixture.detectChanges();

            expect(testHostComponent.displayEditValueComponent.displayValueComponent instanceof TestIntervalValueComponent).toBe(true);
            expect(testHostComponent.displayEditValueComponent.displayValueComponent.displayValue instanceof ReadIntervalValue).toBe(true);
            expect(testHostComponent.displayEditValueComponent.displayValueComponent.mode).toEqual('read');
        });

        it('should choose the apt component for a time value in the template', () => {

            testHostComponent.assignValue('http://0.0.0.0:3333/ontology/0001/anything/v2#hasTimeStamp');
            testHostFixture.detectChanges();

            expect(testHostComponent.displayEditValueComponent.displayValueComponent instanceof TestTimeValueComponent).toBe(true);
            expect(testHostComponent.displayEditValueComponent.displayValueComponent.displayValue instanceof ReadTimeValue).toBe(true);
            expect(testHostComponent.displayEditValueComponent.displayValueComponent.mode).toEqual('read');
        });

        it('should choose the apt component for a link value in the template', () => {

            testHostComponent.assignValue('http://0.0.0.0:3333/ontology/0001/anything/v2#hasOtherThingValue');
            testHostFixture.detectChanges();

            expect(testHostComponent.displayEditValueComponent.displayValueComponent instanceof TestLinkValueComponent).toBe(true);
            expect(testHostComponent.displayEditValueComponent.displayValueComponent.displayValue instanceof ReadLinkValue).toBe(true);
            expect(testHostComponent.displayEditValueComponent.displayValueComponent.mode).toEqual('read');
            expect((testHostComponent.displayEditValueComponent.displayValueComponent as unknown as TestLinkValueComponent).parentResource instanceof ReadResource).toBe(true);
            expect((testHostComponent.displayEditValueComponent.displayValueComponent as unknown as TestLinkValueComponent).propIri).
                toEqual('http://0.0.0.0:3333/ontology/0001/anything/v2#hasOtherThingValue');

            const userServiceSpy = TestBed.inject(UserService);

            expect(userServiceSpy.getUser).toHaveBeenCalledTimes(1);
            expect(userServiceSpy.getUser).toHaveBeenCalledWith('http://rdfh.ch/users/BhkfBc3hTeS_IDo-JgXRbQ');

        });

        it('should choose the apt component for a link value in the template and react to a click event', () => {

            testHostComponent.assignValue('http://0.0.0.0:3333/ontology/0001/anything/v2#hasOtherThingValue');
            testHostFixture.detectChanges();

            expect(testHostComponent.linkValClicked).toEqual('init');

            (testHostComponent.displayEditValueComponent.displayValueComponent as unknown as TestLinkValueComponent)
                .referredResourceClicked
                .emit((testHostComponent.displayEditValueComponent.displayValueComponent as unknown as TestLinkValueComponent).displayValue);

            expect((testHostComponent.linkValClicked as ReadLinkValue).linkedResourceIri).toEqual('http://rdfh.ch/0001/0C-0L1kORryKzJAJxxRyRQ');

        });

        it('should choose the apt component for a link value in the template and react to a hover event', () => {

            testHostComponent.assignValue('http://0.0.0.0:3333/ontology/0001/anything/v2#hasOtherThingValue');
            testHostFixture.detectChanges();

            expect(testHostComponent.linkValHovered).toEqual('init');

            (testHostComponent.displayEditValueComponent.displayValueComponent as unknown as TestLinkValueComponent)
                .referredResourceHovered
                .emit((testHostComponent.displayEditValueComponent.displayValueComponent as unknown as TestLinkValueComponent).displayValue);

            expect((testHostComponent.linkValHovered as ReadLinkValue).linkedResourceIri).toEqual('http://rdfh.ch/0001/0C-0L1kORryKzJAJxxRyRQ');

        });

        it('should choose the apt component for a link value (standoff link) in the template', () => {

            testHostComponent.assignValue('http://0.0.0.0:3333/ontology/0001/anything/v2#hasOtherThingValue');
            testHostComponent.readValue.property = Constants.HasStandoffLinkToValue;
            testHostComponent.readValue.attachedToUser = 'http://www.knora.org/ontology/knora-admin#SystemUser'; // sstandoff links are managed by the system
            testHostFixture.detectChanges();

            expect(testHostComponent.displayEditValueComponent.displayValueComponent instanceof TestLinkValueComponent).toBe(true);
            expect(testHostComponent.displayEditValueComponent.displayValueComponent.displayValue instanceof ReadLinkValue).toBe(true);
            expect(testHostComponent.displayEditValueComponent.displayValueComponent.mode).toEqual('read');
            expect((testHostComponent.displayEditValueComponent.displayValueComponent as unknown as TestLinkValueComponent).parentResource instanceof ReadResource).toBe(true);
            expect((testHostComponent.displayEditValueComponent.displayValueComponent as unknown as TestLinkValueComponent).propIri).toEqual(Constants.HasStandoffLinkToValue);

            const userServiceSpy = TestBed.inject(UserService);

            // user info should not be retrieved for system user
            expect(userServiceSpy.getUser).toHaveBeenCalledTimes(0);

        });

        it('should choose the apt component for a list value in the template', () => {
            testHostComponent.assignValue('http://0.0.0.0:3333/ontology/0001/anything/v2#hasListItem');
            testHostFixture.detectChanges();

            expect(testHostComponent.displayEditValueComponent).toBeTruthy();

            expect(testHostComponent.displayEditValueComponent.displayValueComponent instanceof TestListValueComponent).toBe(true);
            expect(testHostComponent.displayEditValueComponent.displayValueComponent.displayValue instanceof ReadListValue).toBe(true);
            expect(testHostComponent.displayEditValueComponent.displayValueComponent.mode).toEqual('read');
        });

        it('should choose the apt component for a geoname value in the template', () => {
            testHostComponent.assignValue('http://0.0.0.0:3333/ontology/0001/anything/v2#hasGeoname');
            testHostFixture.detectChanges();

            expect(testHostComponent.displayEditValueComponent).toBeTruthy();

            expect(testHostComponent.displayEditValueComponent.displayValueComponent instanceof TestGeonameValueComponent).toBe(true);
            expect(testHostComponent.displayEditValueComponent.displayValueComponent.displayValue instanceof ReadGeonameValue).toBe(true);
            expect(testHostComponent.displayEditValueComponent.displayValueComponent.mode).toEqual('read');
        });

    });

    describe('change from display to edit mode', () => {
        let hostCompDe;
        let displayEditComponentDe;

        beforeEach(() => {
            testHostComponent.assignValue('http://0.0.0.0:3333/ontology/0001/anything/v2#hasInteger');
            testHostFixture.detectChanges();

            expect(testHostComponent.displayEditValueComponent).toBeTruthy();

            hostCompDe = testHostFixture.debugElement;
            displayEditComponentDe = hostCompDe.query(By.directive(DisplayEditComponent));

            testHostComponent.displayEditValueComponent.showActionBubble = true;
            testHostFixture.detectChanges();


        });

        it('should display an edit button if the user has the necessary permissions', () => {
            expect(testHostComponent.displayEditValueComponent.canModify).toBeTruthy();
            expect(testHostComponent.displayEditValueComponent.editModeActive).toBeFalsy();

            const editButtonDebugElement = displayEditComponentDe.query(By.css('button.edit'));

            expect(editButtonDebugElement).toBeTruthy();
            expect(editButtonDebugElement.nativeElement).toBeTruthy();

        });

        it('should switch to edit mode when the edit button is clicked', () => {

            const editButtonDebugElement = displayEditComponentDe.query(By.css('button.edit'));
            const editButtonNativeElement = editButtonDebugElement.nativeElement;

            editButtonNativeElement.click();
            testHostFixture.detectChanges();

            expect(testHostComponent.displayEditValueComponent.editModeActive).toBeTruthy();
            expect(testHostComponent.displayEditValueComponent.displayValueComponent.form.valid).toBeFalsy();

            const saveButtonDebugElement = displayEditComponentDe.query(By.css('button.save'));
            const saveButtonNativeElement = saveButtonDebugElement.nativeElement;

            expect(saveButtonNativeElement.disabled).toBeTruthy();

        });

        it('should save a new version of a value', () => {

            const valueEventSpy = TestBed.inject(ValueOperationEventService);

            const valuesSpy = TestBed.inject(DspApiConnectionToken);

            (valueEventSpy as jasmine.SpyObj<ValueOperationEventService>).emit.and.stub();

            (valuesSpy.v2.values as jasmine.SpyObj<ValuesEndpointV2>).updateValue.and.callFake(
                () => {

                    const response = new WriteValueResponse();

                    response.id = 'newID';
                    response.type = 'type';
                    response.uuid = 'uuid';

                    return of(response);
                }
            );

            (valuesSpy.v2.values as jasmine.SpyObj<ValuesEndpointV2>).getValue.and.callFake(
                () => {

                    const updatedVal = new ReadIntValue();

                    updatedVal.id = 'newID';
                    updatedVal.int = 1;

                    const resource = new ReadResource();

                    resource.properties = {
                        'http://0.0.0.0:3333/ontology/0001/anything/v2#hasInteger': [updatedVal]
                    };

                    return of(resource);
                }
            );

            testHostComponent.displayEditValueComponent.canModify = true;
            testHostComponent.displayEditValueComponent.editModeActive = true;
            testHostComponent.displayEditValueComponent.mode = 'update';

            testHostComponent.displayEditValueComponent.displayValueComponent.form.controls.test.clearValidators();
            testHostComponent.displayEditValueComponent.displayValueComponent.form.controls.test.updateValueAndValidity();

            testHostFixture.detectChanges();

            const saveButtonDebugElement = displayEditComponentDe.query(By.css('button.save'));
            const saveButtonNativeElement = saveButtonDebugElement.nativeElement;

            expect(saveButtonNativeElement.disabled).toBeFalsy();

            saveButtonNativeElement.click();

            testHostFixture.detectChanges();

            const expectedUpdateResource = new UpdateResource<UpdateValue>();

            expectedUpdateResource.id = 'http://rdfh.ch/0001/H6gBWUuJSuuO-CilHV8kQw';
            expectedUpdateResource.type = 'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing';
            expectedUpdateResource.property = 'http://0.0.0.0:3333/ontology/0001/anything/v2#hasInteger';

            const expectedUpdateVal = new UpdateIntValue();
            expectedUpdateVal.id = 'http://rdfh.ch/0001/H6gBWUuJSuuO-CilHV8kQw/values/dJ1ES8QTQNepFKF5-EAqdg';
            expectedUpdateVal.int = 1;

            expectedUpdateResource.value = expectedUpdateVal;

            expect(valuesSpy.v2.values.updateValue).toHaveBeenCalledWith(expectedUpdateResource);
            expect(valuesSpy.v2.values.updateValue).toHaveBeenCalledTimes(1);

            expect(valueEventSpy.emit).toHaveBeenCalledTimes(1);
            expect(valueEventSpy.emit).toHaveBeenCalledWith(new EmitEvent(Events.ValueUpdated, new UpdatedEventValues(
                testHostComponent.readValue, testHostComponent.displayEditValueComponent.displayValue)));

            expect(valuesSpy.v2.values.getValue).toHaveBeenCalledTimes(1);
            expect(valuesSpy.v2.values.getValue).toHaveBeenCalledWith(testHostComponent.readResource.id, 'uuid');

            expect(testHostComponent.displayEditValueComponent.displayValue.id).toEqual('newID');
            expect(testHostComponent.displayEditValueComponent.displayValueComponent.displayValue.id).toEqual('newID');
            expect(testHostComponent.displayEditValueComponent.mode).toEqual('read');



        });

        it('should handle an ApiResponseError with status of 400 correctly', () => {

            const valuesSpy = TestBed.inject(DspApiConnectionToken);

            const error = ApiResponseError.fromAjaxError({} as AjaxError);

            error.status = 400;

            (valuesSpy.v2.values as jasmine.SpyObj<ValuesEndpointV2>).updateValue.and.returnValue(throwError(error));

            testHostComponent.displayEditValueComponent.canModify = true;
            testHostComponent.displayEditValueComponent.editModeActive = true;
            testHostComponent.displayEditValueComponent.mode = 'update';

            testHostComponent.displayEditValueComponent.displayValueComponent.form.controls.test.clearValidators();
            testHostComponent.displayEditValueComponent.displayValueComponent.form.controls.test.updateValueAndValidity();

            testHostFixture.detectChanges();

            const saveButtonDebugElement = displayEditComponentDe.query(By.css('button.save'));
            const saveButtonNativeElement = saveButtonDebugElement.nativeElement;

            expect(saveButtonNativeElement.disabled).toBeFalsy();

            saveButtonNativeElement.click();

            testHostFixture.detectChanges();

            const formErrors = testHostComponent.displayEditValueComponent.displayValueComponent.valueFormControl.errors;

            const expectedErrors = {
                duplicateValue: true
            };

            expect(formErrors).toEqual(expectedErrors);

        });

    });

    describe('do not change from display to edit mode for an html text value', () => {
        let hostCompDe;
        let displayEditComponentDe;

        it('should not display the edit button', () => {
            const inputVal: ReadTextValueAsHtml = new ReadTextValueAsHtml();

            inputVal.property = 'http://0.0.0.0:3333/ontology/0001/anything/v2#hasRichtext';
            inputVal.hasPermissions = 'CR knora-admin:Creator|M knora-admin:ProjectMember|V knora-admin:KnownUser|RV knora-admin:UnknownUser';
            inputVal.userHasPermission = 'CR';
            inputVal.type = 'http://api.knora.org/ontology/knora-api/v2#TextValue';
            inputVal.id = 'http://rdfh.ch/0001/H6gBWUuJSuuO-CilHV8kQw/values/TEST_ID';
            inputVal.html =
                '<p>This is a <b>very</b> simple HTML document with a <a href="https://www.google.ch" target="_blank" class="app-link">link</a></p>';

            testHostComponent.readValue = inputVal;

            testHostFixture.detectChanges();

            expect(testHostComponent.displayEditValueComponent).toBeTruthy();

            hostCompDe = testHostFixture.debugElement;
            displayEditComponentDe = hostCompDe.query(By.directive(DisplayEditComponent));

            const editButtonDebugElement = displayEditComponentDe.query(By.css('button.edit'));
            expect(editButtonDebugElement).toBe(null);


        });

    });

    describe('comment toggle button', () => {
        let hostCompDe;
        let displayEditComponentDe;

        beforeEach(() => {
            testHostComponent.assignValue('http://0.0.0.0:3333/ontology/0001/anything/v2#hasInteger', 'comment');
            testHostFixture.detectChanges();

            expect(testHostComponent.displayEditValueComponent).toBeTruthy();

            hostCompDe = testHostFixture.debugElement;
            displayEditComponentDe = hostCompDe.query(By.directive(DisplayEditComponent));

            testHostComponent.displayEditValueComponent.showActionBubble = true;
            testHostFixture.detectChanges();
        });

        it('should display a comment button if the value has a comment', () => {
            expect(testHostComponent.displayEditValueComponent.editModeActive).toBeFalsy();
            expect(testHostComponent.displayEditValueComponent.shouldShowCommentToggle).toBeTruthy();

            const commentButtonDebugElement = displayEditComponentDe.query(By.css('button.comment-toggle'));

            expect(commentButtonDebugElement).toBeTruthy();
            expect(commentButtonDebugElement.nativeElement).toBeTruthy();

        });

        it('should not display a comment button if the comment is deleted', () => {

            const valuesSpy = TestBed.inject(DspApiConnectionToken);

            (valuesSpy.v2.values as jasmine.SpyObj<ValuesEndpointV2>).updateValue.and.callFake(
                () => {

                    const response = new WriteValueResponse();

                    response.id = 'newID';
                    response.type = 'type';
                    response.uuid = 'uuid';

                    return of(response);
                }
            );

            (valuesSpy.v2.values as jasmine.SpyObj<ValuesEndpointV2>).getValue.and.callFake(
                () => {

                    const updatedVal = new ReadIntValue();

                    updatedVal.id = 'newID';
                    updatedVal.int = 1;
                    updatedVal.valueHasComment = '';

                    const resource = new ReadResource();

                    resource.properties = {
                        'http://0.0.0.0:3333/ontology/0001/anything/v2#hasInteger': [updatedVal]
                    };

                    return of(resource);
                }
            );

            testHostComponent.displayEditValueComponent.canModify = true;
            testHostComponent.displayEditValueComponent.editModeActive = true;
            testHostComponent.displayEditValueComponent.mode = 'update';

            testHostComponent.displayEditValueComponent.displayValueComponent.form.controls.test.clearValidators();
            testHostComponent.displayEditValueComponent.displayValueComponent.form.controls.test.updateValueAndValidity();

            testHostFixture.detectChanges();

            expect(testHostComponent.displayEditValueComponent.shouldShowCommentToggle).toBeTruthy();

            const saveButtonDebugElement = displayEditComponentDe.query(By.css('button.save'));
            const saveButtonNativeElement = saveButtonDebugElement.nativeElement;

            expect(saveButtonNativeElement.disabled).toBeFalsy();

            saveButtonNativeElement.click();

            testHostFixture.detectChanges();

            const expectedUpdateResource = new UpdateResource<UpdateValue>();

            expectedUpdateResource.id = 'http://rdfh.ch/0001/H6gBWUuJSuuO-CilHV8kQw';
            expectedUpdateResource.type = 'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing';
            expectedUpdateResource.property = 'http://0.0.0.0:3333/ontology/0001/anything/v2#hasInteger';

            const expectedUpdateVal = new UpdateIntValue();
            expectedUpdateVal.id = 'http://rdfh.ch/0001/H6gBWUuJSuuO-CilHV8kQw/values/dJ1ES8QTQNepFKF5-EAqdg';
            expectedUpdateVal.int = 1;

            expectedUpdateResource.value = expectedUpdateVal;

            expect(valuesSpy.v2.values.updateValue).toHaveBeenCalledWith(expectedUpdateResource);
            expect(valuesSpy.v2.values.updateValue).toHaveBeenCalledTimes(1);

            expect(valuesSpy.v2.values.getValue).toHaveBeenCalledTimes(1);
            expect(valuesSpy.v2.values.getValue).toHaveBeenCalledWith(testHostComponent.readResource.id,
                'uuid');

            expect(testHostComponent.displayEditValueComponent.displayValue.id).toEqual('newID');
            expect(testHostComponent.displayEditValueComponent.displayValue.valueHasComment).toEqual('');

            expect(testHostComponent.displayEditValueComponent.shouldShowCommentToggle).toBeFalsy();
            expect(testHostComponent.displayEditValueComponent.mode).toEqual('read');

        });

    });

    describe('deleteValue method', () => {
        let hostCompDe;
        let displayEditComponentDe;
        let rootLoader: HarnessLoader;
        let overlayContainer: OverlayContainer;

        beforeEach(() => {
            testHostComponent.assignValue('http://0.0.0.0:3333/ontology/0001/anything/v2#hasInteger');
            testHostFixture.detectChanges();

            expect(testHostComponent.displayEditValueComponent).toBeTruthy();

            hostCompDe = testHostFixture.debugElement;
            displayEditComponentDe = hostCompDe.query(By.directive(DisplayEditComponent));

            testHostComponent.displayEditValueComponent.showActionBubble = true;
            testHostFixture.detectChanges();

            overlayContainer = TestBed.inject(OverlayContainer);
            rootLoader = TestbedHarnessEnvironment.documentRootLoader(testHostFixture);
        });

        afterEach(async () => {
            const dialogs = await rootLoader.getAllHarnesses(MatDialogHarness);
            await Promise.all(dialogs.map(async d => await d.close()));

            // angular won't call this for us so we need to do it ourselves to avoid leaks.
            overlayContainer.ngOnDestroy();
        });

        it('should delete a value from a property', async () => {
            const valueEventSpy = TestBed.inject(ValueOperationEventService);

            const valuesSpy = TestBed.inject(DspApiConnectionToken);

            (valueEventSpy as jasmine.SpyObj<ValueOperationEventService>).emit.and.stub();

            (valuesSpy.v2.values as jasmine.SpyObj<ValuesEndpointV2>).deleteValue.and.callFake(
                () => {

                    const response = new DeleteValueResponse();

                    response.result = 'success';

                    return of(response);
                }
            );

            const deleteButton = await rootLoader.getHarness(MatButtonHarness.with({ selector: '.delete' }));
            await deleteButton.click();

            const dialogHarnesses = await rootLoader.getAllHarnesses(MatDialogHarness);

            expect(dialogHarnesses.length).toEqual(1);

            const okButton = await rootLoader.getHarness(MatButtonHarness.with({ selector: '.ok' }));

            await okButton.click();

            const expectedUpdateResource = new UpdateResource<DeleteValue>();

            expectedUpdateResource.id = 'http://rdfh.ch/0001/H6gBWUuJSuuO-CilHV8kQw';
            expectedUpdateResource.type = 'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing';
            expectedUpdateResource.property = 'http://0.0.0.0:3333/ontology/0001/anything/v2#hasInteger';

            const deleteVal = new DeleteValue();
            deleteVal.id = 'http://rdfh.ch/0001/H6gBWUuJSuuO-CilHV8kQw/values/dJ1ES8QTQNepFKF5-EAqdg';
            deleteVal.type = 'http://api.knora.org/ontology/knora-api/v2#IntValue';
            deleteVal.deleteComment = undefined;

            expectedUpdateResource.value = deleteVal;

            testHostFixture.whenStable().then(() => {
                expect(valuesSpy.v2.values.deleteValue).toHaveBeenCalledWith(expectedUpdateResource);
                expect(valuesSpy.v2.values.deleteValue).toHaveBeenCalledTimes(1);

                expect(valueEventSpy.emit).toHaveBeenCalledTimes(1);
                expect(valueEventSpy.emit).toHaveBeenCalledWith(new EmitEvent(Events.ValueDeleted, new DeletedEventValue(deleteVal)));
            });

        });

        it('should send a deletion comment to Knora if one is provided', async () => {
            const valueEventSpy = TestBed.inject(ValueOperationEventService);

            const valuesSpy = TestBed.inject(DspApiConnectionToken);

            (valueEventSpy as jasmine.SpyObj<ValueOperationEventService>).emit.and.stub();

            (valuesSpy.v2.values as jasmine.SpyObj<ValuesEndpointV2>).deleteValue.and.callFake(
                () => {

                    const response = new DeleteValueResponse();

                    response.result = 'success';

                    return of(response);
                }
            );

            testHostComponent.displayEditValueComponent.deleteValue('my deletion comment');

            const expectedUpdateResource = new UpdateResource<DeleteValue>();

            expectedUpdateResource.id = 'http://rdfh.ch/0001/H6gBWUuJSuuO-CilHV8kQw';
            expectedUpdateResource.type = 'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing';
            expectedUpdateResource.property = 'http://0.0.0.0:3333/ontology/0001/anything/v2#hasInteger';

            const deleteVal = new DeleteValue();
            deleteVal.id = 'http://rdfh.ch/0001/H6gBWUuJSuuO-CilHV8kQw/values/dJ1ES8QTQNepFKF5-EAqdg';
            deleteVal.type = 'http://api.knora.org/ontology/knora-api/v2#IntValue';
            deleteVal.deleteComment = 'my deletion comment';

            expectedUpdateResource.value = deleteVal;

            testHostFixture.whenStable().then(() => {
                expect(valuesSpy.v2.values.deleteValue).toHaveBeenCalledWith(expectedUpdateResource);
                expect(valuesSpy.v2.values.deleteValue).toHaveBeenCalledTimes(1);
            });
        });

        it('should disable the delete button', async () => {
            testHostComponent.displayEditValueComponent.canDelete = false;

            testHostFixture.detectChanges();

            const deleteButton = await rootLoader.getHarness(MatButtonHarness.with({ selector: '.delete' }));
            expect(deleteButton.isDisabled).toBeTruthy;
        });
    });
});
