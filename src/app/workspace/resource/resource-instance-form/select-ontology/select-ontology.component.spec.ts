import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { UntypedFormBuilder, FormControl, UntypedFormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSelectHarness } from '@angular/material/select/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MockOntology, OntologiesMetadata } from '@dasch-swiss/dsp-js';

import { SelectOntologyComponent } from './select-ontology.component';

/**
 * test host component to simulate parent component.
 */
@Component({
    template: `
        <app-select-ontology
            #selectOntology
            [formGroup]="form"
            [ontologiesMetadata]="ontologiesMetadata"
            (ontologySelected)="ontologySelected($event)">
        </app-select-ontology>`
})
class TestHostComponent implements OnInit {

    @ViewChild('selectOntology') selectOntology: SelectOntologyComponent;

    form: UntypedFormGroup;
    ontologiesMetadata: OntologiesMetadata;
    selectedOntoIri: string;

    constructor(@Inject(UntypedFormBuilder) private _fb: UntypedFormBuilder) {
    }

    ngOnInit() {
        this.ontologiesMetadata = MockOntology.mockOntologiesMetadata();
        this.form = this._fb.group({});
    }

    ontologySelected(ontoIri: string) {
        this.selectedOntoIri = ontoIri;
    }
}

describe('SelectOntologyComponent', () => {
    let testHostComponent: TestHostComponent;
    let testHostFixture: ComponentFixture<TestHostComponent>;
    let loader: HarnessLoader;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [ SelectOntologyComponent, TestHostComponent ],
            imports: [
                ReactiveFormsModule,
                FormsModule,
                BrowserAnimationsModule,
                MatFormFieldModule,
                MatSelectModule
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
        expect(testHostComponent.selectOntology).toBeTruthy();
    });

    it('should add a new control to the parent form', waitForAsync(() => {
        // the control is added to the form as an async operation
        // https://angular.io/guide/testing#async-test-with-async
        testHostFixture.whenStable().then(
            () => {
                expect(testHostComponent.form.contains('ontologies')).toBe(true);
            }
        );
    }));

    it('should initialise the ontologies metadata', () => {
        expect(testHostComponent.selectOntology.ontologiesMetadata.ontologies).toBeDefined();
        expect(testHostComponent.selectOntology.ontologiesMetadata.ontologies.length).toEqual(15);
    });

    it('should init the MatSelect and MatOptions correctly', async () => {

        const select = await loader.getHarness(MatSelectHarness);
        const initVal = await select.getValueText();

        // placeholder
        expect(initVal).toEqual('Select a data model');

        await select.open();

        const options = await select.getOptions();

        expect(options.length).toEqual(15);

        const option1 = await options[0].getText();

        expect(option1).toEqual('The anything ontology');

        const option2 = await options[1].getText();

        expect(option2).toEqual('The free test ontology');

    });

    it('should emit the Iri of a selected ontology', async () => {

        expect(testHostComponent.selectedOntoIri).toBeUndefined();

        const select = await loader.getHarness(MatSelectHarness);

        await select.open();

        const options = await select.getOptions({ text: 'The anything ontology' });

        expect(options.length).toEqual(1);

        await options[0].click();

        expect(testHostComponent.selectedOntoIri).toEqual('http://0.0.0.0:3333/ontology/0001/anything/v2');
    });

    it('should unsubscribe from from changes on destruction', () => {

        expect(testHostComponent.selectOntology.ontologyChangesSubscription.closed).toBe(false);

        testHostFixture.destroy();

        expect(testHostComponent.selectOntology.ontologyChangesSubscription.closed).toBe(true);

    });

});
