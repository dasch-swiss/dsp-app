import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { UntypedFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatLegacyAutocompleteModule as MatAutocompleteModule } from '@angular/material/legacy-autocomplete';
import { MatLegacyAutocompleteHarness as MatAutocompleteHarness } from '@angular/material/legacy-autocomplete/testing';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
    ILabelSearchParams,
    ReadResource,
    ReadResourceSequence,
    SearchEndpointV2
} from '@dasch-swiss/dsp-js';
import { of } from 'rxjs';
import { DspApiConnectionToken } from 'src/app/main/declarations/dsp-api-tokens';
import { IRI } from '../operator';
import { SearchLinkValueComponent } from './search-link-value.component';


/**
 * test host component to simulate parent component.
 */
@Component({
    template: `
        <app-search-link-value #linkVal [formGroup]="form" [restrictResourceClass]="resClass"></app-search-link-value>`
})
class TestHostComponent implements OnInit {

    @ViewChild('linkVal', { static: false }) linkValue: SearchLinkValueComponent;

    form;

    resClass: string;

    constructor(@Inject(UntypedFormBuilder) private _fb: UntypedFormBuilder) {
    }

    ngOnInit() {
        this.form = this._fb.group({});
        this.resClass = 'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing';
    }
}

describe('SearchLinkValueComponent', () => {
    let testHostComponent: TestHostComponent;
    let testHostFixture: ComponentFixture<TestHostComponent>;

    let loader: HarnessLoader;

    beforeEach(waitForAsync(() => {

        const searchSpyObj = {
            v2: {
                search: jasmine.createSpyObj('search', ['doSearchByLabel']),
            }
        };

        TestBed.configureTestingModule({
            imports: [
                BrowserAnimationsModule,
                ReactiveFormsModule,
                MatAutocompleteModule,
                MatInputModule
            ],
            declarations: [
                SearchLinkValueComponent,
                TestHostComponent
            ],
            providers: [
                {
                    provide: DspApiConnectionToken,
                    useValue: searchSpyObj
                }
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
        expect(testHostComponent.linkValue).toBeTruthy();
    });

    it('should have the correct resource class restriction', () => {
        // access the test host component's child
        expect(testHostComponent.linkValue).toBeTruthy();

        expect(testHostComponent.linkValue.restrictResourceClass).toEqual('http://0.0.0.0:3333/ontology/0001/anything/v2#Thing');
    });

    it('should search for resources by their label', async () => {

        const searchSpy = TestBed.inject(DspApiConnectionToken);

        (searchSpy.v2.search as jasmine.SpyObj<SearchEndpointV2>).doSearchByLabel.and.callFake(
            (searchTerm: string, offset?: number, params?: ILabelSearchParams) => {

                const res = new ReadResource();
                res.id = 'http://testIri';
                res.label = 'testres';

                const response = new ReadResourceSequence([res]);

                return of(response);
            }
        );

        const autoCompleteHarness = await loader.getHarness(MatAutocompleteHarness);

        await autoCompleteHarness.enterText('testres');

        const options = await autoCompleteHarness.getOptions();

        expect(options.length).toEqual(1);
        expect(await options[0].getText()).toEqual('testres');

        expect(testHostComponent.linkValue.resources.length).toEqual(1);
        expect(testHostComponent.linkValue.resources[0].id).toEqual('http://testIri');

        expect(testHostComponent.linkValue.form.valid).toBe(false);

        await options[0].click();

        expect(testHostComponent.linkValue.form.valid).toBe(true);
        expect(testHostComponent.linkValue.form.controls['resource'].value.id).toEqual('http://testIri');

        expect(searchSpy.v2.search.doSearchByLabel).toHaveBeenCalledTimes(1); // only sends one request due to debouncing
        expect(searchSpy.v2.search.doSearchByLabel).toHaveBeenCalledWith('testres', 0, { limitToResourceClass: 'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing' });

    });

    it('should return a selected resource', () => {

        const res = new ReadResource();
        res.id = 'http://testIri';

        testHostComponent.linkValue.form.controls['resource'].setValue(res);

        testHostFixture.detectChanges();

        expect(testHostComponent.linkValue.getValue()).toEqual(new IRI('http://testIri'));
    });

});
