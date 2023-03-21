import { Component, Input, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { AngularSplitModule } from 'angular-split';
import { SplitSize } from '../results/results.component';
import { ComparisonComponent } from './comparison.component';

/**
 * test host component to simulate child component, here resource-view.
 */
@Component({
    selector: 'app-resource',
    template: '',
})
class TestResourceComponent {
    @Input() resourceIri: string;
    @Input() splitSizeChanged: SplitSize;
}

/**
 * test host component to simulate parent component.
 */
@Component({
    selector: 'app-comparison-host-component',
    template:
        '<app-comparison #comparison [noOfResources]="noOfResources" [resourceIds]="resourceIds"></app-comparison>',
})
class TestHostComparisonComponent {
    @ViewChild('comparison') comparison: ComparisonComponent;

    resourceIds = [
        'http://rdfh.ch/0803/18a671b8a601',
        'http://rdfh.ch/0803/7e4cfc5417',
        'http://rdfh.ch/0803/6ad3e2c47501',
        'http://rdfh.ch/0803/009e225a5f01',
        'http://rdfh.ch/0803/00ed33070f02',
    ];
    noOfResources = this.resourceIds.length;
}

describe('ComparisonComponent', () => {
    let testHostComponent: TestHostComparisonComponent;
    let testHostFixture: ComponentFixture<TestHostComparisonComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [
                ComparisonComponent,
                TestHostComparisonComponent,
                TestResourceComponent,
            ],
            imports: [AngularSplitModule],
        }).compileComponents();
    }));

    beforeEach(() => {
        testHostFixture = TestBed.createComponent(TestHostComparisonComponent);
        testHostComponent = testHostFixture.componentInstance;
        testHostFixture.detectChanges();
    });

    it('should create', () => {
        expect(testHostComponent.comparison).toBeTruthy();
    });

    it('expect top row with 2 resources', () => {
        expect(testHostComponent.comparison.topRow.length).toEqual(2);
    });

    it('expect bottom row with 3 resources', () => {
        expect(testHostComponent.comparison.bottomRow.length).toEqual(3);
    });
});
