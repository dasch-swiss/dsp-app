import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSelectHarness } from '@angular/material/select/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MockOntology, ResourceClassDefinition } from '@dasch-swiss/dsp-js';
import { SelectResourceClassComponent } from './select-resource-class.component';
import { By } from '@angular/platform-browser';


// https://dev.to/krumpet/generic-type-guard-in-typescript-258l
type Constructor<T> = { new(...args: any[]): T };

const typeGuard = <T>(o: any, className: Constructor<T>): o is T => {
    return o instanceof className;
};

/**
 * Test host component to simulate parent component.
 */
@Component({
    template: `
       <app-select-resource-class
            #selectResource
            [formGroup]="form"
            [resourceClassDefinitions]="resourceClasses"
            (resourceClassSelected)="selectResourceClass($event)"
            (resourceLabel)="getResourceLabel($event)">
        </app-select-resource-class>`
})
class TestHostComponent implements OnInit {

    @ViewChild('selectResource') selectResource: SelectResourceClassComponent;

    form: FormGroup;
    resourceClasses: ResourceClassDefinition[];
    selectedResourceIri: string;
    resLabel: string;

    constructor(@Inject(FormBuilder) private _fb: FormBuilder) {
    }

    ngOnInit() {

        const resClasses = MockOntology.mockReadOntology('http://0.0.0.0:3333/ontology/0001/anything/v2').classes;

        const resClassIris = Object.keys(resClasses);

        // get resource class definitions
        this.resourceClasses = resClassIris.filter(resClassIri => {
            return typeGuard(resClasses[resClassIri], ResourceClassDefinition);
        }).map(
            (resClassIri: string) => {
                return resClasses[resClassIri] as ResourceClassDefinition;
            }
        );

        this.form = this._fb.group({});
    }

    selectResourceClass(resourceClassIri: string) {
        this.selectedResourceIri = resourceClassIri;
    }

    getResourceLabel(label: string) {
        this.resLabel = label;
    }
}

describe('SelectResourceClassComponent', () => {
    let testHostComponent: TestHostComponent;
    let testHostFixture: ComponentFixture<TestHostComponent>;
    let loader: HarnessLoader;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
        declarations: [ SelectResourceClassComponent, TestHostComponent ],
        imports: [
            ReactiveFormsModule,
            FormsModule,
            BrowserAnimationsModule,
            MatFormFieldModule,
            MatSelectModule,
            MatInputModule ]
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
        expect(testHostComponent.selectResource).toBeTruthy();
    });

    it('should add 2 new controls to the parent form', () => {
        expect(testHostComponent.form.contains('resources')).toBe(true);
        expect(testHostComponent.form.contains('label')).toBe(true);
    });

    it('should initialise the resource classes', () => {
        expect(testHostComponent.selectResource.resourceClassDefinitions).toBeDefined();
        expect(testHostComponent.selectResource.resourceClassDefinitions.length).toEqual(8);
    });

    it('should init the MatSelect and MatOptions correctly', async () => {

        const select = await loader.getHarness(MatSelectHarness);
        const initVal = await select.getValueText();

        // placeholder
        expect(initVal).toEqual('Select a resource class');

        await select.open();

        const options = await select.getOptions();

        expect(options.length).toEqual(8);

        const option1 = await options[0].getText();

        expect(option1).toEqual('Blue thing');

        const option2 = await options[1].getText();

        expect(option2).toEqual('Thing');

    });

    it('should fill in the label correctly', () => {

        const labelInput = testHostFixture.debugElement.query(By.css('input.label'));

        const el = labelInput.nativeElement;

        expect(el.value).toEqual('');

        el.value = 'resource label';

        testHostFixture.detectChanges();

        expect(el.value).toEqual('resource label');
    });

    it('should emit the Iri of a selected resource class', async () => {

        expect(testHostComponent.selectedResourceIri).toBeUndefined();

        const select = await loader.getHarness(MatSelectHarness);

        await select.open();

        const options = await select.getOptions({ text: 'Blue thing' });

        expect(options.length).toEqual(1);

        await options[0].click();

        expect(testHostComponent.selectedResourceIri).toEqual('http://0.0.0.0:3333/ontology/0001/anything/v2#BlueThing');

    });

    it('should emit the label of the resource class', async () => {

        const inputElement = await loader.getHarness(MatInputHarness.with({selector: 'input.label'}));

        expect(await inputElement.getValue()).toEqual('');
        expect(testHostComponent.resLabel).toBeUndefined();

        await inputElement.setValue('resource label');

        expect(testHostComponent.resLabel).toEqual('resource label');
    });

    it('should unsubscribe from from changes on destruction', () => {

        expect(testHostComponent.selectResource.resourceChangesSubscription.closed).toBe(false);

        testHostFixture.destroy();

        expect(testHostComponent.selectResource.resourceChangesSubscription.closed).toBe(true);

    });
});
