import { Component, ViewChild } from '@angular/core';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { DatasetTabViewComponent } from './dataset-tab-view.component';

/**
* test host component to simulate parent component.
*/
@Component({
    selector: 'app-board-host-component',
    template: '<app-dataset-tab-view [metadata]="datasetMetadata"></app-dataset-tab-view>'
})
class TestHostBoardComponent {

    @ViewChild('datasetTabView') datasetTabView: DatasetTabViewComponent;

    // metadata object
    // datasetMetadata = {};
}

describe('DatasetTabViewComponent', () => {
    let testHostComponent: TestHostBoardComponent;
    let testHostFixture: ComponentFixture<TestHostBoardComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [
                TestHostBoardComponent,
                DatasetTabViewComponent
            ]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        testHostFixture = TestBed.createComponent(TestHostBoardComponent);
        testHostComponent = testHostFixture.componentInstance;
        testHostFixture.detectChanges();
    });

    // todo: add test case when test data is ready
    /* it('should create', () => {
        expect(testHostComponent).toBeTruthy();
    }); */
});
