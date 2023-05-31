import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
    Component,
    EventEmitter,
    Inject,
    Input,
    OnInit,
    Output,
    ViewChild,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
    UntypedFormBuilder,
    UntypedFormGroup,
    ReactiveFormsModule,
} from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacySnackBarModule as MatSnackBarModule } from '@angular/material/legacy-snack-bar';
import { By } from '@angular/platform-browser';
import {
    MockOntology,
    ReadOntology,
    ResourceClassDefinition,
    ResourcePropertyDefinition,
} from '@dasch-swiss/dsp-js';
import { OntologyCache } from '@dasch-swiss/dsp-js/src/cache/ontology-cache/OntologyCache';
import { of } from 'rxjs';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { ResourceAndPropertySelectionComponent } from './resource-and-property-selection.component';

/**
 * test host component to simulate select resource class component.
 */
@Component({
    selector:
        '<app-search-select-resource-class></app-search-select-resource-class>',
    template: '',
})
class TestSearchSelectResourceClassComponent {
    @Input() formGroup: UntypedFormGroup;

    @Input() resourceClassDefinitions: ResourceClassDefinition[];

    @Output() resourceClassSelected = new EventEmitter<string | null>();
}

/**
 * test host component to simulate select property component.
 */
@Component({
    selector: '<app-search-select-property></app-search-select-property>',
    template: '',
})
class TestSearchSelectPropertyComponent {
    // parent FormGroup
    @Input() formGroup: UntypedFormGroup;

    // index of the given property (unique)
    @Input() index: number;

    // properties that can be selected from
    @Input() properties: ResourcePropertyDefinition[];

    @Input() activeResourceClass: ResourceClassDefinition;

    @Input() topLevel: boolean;
}

/**
 * test host component to simulate parent component.
 */
@Component({
    template: ` <app-resource-and-property-selection
        #resClassAndProp
        [formGroup]="form"
        [activeOntology]="'http://0.0.0.0:3333/ontology/0001/anything/v2'"
        [resourceClassRestriction]="restrictByResourceClass"
    >
    </app-resource-and-property-selection>`,
})
class TestHostComponent implements OnInit {
    @ViewChild('resClassAndProp')
    resourceClassAndPropertySelection: ResourceAndPropertySelectionComponent;

    form: UntypedFormGroup;

    activeOntology = 'http://0.0.0.0:3333/ontology/0001/anything/v2';

    restrictByResourceClass?: string;

    constructor(@Inject(UntypedFormBuilder) private _fb: UntypedFormBuilder) {}

    ngOnInit() {
        this.form = this._fb.group({});
    }
}

describe('ResourceAndPropertySelectionComponent', () => {
    let testHostComponent: TestHostComponent;
    let testHostFixture: ComponentFixture<TestHostComponent>;

    let loader: HarnessLoader;

    beforeEach(async () => {
        const dspConnSpy = {
            v2: {
                ontologyCache: jasmine.createSpyObj('ontologyCache', [
                    'getOntology',
                    'getResourceClassDefinition',
                ]),
            },
        };

        await TestBed.configureTestingModule({
            imports: [
                ReactiveFormsModule,
                MatDialogModule,
                MatIconModule,
                MatSnackBarModule,
            ],
            declarations: [
                ResourceAndPropertySelectionComponent,
                TestHostComponent,
                TestSearchSelectResourceClassComponent,
                TestSearchSelectPropertyComponent,
            ],
            providers: [
                {
                    provide: DspApiConnectionToken,
                    useValue: dspConnSpy,
                },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        const dspConnSpy = TestBed.inject(DspApiConnectionToken);

        (
            dspConnSpy.v2.ontologyCache as jasmine.SpyObj<OntologyCache>
        ).getOntology.and.callFake(() => {
            const anythingOnto = MockOntology.mockReadOntology(
                'http://0.0.0.0:3333/ontology/0001/anything/v2'
            );
            const knoraApiOnto = MockOntology.mockReadOntology(
                'http://api.knora.org/ontology/knora-api/v2'
            );

            const ontoMap: Map<string, ReadOntology> = new Map();

            ontoMap.set(
                'http://api.knora.org/ontology/knora-api/v2',
                knoraApiOnto
            );
            ontoMap.set(
                'http://0.0.0.0:3333/ontology/0001/anything/v2',
                anythingOnto
            );

            return of(ontoMap);
        });

        testHostFixture = TestBed.createComponent(TestHostComponent);
        testHostComponent = testHostFixture.componentInstance;

        loader = TestbedHarnessEnvironment.loader(testHostFixture);

        testHostFixture.detectChanges();
    });

    it('should create', () => {
        expect(testHostComponent).toBeTruthy();
    });

    it('should request the active ontology', () => {
        const dspConnSpy = TestBed.inject(DspApiConnectionToken);

        const hostCompDe = testHostFixture.debugElement;

        expect(
            testHostComponent.resourceClassAndPropertySelection.activeOntology
        ).toEqual('http://0.0.0.0:3333/ontology/0001/anything/v2');

        expect(
            testHostComponent.resourceClassAndPropertySelection
                .activeResourceClass
        ).toEqual(undefined);
        expect(
            testHostComponent.resourceClassAndPropertySelection.resourceClasses
                .length
        ).toEqual(12);
        expect(
            Object.keys(
                testHostComponent.resourceClassAndPropertySelection.properties
            ).length
        ).toEqual(30);

        const selectResClassComp = hostCompDe.query(
            By.directive(TestSearchSelectResourceClassComponent)
        );
        expect(
            (
                selectResClassComp.componentInstance as TestSearchSelectResourceClassComponent
            ).resourceClassDefinitions.length
        ).toEqual(12);

        expect(dspConnSpy.v2.ontologyCache.getOntology).toHaveBeenCalledTimes(
            1
        );
        expect(dspConnSpy.v2.ontologyCache.getOntology).toHaveBeenCalledWith(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        );
    });

    it('should react when a resource class is selected', async () => {
        const dspConnSpy = TestBed.inject(DspApiConnectionToken);

        (
            dspConnSpy.v2.ontologyCache as jasmine.SpyObj<OntologyCache>
        ).getResourceClassDefinition.and.callFake(() =>
            of(
                MockOntology.mockIResourceClassAndPropertyDefinitions(
                    'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing'
                )
            )
        );

        const anythingOnto = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        );

        // get resource class defs
        testHostComponent.resourceClassAndPropertySelection.resourceClasses =
            anythingOnto.getClassDefinitionsByType(ResourceClassDefinition);

        const resProps = anythingOnto.getPropertyDefinitionsByType(
            ResourcePropertyDefinition
        );

        testHostComponent.resourceClassAndPropertySelection.properties =
            resProps;

        testHostFixture.detectChanges();

        const hostCompDe = testHostFixture.debugElement;
        const selectResClassComp = hostCompDe.query(
            By.directive(TestSearchSelectResourceClassComponent)
        );

        (
            selectResClassComp.componentInstance as TestSearchSelectResourceClassComponent
        ).resourceClassSelected.emit(
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing'
        );

        testHostFixture.detectChanges();

        expect(
            testHostComponent.resourceClassAndPropertySelection
                .activeResourceClass
        ).toEqual(
            MockOntology.mockIResourceClassAndPropertyDefinitions(
                'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing'
            ).classes['http://0.0.0.0:3333/ontology/0001/anything/v2#Thing']
        );
        expect(
            Object.keys(
                testHostComponent.resourceClassAndPropertySelection.properties
            ).length
        ).toEqual(25);

        expect(
            dspConnSpy.v2.ontologyCache.getResourceClassDefinition
        ).toHaveBeenCalledTimes(1);
        expect(
            dspConnSpy.v2.ontologyCache.getResourceClassDefinition
        ).toHaveBeenCalledWith(
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing'
        );

        const addPropButton = await loader.getHarness(
            MatButtonHarness.with({ selector: '.add-property-button' })
        );

        await addPropButton.click();

        const selectPropComp = hostCompDe.query(
            By.directive(TestSearchSelectPropertyComponent)
        );

        expect(
            (
                selectPropComp.componentInstance as TestSearchSelectPropertyComponent
            ).activeResourceClass
        ).toEqual(
            MockOntology.mockIResourceClassAndPropertyDefinitions(
                'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing'
            ).classes['http://0.0.0.0:3333/ontology/0001/anything/v2#Thing']
        );

        expect(
            (
                selectPropComp.componentInstance as TestSearchSelectPropertyComponent
            ).index
        ).toEqual(0);
        expect(
            Object.keys(
                (
                    selectPropComp.componentInstance as TestSearchSelectPropertyComponent
                ).properties
            ).length
        ).toEqual(25);
    });

    it('should disable add property button on init', async () => {
        const addPropButton = await loader.getHarness(
            MatButtonHarness.with({ selector: '.add-property-button' })
        );

        expect(await addPropButton.isDisabled()).toBe(false);
    });

    it('should disable remove property button on init', async () => {
        const rmPropButton = await loader.getHarness(
            MatButtonHarness.with({ selector: '.remove-property-button' })
        );

        expect(await rmPropButton.isDisabled()).toBe(true);
    });

    it('should display a property selection when the add property button has been clicked', async () => {
        const anythingOnto = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        );

        // get resource class defs
        testHostComponent.resourceClassAndPropertySelection.resourceClasses =
            anythingOnto.getClassDefinitionsByType(ResourceClassDefinition);

        const resProps = anythingOnto.getPropertyDefinitionsByType(
            ResourcePropertyDefinition
        );

        testHostComponent.resourceClassAndPropertySelection.properties =
            resProps;

        testHostFixture.detectChanges();

        expect(
            testHostComponent.resourceClassAndPropertySelection.activeProperties
                .length
        ).toEqual(0);

        const addPropButton = await loader.getHarness(
            MatButtonHarness.with({ selector: '.add-property-button' })
        );

        expect(await addPropButton.isDisabled()).toBe(false);

        await addPropButton.click();

        expect(
            testHostComponent.resourceClassAndPropertySelection.activeProperties
                .length
        ).toEqual(1);

        const hostCompDe = testHostFixture.debugElement;
        const selectPropComp = hostCompDe.query(
            By.directive(TestSearchSelectPropertyComponent)
        );

        expect(
            (
                selectPropComp.componentInstance as TestSearchSelectPropertyComponent
            ).activeResourceClass
        ).toEqual(undefined);
        expect(
            (
                selectPropComp.componentInstance as TestSearchSelectPropertyComponent
            ).index
        ).toEqual(0);
        expect(
            (
                selectPropComp.componentInstance as TestSearchSelectPropertyComponent
            ).properties
        ).toEqual(resProps);

        const rmPropButton = await loader.getHarness(
            MatButtonHarness.with({ selector: '.remove-property-button' })
        );

        expect(await rmPropButton.isDisabled()).toBe(false);
    });

    it('should add to and remove from active properties array when property buttons are clicked', async () => {
        const anythingOnto = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        );

        // get resource class defs
        testHostComponent.resourceClassAndPropertySelection.resourceClasses =
            anythingOnto.getClassDefinitionsByType(ResourceClassDefinition);

        const resProps = anythingOnto.getPropertyDefinitionsByType(
            ResourcePropertyDefinition
        );

        testHostComponent.resourceClassAndPropertySelection.properties =
            resProps;

        testHostFixture.detectChanges();

        const addPropButton = await loader.getHarness(
            MatButtonHarness.with({ selector: '.add-property-button' })
        );

        const rmPropButton = await loader.getHarness(
            MatButtonHarness.with({ selector: '.remove-property-button' })
        );

        expect(
            testHostComponent.resourceClassAndPropertySelection.activeProperties
                .length
        ).toEqual(0);

        await addPropButton.click();

        expect(
            testHostComponent.resourceClassAndPropertySelection.activeProperties
                .length
        ).toEqual(1);

        await addPropButton.click();

        expect(
            testHostComponent.resourceClassAndPropertySelection.activeProperties
                .length
        ).toEqual(2);

        await rmPropButton.click();

        expect(
            testHostComponent.resourceClassAndPropertySelection.activeProperties
                .length
        ).toEqual(1);

        await rmPropButton.click();

        expect(
            testHostComponent.resourceClassAndPropertySelection.activeProperties
                .length
        ).toEqual(0);
    });

    it('should add at max four property selections', async () => {
        // simulate state after anything onto selection
        testHostComponent.resourceClassAndPropertySelection.activeOntology =
            'http://0.0.0.0:3333/ontology/0001/anything/v2';

        const anythingOnto = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        );

        // get resource class defs
        testHostComponent.resourceClassAndPropertySelection.resourceClasses =
            anythingOnto.getClassDefinitionsByType(ResourceClassDefinition);

        const resProps = anythingOnto.getPropertyDefinitionsByType(
            ResourcePropertyDefinition
        );

        testHostComponent.resourceClassAndPropertySelection.properties =
            resProps;

        testHostComponent.resourceClassAndPropertySelection.activeProperties = [
            true,
            true,
            true,
            true,
        ];

        testHostFixture.detectChanges();

        const addPropButton = await loader.getHarness(
            MatButtonHarness.with({ selector: '.add-property-button' })
        );

        expect(await addPropButton.isDisabled()).toEqual(true);
    });
});
