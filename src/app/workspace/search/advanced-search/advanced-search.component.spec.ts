import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { UntypedFormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacySnackBarModule as MatSnackBarModule } from '@angular/material/legacy-snack-bar';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { OntologiesEndpointV2, OntologiesMetadata, OntologyMetadata } from '@dasch-swiss/dsp-js';
import { of } from 'rxjs';
import { DspApiConnectionToken } from 'src/app/main/declarations/dsp-api-tokens';
import { AdvancedSearchComponent } from './advanced-search.component';

/**
 * test component to simulate select ontology component.
 */
@Component({
    selector: 'app-search-select-ontology',
    template: ''
})
class TestSearchSelectOntologyComponent implements OnInit {

    @Input() formGroup: UntypedFormGroup;

    @Input() ontologiesMetadata: OntologiesMetadata;

    @Output() ontologySelected = new EventEmitter<string>();

    ngOnInit() {

    }

}

/**
 * test component to simulate select resource class and property component.
 */
@Component({
    selector: 'app-resource-and-property-selection',
    template: ''
})
class TestSelectResourceClassAndPropertyComponent {

    @Input() formGroup: UntypedFormGroup;

    @Input() activeOntology: string;

    @Input() resClassRestriction?: string;

    @Input() topLevel: boolean;

}

/**
 * test host component to simulate parent component.
 */
@Component({
    template: `
        <app-advanced-search #advSearch></app-advanced-search>`
})
class TestHostComponent implements OnInit {

    @ViewChild('advSearch') advancedSearch: AdvancedSearchComponent;

    ngOnInit() {
    }

}

describe('AdvancedSearchComponent', () => {
    let testHostComponent: TestHostComponent;
    let testHostFixture: ComponentFixture<TestHostComponent>;

    let loader: HarnessLoader;

    beforeEach(waitForAsync(() => {

        const dspConnSpy = {
            v2: {
                onto: jasmine.createSpyObj('onto', ['getOntologiesMetadata'])
            }
        };

        TestBed.configureTestingModule({
            declarations: [
                AdvancedSearchComponent,
                TestHostComponent,
                TestSearchSelectOntologyComponent,
                TestSelectResourceClassAndPropertyComponent
            ],
            imports: [
                ReactiveFormsModule,
                BrowserAnimationsModule,
                MatDialogModule,
                MatIconModule,
                MatSnackBarModule
            ],
            providers: [
                {
                    provide: DspApiConnectionToken,
                    useValue: dspConnSpy
                }
            ]
        })
            .compileComponents();
    }));

    describe('Ontology with resources', () => {
        beforeEach(() => {

            const dspConnSpy = TestBed.inject(DspApiConnectionToken);

            (dspConnSpy.v2.onto as jasmine.SpyObj<OntologiesEndpointV2>).getOntologiesMetadata.and.callFake(
                () => {

                    const ontoMetadata = new OntologiesMetadata();

                    const anythingOnto = new OntologyMetadata();
                    anythingOnto.id = 'anyid';
                    anythingOnto.label = 'anythingOnto';

                    ontoMetadata.ontologies = [anythingOnto];

                    return of(ontoMetadata);
                }
            );

            testHostFixture = TestBed.createComponent(TestHostComponent);
            testHostComponent = testHostFixture.componentInstance;

            loader = TestbedHarnessEnvironment.loader(testHostFixture);

            testHostFixture.detectChanges();
        });

        it('should create', () => {

            expect(testHostComponent).toBeTruthy();
            expect(testHostComponent.advancedSearch).toBeTruthy();

        });

        it('should get ontologies metadata on init', () => {

            const dspConnSpy = TestBed.inject(DspApiConnectionToken);

            expect(testHostComponent.advancedSearch.ontologiesMetadata).toBeDefined();
            expect(testHostComponent.advancedSearch.ontologiesMetadata.ontologies.length).toEqual(1);

            const hostCompDe = testHostFixture.debugElement;
            const selectOntoComp = hostCompDe.query(By.directive(TestSearchSelectOntologyComponent));

            expect((selectOntoComp.componentInstance as TestSearchSelectOntologyComponent).ontologiesMetadata).toBeDefined();
            expect((selectOntoComp.componentInstance as TestSearchSelectOntologyComponent).ontologiesMetadata.ontologies.length).toEqual(1);

            expect(dspConnSpy.v2.onto.getOntologiesMetadata).toHaveBeenCalledTimes(1);

            expect((selectOntoComp.componentInstance as TestSearchSelectOntologyComponent).formGroup).toBeDefined();

        });

        it('should set the active ontology when an ontology is selected',  () => {

            const hostCompDe = testHostFixture.debugElement;
            const selectOntoComp = hostCompDe.query(By.directive(TestSearchSelectOntologyComponent));

            (selectOntoComp.componentInstance as TestSearchSelectOntologyComponent).ontologySelected.emit('http://0.0.0.0:3333/ontology/0001/anything/v2');

            testHostFixture.detectChanges();

            expect(testHostComponent.advancedSearch.activeOntology).toEqual('http://0.0.0.0:3333/ontology/0001/anything/v2');

            expect(testHostComponent.advancedSearch.resourceAndPropertySelection.activeOntology).toEqual('http://0.0.0.0:3333/ontology/0001/anything/v2');

        });

    });

});
