import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { TermsTabViewComponent } from './terms-tab-view.component';
import { Component, ViewChild } from '@angular/core';

/**
 * test host component to simulate parent component.
 */
@Component({
    selector: 'app-board-host-component',
    template: '<app-terms-tab-view [conditions]="conditionsOfAccess" [license]="license"></app-terms-tab-view>'
})
class TestHostBoardComponent {

    @ViewChild('termsTabView') termsTabView: TermsTabViewComponent;

    // input parameters
    conditionsOfAccess = 'Open Access';
    license = [{ 'type': 'https://schema.org/URL', 'value': 'https://creativecommons.org/licenses/by/3.0', 'url': 'https://creativecommons.org/licenses/by/3.0' }];
}

describe('TermsTabViewComponent', () => {
    let testHostComponent: TestHostBoardComponent;
    let testHostFixture: ComponentFixture<TestHostBoardComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                TestHostBoardComponent,
                TermsTabViewComponent
            ]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        testHostFixture = TestBed.createComponent(TestHostBoardComponent);
        testHostComponent = testHostFixture.componentInstance;
        testHostFixture.detectChanges();
    });

    it('should create', () => {
        expect(testHostComponent).toBeTruthy();
    });
});

