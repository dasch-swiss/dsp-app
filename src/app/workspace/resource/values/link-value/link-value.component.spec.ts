import { Component, DebugElement, OnInit, ViewChild } from '@angular/core';
import { waitForAsync, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
    CreateLinkValue,
    MockOntology,
    MockResource,
    ReadLinkValue,
    ReadOntology,
    ReadResource,
    ReadResourceSequence,
    SearchEndpointV2,
    UpdateLinkValue
} from '@dasch-swiss/dsp-js';
import { OntologyCache } from '@dasch-swiss/dsp-js/src/cache/ontology-cache/OntologyCache';
import { of } from 'rxjs';
import { DspApiConnectionToken } from 'src/app/main/declarations/dsp-api-tokens';
import { LinkValueComponent } from './link-value.component';

/**
 * test host component to simulate parent component.
 */
@Component({
    template: `
    <app-link-value #inputVal [displayValue]="displayInputVal" [mode]="mode" [parentResource]="parentResource"
                    [propIri]="propIri" [currentOntoIri]="currentOntoIri" (referredResourceClicked)="refResClicked($event)" (referredResourceHovered)="refResHovered($event)"></app-link-value>`
})
class TestHostDisplayValueComponent implements OnInit {

    @ViewChild('inputVal') inputValueComponent: LinkValueComponent;

    displayInputVal: ReadLinkValue;
    parentResource: ReadResource;
    propIri: string;
    currentOntoIri: string;
    mode: 'read' | 'update' | 'create' | 'search';
    linkValueClicked: ReadLinkValue;
    linkValueHovered: ReadLinkValue;

    ngOnInit() {

        MockResource.getTestThing().subscribe(res => {
            const inputVal: ReadLinkValue =
                res.getValuesAs('http://0.0.0.0:3333/ontology/0001/anything/v2#hasOtherThingValue', ReadLinkValue)[0];

            this.displayInputVal = inputVal;
            this.propIri = this.displayInputVal.property;
            this.parentResource = res;
            this.mode = 'read';
            this.currentOntoIri = 'http://0.0.0.0:3333/ontology/0001/anything/v2';
        });

    }

    refResClicked(readLinkValue: ReadLinkValue) {
        this.linkValueClicked = readLinkValue;
    }

    refResHovered(readLinkValue: ReadLinkValue) {
        this.linkValueHovered = readLinkValue;
    }
}

/**
 * test host component to simulate parent component.
 */
@Component({
    template: `
    <app-link-value #inputVal [mode]="mode" [parentResource]="parentResource" [propIri]="propIri" [currentOntoIri]="currentOntoIri"></app-link-value>`
})
class TestHostCreateValueComponent implements OnInit {

    @ViewChild('inputVal') inputValueComponent: LinkValueComponent;
    parentResource: ReadResource;
    propIri: string;
    currentOntoIri: string;
    mode: 'read' | 'update' | 'create' | 'search';

    ngOnInit() {

        MockResource.getTestThing().subscribe(res => {
            this.propIri = 'http://0.0.0.0:3333/ontology/0001/anything/v2#hasOtherThingValue';
            this.currentOntoIri = 'http://0.0.0.0:3333/ontology/0001/anything/v2';
            this.parentResource = res;
            this.mode = 'create';
        });
    }
}

/**
 * test host component to simulate parent component.
 */
@Component({
    template: `
    <app-link-value #inputVal [mode]="mode" [parentResource]="parentResource" [propIri]="propIri" [currentOntoIri]="currentOntoIri" [valueRequiredValidator]="false"></app-link-value>`
})
class TestHostCreateValueNoValueRequiredComponent implements OnInit {

    @ViewChild('inputVal') inputValueComponent: LinkValueComponent;
    parentResource: ReadResource;
    propIri: string;
    currentOntoIri: string;
    mode: 'read' | 'update' | 'create' | 'search';

    ngOnInit() {
        MockResource.getTestThing().subscribe(res => {
            this.propIri = 'http://0.0.0.0:3333/ontology/0001/anything/v2#hasOtherThingValue';
            this.currentOntoIri = 'http://0.0.0.0:3333/ontology/0001/anything/v2';
            this.parentResource = res;
            this.mode = 'create';
        });
    }
}

describe('LinkValueComponent', () => {

    beforeEach(waitForAsync(() => {
        const valuesSpyObj = {
            v2: {
                ontologyCache: jasmine.createSpyObj('ontologyCache', ['getOntology', 'getResourceClassDefinition']),
                search: jasmine.createSpyObj('search', ['doSearchByLabel']),
            }
        };
        TestBed.configureTestingModule({
            declarations: [
                LinkValueComponent,
                TestHostDisplayValueComponent,
                TestHostCreateValueComponent,
                TestHostCreateValueNoValueRequiredComponent
            ],
            imports: [
                ReactiveFormsModule,
                MatInputModule,
                MatAutocompleteModule,
                MatDialogModule,
                BrowserAnimationsModule
            ],
            providers: [
                {
                    provide: DspApiConnectionToken,
                    useValue: valuesSpyObj
                }
            ]
        })
            .compileComponents();
    }));

    describe('display and edit a link value', () => {
        let testHostComponent: TestHostDisplayValueComponent;
        let testHostFixture: ComponentFixture<TestHostDisplayValueComponent>;
        let valueComponentDe: DebugElement;
        let valueInputDebugElement: DebugElement;
        let valueInputNativeElement;
        let valueReadModeDebugElement: DebugElement;
        let valueReadModeNativeElement;

        beforeEach(() => {

            const dspConnSpy = TestBed.inject(DspApiConnectionToken);

            (dspConnSpy.v2.ontologyCache as jasmine.SpyObj<OntologyCache>).getOntology.and.callFake(
                (ontoIri: string) => {

                    const anythingOnto = MockOntology.mockReadOntology('http://0.0.0.0:3333/ontology/0001/anything/v2');
                    const knoraApiOnto = MockOntology.mockReadOntology('http://api.knora.org/ontology/knora-api/v2');

                    const ontoMap: Map<string, ReadOntology> = new Map();

                    ontoMap.set('http://api.knora.org/ontology/knora-api/v2', knoraApiOnto);
                    ontoMap.set('http://0.0.0.0:3333/ontology/0001/anything/v2', anythingOnto);

                    return of(ontoMap);
                }
            );

            (dspConnSpy.v2.ontologyCache as jasmine.SpyObj<OntologyCache>).getResourceClassDefinition.and.callFake(
                (resClassIri: string) => of(MockOntology.mockIResourceClassAndPropertyDefinitions('http://0.0.0.0:3333/ontology/0001/anything/v2#Thing'))
            );

            testHostFixture = TestBed.createComponent(TestHostDisplayValueComponent);
            testHostComponent = testHostFixture.componentInstance;
            testHostFixture.detectChanges();

            expect(testHostComponent).toBeTruthy();
            expect(testHostComponent.inputValueComponent).toBeTruthy();

            const hostCompDe = testHostFixture.debugElement;

            valueComponentDe = hostCompDe.query(By.directive(LinkValueComponent));
            valueReadModeDebugElement = valueComponentDe.query(By.css('.rm-value'));
            valueReadModeNativeElement = valueReadModeDebugElement.nativeElement;

        });

        it('should display an existing value', fakeAsync(() => {

            expect(testHostComponent.inputValueComponent.displayValue.linkedResourceIri).toEqual('http://rdfh.ch/0001/0C-0L1kORryKzJAJxxRyRQ');
            expect(testHostComponent.inputValueComponent.displayValue.linkedResource.label).toEqual('Sierra');

            expect(testHostComponent.inputValueComponent.form.valid).toBeTruthy();

            expect(testHostComponent.inputValueComponent.mode).toEqual('read');

            expect(testHostComponent.inputValueComponent.valueFormControl.value instanceof ReadResource).toBe(true);
            expect(testHostComponent.inputValueComponent.valueFormControl.value.label).toEqual('Sierra');

            // setValue has to be called, otherwise the native input field does not get the label via the displayWith function
            const res = testHostComponent.inputValueComponent.valueFormControl.value;
            testHostComponent.inputValueComponent.valueFormControl.setValue(res);

            // https://github.com/angular/components/blob/29e74eb9431ba01d951ee33df554f465609b59fa/src/material/autocomplete/autocomplete.spec.ts#L2577-L2580
            testHostFixture.detectChanges();
            tick();
            testHostFixture.detectChanges();

            expect(valueReadModeNativeElement.innerText).toEqual('Sierra');

            const anchorDebugElement = valueReadModeDebugElement.query(By.css('a'));
            expect(anchorDebugElement.nativeElement).toBeDefined();

        }));

        it('should make a link value editable', fakeAsync(() => {

            testHostComponent.mode = 'update';
            testHostFixture.detectChanges();
            valueInputDebugElement = valueComponentDe.query(By.css('input.value'));
            valueInputNativeElement = valueInputDebugElement.nativeElement;

            expect(testHostComponent.inputValueComponent.mode).toEqual('update');
            expect(testHostComponent.inputValueComponent.form.valid).toBeFalsy();

            const update = new ReadResource();
            update.id = 'newId';
            update.label = 'new target';

            testHostComponent.inputValueComponent.valueFormControl.setValue(update);

            // https://github.com/angular/components/blob/29e74eb9431ba01d951ee33df554f465609b59fa/src/material/autocomplete/autocomplete.spec.ts#L2577-L2580
            testHostFixture.detectChanges();
            tick();
            testHostFixture.detectChanges();

            expect(valueInputNativeElement.value).toEqual('new target');

            expect(testHostComponent.inputValueComponent.form.valid).toBeTruthy();

            const updatedValue = testHostComponent.inputValueComponent.getUpdatedValue();

            expect(updatedValue instanceof UpdateLinkValue).toBeTruthy();

            expect((updatedValue as UpdateLinkValue).linkedResourceIri).toEqual('newId');

        }));

        it('should compare the existing version of a link to the user input', () => {

            // sierra, http://rdfh.ch/0001/0C-0L1kORryKzJAJxxRyRQ
            const initValue: ReadResource = testHostComponent.inputValueComponent.getInitValue();

            const readRes1 = new ReadResource();
            readRes1.id = 'http://rdfh.ch/0001/0C-0L1kORryKzJAJxxRyRQ';
            readRes1.label = 'Sierra';

            expect(
                testHostComponent.inputValueComponent.standardValueComparisonFunc(
                    initValue, readRes1
                )
            ).toBeTruthy();

            const readRes2 = new ReadResource();
            readRes2.id = 'newId';
            readRes2.label = 'new target';

            expect(
                testHostComponent.inputValueComponent.standardValueComparisonFunc(
                    initValue, readRes2
                )
            ).toBeFalsy();

            expect(
                testHostComponent.inputValueComponent.standardValueComparisonFunc(
                    initValue, null
                )
            ).toBeFalsy();

            expect(
                testHostComponent.inputValueComponent.standardValueComparisonFunc(
                    initValue, 'searchlabel'
                )
            ).toBeFalsy();

        });

        it('should search for resources by their label', () => {

            const valuesSpy = TestBed.inject(DspApiConnectionToken);
            (valuesSpy.v2.search as jasmine.SpyObj<SearchEndpointV2>).doSearchByLabel.and.callFake(
                () => {
                    const res = new ReadResource();
                    res.id = 'http://rdfh.ch/0001/IwMDbs0KQsaxSRUTl2cAIQ';
                    res.label = 'hidden thing';
                    return of(new ReadResourceSequence([res]));
                }
            );

            // simulate user searching for label 'thing'
            testHostComponent.inputValueComponent.valueFormControl.setValue('thing');

            expect(valuesSpy.v2.search.doSearchByLabel).toHaveBeenCalledWith('thing', 0, { limitToResourceClass: 'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing' });
            expect(testHostComponent.inputValueComponent.resources.length).toEqual(1);
            expect(testHostComponent.inputValueComponent.resources[0].id).toEqual('http://rdfh.ch/0001/IwMDbs0KQsaxSRUTl2cAIQ');
        });

        it('should not return an invalid update value (string)', () => {

            const valuesSpy = TestBed.inject(DspApiConnectionToken);

            (valuesSpy.v2.search as jasmine.SpyObj<SearchEndpointV2>).doSearchByLabel.and.callFake(
                () => {
                    const res = new ReadResource();
                    res.id = 'http://rdfh.ch/0001/IwMDbs0KQsaxSRUTl2cAIQ';
                    res.label = 'hidden thing';
                    return of(new ReadResourceSequence([res]));
                }
            );

            testHostComponent.mode = 'update';
            testHostFixture.detectChanges();
            valueInputDebugElement = valueComponentDe.query(By.css('input.value'));
            valueInputNativeElement = valueInputDebugElement.nativeElement;

            expect(testHostComponent.inputValueComponent.mode).toEqual('update');
            expect(testHostComponent.inputValueComponent.form.valid).toBeFalsy();

            testHostComponent.inputValueComponent.valueFormControl.setValue('my string');

            expect(testHostComponent.inputValueComponent.form.valid).toBeFalsy();

            const updatedValue = testHostComponent.inputValueComponent.getUpdatedValue();

            expect(updatedValue).toBeFalsy();

        });

        it('should not return an invalid update value (no value)', () => {

            const valuesSpy = TestBed.inject(DspApiConnectionToken);

            (valuesSpy.v2.search as jasmine.SpyObj<SearchEndpointV2>).doSearchByLabel.and.callFake(
                () => {
                    const res = new ReadResource();
                    res.id = 'http://rdfh.ch/0001/IwMDbs0KQsaxSRUTl2cAIQ';
                    res.label = 'hidden thing';
                    return of(new ReadResourceSequence([res]));
                }
            );

            testHostComponent.mode = 'update';
            testHostFixture.detectChanges();
            valueInputDebugElement = valueComponentDe.query(By.css('input.value'));
            valueInputNativeElement = valueInputDebugElement.nativeElement;

            expect(testHostComponent.inputValueComponent.mode).toEqual('update');
            expect(testHostComponent.inputValueComponent.form.valid).toBeFalsy();

            testHostComponent.inputValueComponent.valueFormControl.setValue(null);

            expect(testHostComponent.inputValueComponent.form.valid).toBeFalsy();

            const updatedValue = testHostComponent.inputValueComponent.getUpdatedValue();

            expect(updatedValue).toBeFalsy();

        });

        it('should validate an existing value', () => {

            testHostComponent.mode = 'update';
            testHostFixture.detectChanges();
            valueInputDebugElement = valueComponentDe.query(By.css('input.value'));
            valueInputNativeElement = valueInputDebugElement.nativeElement;

            expect(testHostComponent.inputValueComponent.mode).toEqual('update');
            expect(testHostComponent.inputValueComponent.form.valid).toBeFalsy(); // because no value nor the comment changed

            // set a comment value
            testHostComponent.inputValueComponent.commentFormControl.setValue('a comment');

            testHostFixture.detectChanges();

            expect(testHostComponent.inputValueComponent.form.valid).toBeTruthy(); // now the form must be valid, hence the comment changed
            const updatedValue = testHostComponent.inputValueComponent.getUpdatedValue();
            expect(updatedValue instanceof UpdateLinkValue).toBeTruthy();

        });

        it('should restore the initially displayed value', fakeAsync(() => {

            testHostComponent.mode = 'update';

            testHostFixture.detectChanges();

            valueInputDebugElement = valueComponentDe.query(By.css('input.value'));
            valueInputNativeElement = valueInputDebugElement.nativeElement;

            expect(testHostComponent.inputValueComponent.mode).toEqual('update');

            expect(testHostComponent.inputValueComponent.form.valid).toBeFalsy();

            // simulate user input
            const update = new ReadResource();
            update.id = 'newId';
            update.label = 'new target';

            testHostComponent.inputValueComponent.valueFormControl.setValue(update);

            // https://github.com/angular/components/blob/29e74eb9431ba01d951ee33df554f465609b59fa/src/material/autocomplete/autocomplete.spec.ts#L2577-L2580
            testHostFixture.detectChanges();
            tick();
            testHostFixture.detectChanges();

            expect(valueInputNativeElement.value).toEqual('new target');

            expect(testHostComponent.inputValueComponent.form.valid).toBeTruthy();

            testHostComponent.inputValueComponent.resetFormControl();

            testHostFixture.detectChanges();
            tick();
            testHostFixture.detectChanges();

            expect(valueInputNativeElement.value).toEqual('Sierra');

            expect(testHostComponent.inputValueComponent.form.valid).toBeFalsy();

        }));

        it('should set a new display value', fakeAsync(() => {

            // setValue has to be called, otherwise the native input field does not get the label via the displayWith function
            const res = testHostComponent.inputValueComponent.valueFormControl.value;
            testHostComponent.inputValueComponent.valueFormControl.setValue(res);

            // https://github.com/angular/components/blob/29e74eb9431ba01d951ee33df554f465609b59fa/src/material/autocomplete/autocomplete.spec.ts#L2577-L2580
            testHostFixture.detectChanges();
            tick();
            testHostFixture.detectChanges();

            expect(testHostComponent.inputValueComponent.valueFormControl.value.label).toEqual('Sierra');

            const linkedRes = new ReadResource();
            linkedRes.id = 'newId';
            linkedRes.label = 'new target';

            const newLink = new ReadLinkValue();
            newLink.id = 'updatedId';
            newLink.linkedResourceIri = 'newId';
            newLink.linkedResource = linkedRes;

            testHostComponent.displayInputVal = newLink;

            testHostFixture.detectChanges();
            tick();
            testHostFixture.detectChanges();

            expect(valueReadModeNativeElement.innerText).toEqual('new target');

        }));

        it('should emit the displayValue when the value is clicked on', () => {

            expect(testHostComponent.linkValueClicked).toBeUndefined();

            valueReadModeNativeElement.click();

            expect(testHostComponent.linkValueClicked).toEqual(testHostComponent.displayInputVal);
        });

        it('should emit the displayValue when the value is hovered', () => {

            expect(testHostComponent.linkValueHovered).toBeUndefined();

            valueReadModeNativeElement.dispatchEvent(
                new MouseEvent('mouseover', {
                    view: window,
                    bubbles: true,
                    cancelable: true
                })
            );

            expect(testHostComponent.linkValueHovered).toEqual(testHostComponent.displayInputVal);
        });

    });

    describe('create a new link value', () => {
        let testHostComponent: TestHostCreateValueComponent;
        let testHostFixture: ComponentFixture<TestHostCreateValueComponent>;

        let valueComponentDe: DebugElement;

        let valueInputDebugElement: DebugElement;
        let valueInputNativeElement;

        beforeEach(() => {

            const dspConnSpy = TestBed.inject(DspApiConnectionToken);

            (dspConnSpy.v2.ontologyCache as jasmine.SpyObj<OntologyCache>).getOntology.and.callFake(
                (ontoIri: string) => {

                    const anythingOnto = MockOntology.mockReadOntology('http://0.0.0.0:3333/ontology/0001/anything/v2');
                    const knoraApiOnto = MockOntology.mockReadOntology('http://api.knora.org/ontology/knora-api/v2');

                    const ontoMap: Map<string, ReadOntology> = new Map();

                    ontoMap.set('http://api.knora.org/ontology/knora-api/v2', knoraApiOnto);
                    ontoMap.set('http://0.0.0.0:3333/ontology/0001/anything/v2', anythingOnto);

                    return of(ontoMap);
                }
            );

            (dspConnSpy.v2.ontologyCache as jasmine.SpyObj<OntologyCache>).getResourceClassDefinition.and.callFake(
                (resClassIri: string) => of(MockOntology.mockIResourceClassAndPropertyDefinitions('http://0.0.0.0:3333/ontology/0001/anything/v2#Thing'))
            );

            testHostFixture = TestBed.createComponent(TestHostCreateValueComponent);
            testHostComponent = testHostFixture.componentInstance;
            testHostFixture.detectChanges();

            expect(testHostComponent).toBeTruthy();
            expect(testHostComponent.inputValueComponent).toBeTruthy();

            const hostCompDe = testHostFixture.debugElement;

            valueComponentDe = hostCompDe.query(By.directive(LinkValueComponent));

            valueInputDebugElement = valueComponentDe.query(By.css('input.value'));
            valueInputNativeElement = valueInputDebugElement.nativeElement;

        });

        it('should search a new value', () => {
            const valuesSpy = TestBed.inject(DspApiConnectionToken);

            (valuesSpy.v2.search as jasmine.SpyObj<SearchEndpointV2>).doSearchByLabel.and.callFake(
                () => {
                    const res = new ReadResource();
                    res.id = 'http://rdfh.ch/0001/IwMDbs0KQsaxSRUTl2cAIQ';
                    res.label = 'hidden thing';
                    return of(new ReadResourceSequence([res]));
                }
            );

            testHostComponent.inputValueComponent.searchByLabel('thing');
            testHostFixture.detectChanges();

            expect(testHostComponent.inputValueComponent.mode).toEqual('create');
            expect(valuesSpy.v2.search.doSearchByLabel).toHaveBeenCalledWith('thing', 0, { limitToResourceClass: 'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing' });
            expect(testHostComponent.inputValueComponent.resources.length).toEqual(1);
        });

        it('should create a value', () => {

            // simulate user input
            const res = new ReadResource();
            res.id = 'http://rdfh.ch/0001/IwMDbs0KQsaxSRUTl2cAIQ';
            res.label = 'hidden thing';

            expect(testHostComponent.inputValueComponent.form.valid).toBeFalsy();

            testHostComponent.inputValueComponent.valueFormControl.setValue(res);

            expect(testHostComponent.inputValueComponent.form.valid).toBeTruthy();

            expect(testHostComponent.inputValueComponent.valueFormControl.value instanceof ReadResource).toBeTruthy();

            const newValue = testHostComponent.inputValueComponent.getNewValue();
            expect(newValue instanceof CreateLinkValue).toBeTruthy();
            expect((newValue as CreateLinkValue).linkedResourceIri).toEqual('http://rdfh.ch/0001/IwMDbs0KQsaxSRUTl2cAIQ');
        });

        it('should only create a new value if input is a resource', () => {
            // simulate user input
            const valuesSpy = TestBed.inject(DspApiConnectionToken);

            (valuesSpy.v2.search as jasmine.SpyObj<SearchEndpointV2>).doSearchByLabel.and.callFake(
                () => {
                    const res = new ReadResource();
                    res.id = 'http://rdfh.ch/0001/IwMDbs0KQsaxSRUTl2cAIQ';
                    res.label = 'hidden thing';
                    return of(new ReadResourceSequence([res]));
                }
            );
            expect(testHostComponent.inputValueComponent.form.valid).toBeFalsy();

            const label = 'thing';
            testHostComponent.inputValueComponent.valueFormControl.setValue(label);

            expect(testHostComponent.inputValueComponent.valueFormControl.value instanceof ReadResource).toBeFalsy();
            expect(testHostComponent.inputValueComponent.form.valid).toBeFalsy();

            const newValue = testHostComponent.inputValueComponent.getNewValue();

            expect(newValue instanceof CreateLinkValue).toBeFalsy();
        });

        it('should reset form after cancellation', fakeAsync(() => {

            // simulate user input
            const res = new ReadResource();
            res.id = 'http://rdfh.ch/0001/IwMDbs0KQsaxSRUTl2cAIQ';
            res.label = 'hidden thing';
            testHostComponent.inputValueComponent.valueFormControl.setValue(res);

            // https://github.com/angular/components/blob/29e74eb9431ba01d951ee33df554f465609b59fa/src/material/autocomplete/autocomplete.spec.ts#L2577-L2580
            testHostFixture.detectChanges();
            tick();
            testHostFixture.detectChanges();

            expect(valueInputNativeElement.value).toEqual('hidden thing');

            testHostFixture.detectChanges();

            expect(testHostComponent.inputValueComponent.mode).toEqual('create');

            expect(testHostComponent.inputValueComponent.form.valid).toBeTruthy();

            testHostComponent.inputValueComponent.resetFormControl();

            testHostFixture.detectChanges();
            tick();
            testHostFixture.detectChanges();

            expect(testHostComponent.inputValueComponent.form.valid).toBeFalsy();

            expect(testHostComponent.inputValueComponent.valueFormControl.value).toEqual(null);

            expect(valueInputNativeElement.value).toEqual('');

        }));
    });

    describe('create a new link value no value required', () => {
        let testHostComponent: TestHostCreateValueNoValueRequiredComponent;
        let testHostFixture: ComponentFixture<TestHostCreateValueNoValueRequiredComponent>;

        beforeEach(() => {

            const dspConnSpy = TestBed.inject(DspApiConnectionToken);

            (dspConnSpy.v2.ontologyCache as jasmine.SpyObj<OntologyCache>).getOntology.and.callFake(
                (ontoIri: string) => {

                    const anythingOnto = MockOntology.mockReadOntology('http://0.0.0.0:3333/ontology/0001/anything/v2');
                    const knoraApiOnto = MockOntology.mockReadOntology('http://api.knora.org/ontology/knora-api/v2');

                    const ontoMap: Map<string, ReadOntology> = new Map();

                    ontoMap.set('http://api.knora.org/ontology/knora-api/v2', knoraApiOnto);
                    ontoMap.set('http://0.0.0.0:3333/ontology/0001/anything/v2', anythingOnto);

                    return of(ontoMap);
                }
            );

            (dspConnSpy.v2.ontologyCache as jasmine.SpyObj<OntologyCache>).getResourceClassDefinition.and.callFake(
                (resClassIri: string) => of(MockOntology.mockIResourceClassAndPropertyDefinitions('http://0.0.0.0:3333/ontology/0001/anything/v2#Thing'))
            );

            testHostFixture = TestBed.createComponent(TestHostCreateValueNoValueRequiredComponent);
            testHostComponent = testHostFixture.componentInstance;
            testHostFixture.detectChanges();

            expect(testHostComponent).toBeTruthy();
        });

        it('should create a value', () => {

            // simulate user input
            const res = new ReadResource();
            res.id = 'http://rdfh.ch/0001/IwMDbs0KQsaxSRUTl2cAIQ';
            res.label = 'hidden thing';

            expect(testHostComponent.inputValueComponent.form.valid).toBeTruthy();

            testHostComponent.inputValueComponent.valueFormControl.setValue(res);

            expect(testHostComponent.inputValueComponent.form.valid).toBeTruthy();

            expect(testHostComponent.inputValueComponent.valueFormControl.value instanceof ReadResource).toBeTruthy();

            const newValue = testHostComponent.inputValueComponent.getNewValue();
            expect(newValue instanceof CreateLinkValue).toBeTruthy();
            expect((newValue as CreateLinkValue).linkedResourceIri).toEqual('http://rdfh.ch/0001/IwMDbs0KQsaxSRUTl2cAIQ');
        });
    });
});
