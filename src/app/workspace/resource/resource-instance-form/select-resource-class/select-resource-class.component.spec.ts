import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { UntypedFormBuilder, UntypedFormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSelectHarness } from '@angular/material/select/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MockOntology, ResourceClassDefinition } from '@dasch-swiss/dsp-js';
import { SelectResourceClassComponent } from './select-resource-class.component';

/**
 * test host component to simulate parent component.
 */
@Component({
    template: `
       <app-select-resource-class
            #selectResource
            [formGroup]="form"
            [resourceClassDefinitions]="resourceClasses"
            (resourceClassSelected)="selectResourceClass($event)">
        </app-select-resource-class>`
})
class TestHostComponent implements OnInit {

    @ViewChild('selectResource') selectResource: SelectResourceClassComponent;

    form: UntypedFormGroup;
    resourceClasses: ResourceClassDefinition[];
    selectedResourceIri: string;

    constructor(@Inject(UntypedFormBuilder) private _fb: UntypedFormBuilder) {
    }

    ngOnInit() {

        const resClasses = MockOntology.mockReadOntology('http://0.0.0.0:3333/ontology/0001/anything/v2').classes;

        const resClassIris = Object.keys(resClasses);

        // get resource class definitions
        this.resourceClasses = MockOntology.mockReadOntology('http://0.0.0.0:3333/ontology/0001/anything/v2').getClassDefinitionsByType(ResourceClassDefinition);

        this.form = this._fb.group({});
    }

    selectResourceClass(resourceClassIri: string) {
        this.selectedResourceIri = resourceClassIri;
    }

}

describe('SelectResourceClassComponent', () => {
    let testHostComponent: TestHostComponent;
    let testHostFixture: ComponentFixture<TestHostComponent>;
    let loader: HarnessLoader;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [SelectResourceClassComponent, TestHostComponent],
            imports: [
                ReactiveFormsModule,
                FormsModule,
                BrowserAnimationsModule,
                MatFormFieldModule,
                MatSelectModule,
                MatInputModule]
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

    it('should add a new control to the parent form', waitForAsync(() => {
        // the control is added to the form as an async operation
        // https://angular.io/guide/testing#async-test-with-async
        testHostFixture.whenStable().then(
            () => {
                expect(testHostComponent.form.contains('resources')).toBe(true);
            }
        );
    }));

    it('should initialise the resource classes', () => {
        expect(testHostComponent.selectResource.resourceClassDefinitions).toBeDefined();
        expect(testHostComponent.selectResource.resourceClassDefinitions.length).toEqual(12);
    });

    it('should init the MatSelect and MatOptions correctly', async () => {

        const select = await loader.getHarness(MatSelectHarness);
        const initVal = await select.getValueText();

        // placeholder
        expect(initVal).toEqual('Select a resource class');

        await select.open();

        const options = await select.getOptions();

        expect(options.length).toEqual(12);

        const option1 = await options[0].getText();

        expect(option1).toEqual('Audio Sequence Thing');

        const option2 = await options[1].getText();

        expect(option2).toEqual('Audio Thing');

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

    it('should unsubscribe from from changes on destruction', () => {

        expect(testHostComponent.selectResource.resourceChangesSubscription.closed).toBe(false);

        testHostFixture.destroy();

        expect(testHostComponent.selectResource.resourceChangesSubscription.closed).toBe(true);

    });
});
