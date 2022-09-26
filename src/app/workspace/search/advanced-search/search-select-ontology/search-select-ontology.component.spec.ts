import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { OntologiesMetadata, OntologyMetadata, MockOntology } from '@dasch-swiss/dsp-js';
import { UntypedFormBuilder, UntypedFormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { HarnessLoader } from '@angular/cdk/testing';
import { MatSelectHarness } from '@angular/material/select/testing';
import { SearchSelectOntologyComponent } from './search-select-ontology.component';

/**
 * test host component to simulate parent component.
 */
@Component({
    template: `
        <app-search-select-ontology #selectOnto [formGroup]="form" [ontologiesMetadata]="ontoMetadata"
                             (ontologySelected)="ontoSelected($event)"></app-search-select-ontology>`
})
class TestHostComponent implements OnInit {

    @ViewChild('selectOnto') selectOntology: SearchSelectOntologyComponent;

    ontoMetadata: OntologiesMetadata;

    form: UntypedFormGroup;

    selectedOntoIri: string;

    constructor(@Inject(UntypedFormBuilder) private _fb: UntypedFormBuilder) {
    }

    ngOnInit() {
        this.form = this._fb.group({});

        this.ontoMetadata = MockOntology.mockOntologiesMetadata();
    }

    ontoSelected(ontoIri: string) {
        this.selectedOntoIri = ontoIri;
    }
}

describe('SearchSelectOntologyComponent', () => {
    let testHostComponent: TestHostComponent;
    let testHostFixture: ComponentFixture<TestHostComponent>;

    let loader: HarnessLoader;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [
                BrowserAnimationsModule,
                ReactiveFormsModule,
                MatSelectModule,
                MatOptionModule
            ],
            declarations: [
                SearchSelectOntologyComponent,
                TestHostComponent]
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

    it('should add a new control to the parent form', () => {

        expect(testHostComponent.form.contains('ontologies')).toBe(true);

    });

    it('should initialise the ontologies\' metadata', () => {

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
