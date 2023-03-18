import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, ReactiveFormsModule } from '@angular/forms';
import { MockOntology, ResourceClassDefinition } from '@dasch-swiss/dsp-js';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MatLegacyOptionModule as MatOptionModule } from '@angular/material/legacy-core';
import { MatLegacySelectHarness as MatSelectHarness } from '@angular/material/legacy-select/testing';
import { SearchSelectResourceClassComponent } from './search-select-resource-class.component';
import { SortingService } from 'src/app/main/services/sorting.service';

/**
 * test host component to simulate parent component.
 */
@Component({
    template: `
        <app-search-select-resource-class #selectResClass [formGroup]="form" [resourceClassDefinitions]="resourceClassDefs"
                                   (resourceClassSelected)="resClassSelected($event)"></app-search-select-resource-class>`
})
class TestHostComponent implements OnInit {

    @ViewChild('selectResClass') selectResourceClass: SearchSelectResourceClassComponent;

    form: UntypedFormGroup;

    resourceClassDefs: ResourceClassDefinition[];

    selectedResClassIri: string;

    constructor(
        @Inject(UntypedFormBuilder) private _fb: UntypedFormBuilder,
        private _sortingService: SortingService
    ) {
    }

    ngOnInit() {
        this.form = this._fb.group({});

        // get resource class defs
        this.resourceClassDefs = MockOntology.mockReadOntology('http://0.0.0.0:3333/ontology/0001/anything/v2').getClassDefinitionsByType(ResourceClassDefinition);
        this.resourceClassDefs = this._sortingService.keySortByAlphabetical(this.resourceClassDefs, 'label');

    }

    resClassSelected(resClassIri: string) {
        this.selectedResClassIri = resClassIri;
    }
}


describe('SearchSelectResourceClassComponent', () => {
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
                SearchSelectResourceClassComponent,
                TestHostComponent
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
        expect(testHostComponent.selectResourceClass).toBeTruthy();
    });

    it('should add a new control to the parent form', () => {

        expect(testHostComponent.form.contains('resourceClass')).toBe(true);

    });

    it('should initialise the resource class definitions correctly', () => {

        expect(testHostComponent.selectResourceClass.resourceClassDefinitions.length).toEqual(12);

    });

    it('should init the MatSelect and MatOptions correctly', async () => {

        const select = await loader.getHarness(MatSelectHarness);
        const initVal = await select.getValueText();

        // placeholder
        expect(initVal).toEqual('Select a Resource Class (optional)');

        await select.open();

        const options = await select.getOptions();

        expect(options.length).toEqual(13);

        const option1 = await options[0].getText();

        expect(option1).toEqual('no selection');

        const option2 = await options[1].getText();

        expect(option2).toEqual('Audio Sequence Thing');

        const option3 = await options[2].getText();

        expect(option3).toEqual('Audio Thing');

    });

    it('should emit the Iri of a selected resource class', async () => {

        expect(testHostComponent.selectedResClassIri).toBeUndefined();
        expect(testHostComponent.selectResourceClass.selectedResourceClassIri).toBe(false);

        const select = await loader.getHarness(MatSelectHarness);

        await select.open();

        const options = await select.getOptions({ text: 'Blue thing' });

        expect(options.length).toEqual(1);

        await options[0].click();

        expect(testHostComponent.selectedResClassIri).toEqual('http://0.0.0.0:3333/ontology/0001/anything/v2#BlueThing');

        expect(testHostComponent.selectResourceClass.selectedResourceClassIri).toEqual('http://0.0.0.0:3333/ontology/0001/anything/v2#BlueThing');

    });

    it('should select the option "no selection"', async () => {

        expect(testHostComponent.selectedResClassIri).toBeUndefined();
        expect(testHostComponent.selectResourceClass.selectedResourceClassIri).toBe(false);

        const select = await loader.getHarness(MatSelectHarness);

        await select.open();

        const options = await select.getOptions({ text: 'Blue thing' });

        expect(options.length).toEqual(1);

        await options[0].click();

        const options2 = await select.getOptions({ text: 'no selection' });

        expect(options2.length).toEqual(1);

        await options2[0].click();

        expect(testHostComponent.selectedResClassIri).toBeNull();

    });

    it('should update the resource class definitions when the @Input changes', async () => {

        // simulate an existing resource class selection
        testHostComponent.selectResourceClass['_selectedResourceClassIri'] = 'http://0.0.0.0:3333/ontology/0001/anything/v2#BlueThing';

        // get resource class defs
        testHostComponent.resourceClassDefs = MockOntology.mockReadOntology('http://api.knora.org/ontology/knora-api/v2').getClassDefinitionsByType(ResourceClassDefinition);

        testHostFixture.detectChanges();

        expect(testHostComponent.selectResourceClass.resourceClassDefinitions.length).toEqual(14);

        const select = await loader.getHarness(MatSelectHarness);
        const initVal = await select.getValueText();

        // placeholder
        expect(initVal).toEqual('Select a Resource Class (optional)');

        await select.open();

        const options = await select.getOptions();

        expect(options.length).toEqual(15);

        expect(testHostComponent.selectResourceClass.selectedResourceClassIri).toBe(false);

    });

    it('should unsubscribe from from changes on destruction', () => {

        expect(testHostComponent.selectResourceClass.ontologyChangesSubscription.closed).toBe(false);

        testHostFixture.destroy();

        expect(testHostComponent.selectResourceClass.ontologyChangesSubscription.closed).toBe(true);

    });

});
