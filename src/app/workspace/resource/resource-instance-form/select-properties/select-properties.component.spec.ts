import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, ViewChild } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { By } from '@angular/platform-browser';
import { MockOntology, PropertyDefinition, ResourceClassAndPropertyDefinitions, ResourceClassDefinition, ResourcePropertyDefinition } from '@dasch-swiss/dsp-js';
import { SortingService } from '@dasch-swiss/dsp-ui';
import { Properties, SelectPropertiesComponent } from './select-properties.component';
import { SwitchPropertiesComponent } from './switch-properties/switch-properties.component';


// https://dev.to/krumpet/generic-type-guard-in-typescript-258l
type Constructor<T> = { new(...args: any[]): T };

const typeGuard = <T>(o: any, className: Constructor<T>): o is T => {
    return o instanceof className;
};

let propArrayLength = 0;

/**
 * Test host component to simulate parent component.
 */
@Component({
template: `
    <app-select-properties
    #selectProps
    [ontologyInfo]="ontoInfo"
    [resourceClass]="selectedResourceClass"
    [propertiesAsArray]="propertiesAsArray"
    [parentForm]="propertiesParentForm">
    </app-select-properties>`
})
class TestSelectPropertiesParentComponent implements OnInit {

    @ViewChild('selectProps') selectPropertiesComponent: SelectPropertiesComponent;

    ontoInfo: ResourceClassAndPropertyDefinitions;

    properties: Properties;

    selectedResourceClass: ResourceClassDefinition;

    propertiesAsArray: Array<ResourcePropertyDefinition>;

    propertiesParentForm: FormGroup;

    constructor(private _fb: FormBuilder,
                private _sortingService: SortingService) { }

    ngOnInit() {
        this.propertiesParentForm = this._fb.group({});

        this.ontoInfo = MockOntology.mockIResourceClassAndPropertyDefinitions('http://0.0.0.0:3333/ontology/0001/anything/v2#Thing');

        this.selectedResourceClass = this.ontoInfo.classes['http://0.0.0.0:3333/ontology/0001/anything/v2#Thing'];

        this.properties = this._makeResourceProperties(this.ontoInfo.properties);

        this.convertPropObjectAsArray();

        // in case the test data changes, use the length of propertiesAsArray in the tests instead of a hardcoded number
        propArrayLength = this.propertiesAsArray.length;

    }

    private _makeResourceProperties(propertyDefs: { [index: string]: PropertyDefinition }): Properties {
        const resProps: Properties = {};

        const propIris = Object.keys(propertyDefs);

        propIris.filter(
            (propIri: string) => {
                return typeGuard(propertyDefs[propIri], ResourcePropertyDefinition);
            }
        ).forEach((propIri: string) => {
            resProps[propIri] = (propertyDefs[propIri] as ResourcePropertyDefinition);
        });

        return resProps;
    }

    private convertPropObjectAsArray() {
        // represent the properties as an array to be accessed by the template
        const propsArray = [];

        for (const propIri in this.properties) {
            if (this.properties.hasOwnProperty(propIri)) {
                const prop = this.properties[propIri];

                // only list editable props that are not link value props
                if (prop.isEditable && !prop.isLinkProperty) {
                    propsArray.push(this.properties[propIri]);
                }
            }
        }

        // sort properties by label (ascending)
        this.propertiesAsArray = this._sortingService.keySortByAlphabetical(propsArray, 'label');
    }
}

describe('SelectPropertiesComponent', () => {
    let testHostComponent: TestSelectPropertiesParentComponent;
    let testHostFixture: ComponentFixture<TestSelectPropertiesParentComponent>;


    beforeEach(async(() => {

        TestBed.configureTestingModule({
            declarations: [
                SelectPropertiesComponent,
                SwitchPropertiesComponent,
                TestSelectPropertiesParentComponent
                ],
            imports: [
                MatTooltipModule
            ],
            providers: [
                FormBuilder
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA]
        })
        .compileComponents();
    }));

    beforeEach(() => {
        testHostFixture = TestBed.createComponent(TestSelectPropertiesParentComponent);
        testHostComponent = testHostFixture.componentInstance;
        testHostFixture.detectChanges();
        expect(testHostComponent).toBeTruthy();
    });

    it('should create a value component for each property', () => {
        expect(testHostComponent.selectPropertiesComponent.switchPropertiesComponent.length).toEqual(propArrayLength);
    });

    it('should create a key value pair object', () => {
        const propsArray = [];

        const keyValuePair = testHostComponent.selectPropertiesComponent.propertyValuesKeyValuePair;
        for (const propIri in keyValuePair) {
            if (keyValuePair.hasOwnProperty(propIri)) {
                propsArray.push(keyValuePair[propIri]);
            }
        }

        // each property has two entries in the keyValuePair object
        expect(propsArray.length).toEqual(propArrayLength * 2);
    });

    describe('Add/Delete functionality', () => {
        let hostComponentDe;
        let selectPropertiesComponentDe;

        beforeEach(() => {
            testHostFixture = TestBed.createComponent(TestSelectPropertiesParentComponent);
            testHostComponent = testHostFixture.componentInstance;
            hostComponentDe = testHostFixture.debugElement;
            selectPropertiesComponentDe = hostComponentDe.query(By.directive(SelectPropertiesComponent));
            testHostFixture.detectChanges();

            expect(testHostComponent).toBeTruthy();
        });

        it('should add a new form to the value when the add button is clicked', () => {
            const addButtons = selectPropertiesComponentDe.queryAll(By.css('.create'));
            const addButtonNativeElement = addButtons[0].nativeElement;

            // if this fails, that likely means the property has a cardinality of 0-1 meaning the plus button should not be shown
            expect(addButtonNativeElement).toBeDefined();

            addButtonNativeElement.click();

            expect(testHostComponent.selectPropertiesComponent.propertyValuesKeyValuePair[testHostComponent.propertiesAsArray[0].id].length).toEqual(2);
        });

        it('should delete a form from the value when the delete button is clicked', () => {
            testHostComponent.selectPropertiesComponent.propertyValuesKeyValuePair[testHostComponent.propertiesAsArray[0].id] = [0, 1];
            testHostComponent.selectPropertiesComponent.propertyValuesKeyValuePair[testHostComponent.propertiesAsArray[0].id + '-filtered'] = [0, 1];

            testHostFixture.detectChanges();

            let deleteButtons = selectPropertiesComponentDe.queryAll(By.css('.delete'));

            const deleteButtonNativeElement = deleteButtons[0].nativeElement;

            expect(deleteButtonNativeElement).toBeDefined();

            deleteButtonNativeElement.click();

            testHostFixture.detectChanges();

            const expectedArray = [undefined, 1];

            expect(testHostComponent.selectPropertiesComponent.propertyValuesKeyValuePair[testHostComponent.propertiesAsArray[0].id]).toEqual(expectedArray);

            deleteButtons = selectPropertiesComponentDe.queryAll(By.css('.delete'));

            expect(deleteButtons).toEqual([]);
        });
    });


});
