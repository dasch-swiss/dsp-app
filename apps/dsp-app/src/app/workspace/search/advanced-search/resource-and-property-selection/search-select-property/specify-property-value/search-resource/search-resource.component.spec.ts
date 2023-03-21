import { Component, Inject, Input, OnInit, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import {
    UntypedFormBuilder,
    UntypedFormGroup,
    ReactiveFormsModule,
} from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MockOntology, ResourcePropertyDefinition } from '@dasch-swiss/dsp-js';
import {
    ComparisonOperatorAndValue,
    GreaterThan,
    LinkedResource,
    PropertyWithValue,
    ValueLiteral,
} from '../operator';
import { SearchResourceComponent } from './search-resource.component';

/**
 * test host component to simulate parent component.
 */
@Component({
    template: ` <app-search-resource
        #searchRes
        [formGroup]="form"
        [restrictResourceClass]="resClass"
    ></app-search-resource>`,
})
class TestHostComponent implements OnInit {
    @ViewChild('searchRes', { static: false })
    searchResource: SearchResourceComponent;

    form;

    resClass: string;

    constructor(@Inject(UntypedFormBuilder) private _fb: UntypedFormBuilder) {}

    ngOnInit() {
        this.form = this._fb.group({});
        this.resClass = 'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing';
    }
}

/**
 * test component to simulate ResourceAndPropertySelectionComponent.
 */
@Component({
    selector: 'app-resource-and-property-selection',
    template: '',
})
class TestResourceAndPropertySelectionComponent implements OnInit {
    @Input() formGroup: UntypedFormGroup;

    @Input() activeOntology: string;

    @Input() resourceClassRestriction?: string;

    @Input() topLevel;

    // mock ref to child comp.
    resourceClassComponent = {
        selectedResourceClassIri:
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
    };

    // mock ref to child comp.
    propertyComponents = [];

    ngOnInit() {
        const anythingOnto = MockOntology.mockReadOntology(
            'http://0.0.0.0:3333/ontology/0001/anything/v2'
        );

        const linkedResValue = new ComparisonOperatorAndValue(
            new GreaterThan(),
            new ValueLiteral('0.5', 'http://www.w3.org/2001/XMLSchema#decimal')
        );

        const hasDecimal =
            anythingOnto.properties[
                'http://0.0.0.0:3333/ontology/0001/anything/v2#hasDecimal'
            ];

        const linkedResourceWithVal = new PropertyWithValue(
            hasDecimal as ResourcePropertyDefinition,
            linkedResValue,
            false
        );

        this.propertyComponents = [
            {
                getPropertySelectedWithValue: () => linkedResourceWithVal,
            },
        ];
    }
}

describe('SearchResourceComponent', () => {
    let testHostComponent: TestHostComponent;
    let testHostFixture: ComponentFixture<TestHostComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [BrowserAnimationsModule, ReactiveFormsModule],
            declarations: [
                SearchResourceComponent,
                TestResourceAndPropertySelectionComponent,
                TestHostComponent,
            ],
        }).compileComponents();
    }));

    beforeEach(() => {
        testHostFixture = TestBed.createComponent(TestHostComponent);
        testHostComponent = testHostFixture.componentInstance;

        testHostFixture.detectChanges();
    });

    it('should create', () => {
        expect(testHostComponent).toBeTruthy();
        expect(testHostComponent.searchResource).toBeTruthy();
    });

    it('should correctly determine the ontology from the resource class constraint', () => {
        expect(testHostComponent.searchResource.restrictResourceClass).toEqual(
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing'
        );
    });

    it('should return a specified resource', () => {
        const linkedRes = testHostComponent.searchResource.getValue();

        expect(linkedRes instanceof LinkedResource).toBeTrue();
        expect((linkedRes as LinkedResource).resourceClass).toEqual(
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing'
        );
        expect((linkedRes as LinkedResource).properties.length).toEqual(1);

        expect((linkedRes as LinkedResource).properties[0].property.id).toEqual(
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasDecimal'
        );
    });
});
