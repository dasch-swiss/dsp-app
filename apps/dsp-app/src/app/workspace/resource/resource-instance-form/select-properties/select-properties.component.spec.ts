import {
    Component,
    CUSTOM_ELEMENTS_SCHEMA,
    OnInit,
    ViewChild,
} from '@angular/core';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
    MockOntology,
    ResourceClassAndPropertyDefinitions,
    ResourceClassDefinition,
    ResourcePropertyDefinition,
} from '@dasch-swiss/dsp-js';
import { SelectPropertiesComponent } from './select-properties.component';
import { SwitchPropertiesComponent } from './switch-properties/switch-properties.component';

/**
 * test host component to simulate parent component.
 */
@Component({
    template: ` <app-select-properties
        #selectProps
        [ontologyInfo]="ontoInfo"
        [selectedResourceClass]="selectedResourceClass"
        [properties]="properties"
        [parentForm]="propertiesParentForm"
        [currentOntoIri]="currentOntoIri"
    >
    </app-select-properties>`,
})
class TestSelectPropertiesParentComponent implements OnInit {
    @ViewChild('selectProps')
    selectPropertiesComponent: SelectPropertiesComponent;

    ontoInfo: ResourceClassAndPropertyDefinitions;

    properties: ResourcePropertyDefinition[];

    selectedResourceClass: ResourceClassDefinition;

    propertiesParentForm: UntypedFormGroup;

    currentOntoIri: string;

    constructor(private _fb: UntypedFormBuilder) {}

    ngOnInit() {
        this.propertiesParentForm = this._fb.group({});

        this.ontoInfo = MockOntology.mockIResourceClassAndPropertyDefinitions(
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing'
        );

        this.selectedResourceClass =
            this.ontoInfo.classes[
                'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing'
            ];

        this.properties = this.ontoInfo
            .getPropertyDefinitionsByType(ResourcePropertyDefinition)
            .filter((prop) => prop.isEditable && !prop.isLinkProperty);

        this.currentOntoIri = 'http://0.0.0.0:3333/ontology/0001/anything/v2';
    }
}

describe('SelectPropertiesComponent', () => {
    let testHostComponent: TestSelectPropertiesParentComponent;
    let testHostFixture: ComponentFixture<TestSelectPropertiesParentComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [
                SelectPropertiesComponent,
                SwitchPropertiesComponent,
                TestSelectPropertiesParentComponent,
            ],
            imports: [BrowserAnimationsModule, MatTooltipModule],
            providers: [UntypedFormBuilder],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    }));

    beforeEach(() => {
        testHostFixture = TestBed.createComponent(
            TestSelectPropertiesParentComponent
        );
        testHostComponent = testHostFixture.componentInstance;
        testHostFixture.detectChanges();
        expect(testHostComponent).toBeTruthy();
    });

    it('should create a value component for each property', () => {
        expect(
            testHostComponent.selectPropertiesComponent
                .switchPropertiesComponent.length
        ).toEqual(18);
    });

    it('should create a key value pair object', () => {
        const propsArray = [];

        const keyValuePair =
            testHostComponent.selectPropertiesComponent
                .propertyValuesKeyValuePair;
        for (const propIri in keyValuePair) {
            if (keyValuePair.hasOwnProperty(propIri)) {
                propsArray.push(keyValuePair[propIri]);
            }
        }

        // each property has three entries in the keyValuePair object
        expect(propsArray.length).toEqual(18 * 3);
    });

    describe('Add/Delete functionality', () => {
        let hostComponentDe;
        let selectPropertiesComponentDe;

        beforeEach(() => {
            testHostFixture = TestBed.createComponent(
                TestSelectPropertiesParentComponent
            );
            testHostComponent = testHostFixture.componentInstance;
            hostComponentDe = testHostFixture.debugElement;
            selectPropertiesComponentDe = hostComponentDe.query(
                By.directive(SelectPropertiesComponent)
            );
            testHostFixture.detectChanges();

            expect(testHostComponent).toBeTruthy();
        });

        it('should add a new form to the value when the add button is clicked', () => {
            const addButtons = selectPropertiesComponentDe.queryAll(
                By.css('.create')
            );
            const addButtonNativeElement = addButtons[0].nativeElement;

            // keep in mind that this element may not correspond to the first property as it simply grabs the first occurance of a plus button.
            // if the first property does not have a plus button due to it's cardinality, addButtonNativeElement will be the button for
            // the first property with a cardinality that allows for a plus button.
            expect(addButtonNativeElement).toBeDefined();

            addButtonNativeElement.click();

            // if this fails, that likely means the property has a cardinality of 0-1 and thus could not add another value.
            expect(
                testHostComponent.selectPropertiesComponent
                    .propertyValuesKeyValuePair[
                    testHostComponent.properties[1].id
                ].length
            ).toEqual(2);
        });

        it('should delete a form from the value when the delete button is clicked', () => {
            testHostComponent.selectPropertiesComponent.propertyValuesKeyValuePair[
                testHostComponent.properties[1].id
            ] = [0, 1];
            testHostComponent.selectPropertiesComponent.propertyValuesKeyValuePair[
                testHostComponent.properties[1].id + '-filtered'
            ] = [0, 1];

            testHostFixture.detectChanges();

            let deleteButtons = selectPropertiesComponentDe.queryAll(
                By.css('.delete')
            );

            const deleteButtonNativeElement = deleteButtons[0].nativeElement;

            expect(deleteButtonNativeElement).toBeDefined();

            deleteButtonNativeElement.click();

            testHostFixture.detectChanges();

            const expectedArray = [undefined, 1];

            expect(
                testHostComponent.selectPropertiesComponent
                    .propertyValuesKeyValuePair[
                    testHostComponent.properties[1].id
                ]
            ).toEqual(expectedArray);

            deleteButtons = selectPropertiesComponentDe.queryAll(
                By.css('.delete')
            );

            expect(deleteButtons).toEqual([]);
        });
    });
});
