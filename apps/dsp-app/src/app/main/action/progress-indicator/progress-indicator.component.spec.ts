import { Component, OnInit, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { By } from '@angular/platform-browser';
import { ProgressIndicatorComponent } from './progress-indicator.component';

/**
 * test host component to simulate parent component with a progress bar.
 */
@Component({
    template: ` <app-progress-indicator
        #progressIndicator
        [status]="status"
        [color]="color"
    ></app-progress-indicator>`,
})
class TestHostComponent implements OnInit {
    @ViewChild('progressIndicator', { static: false })
    progressIndicatorComponent: ProgressIndicatorComponent;

    status = 0;
    color = 'red';

    constructor() {}

    ngOnInit() {}
}

describe('ProgressIndicatorComponent', () => {
    let testHostComponent: TestHostComponent;
    let testHostFixture: ComponentFixture<TestHostComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [MatIconModule],
            declarations: [ProgressIndicatorComponent, TestHostComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        testHostFixture = TestBed.createComponent(TestHostComponent);
        testHostComponent = testHostFixture.componentInstance;
        testHostFixture.detectChanges();

        expect(testHostComponent).toBeTruthy();
    });

    it('should create', () => {
        expect(testHostComponent.progressIndicatorComponent).toBeTruthy();
    });

    it('should display a red spinner as progress indicator', () => {
        expect(testHostComponent.progressIndicatorComponent).toBeTruthy();
        expect(testHostComponent.progressIndicatorComponent.color).toEqual(
            'red'
        );
        expect(testHostComponent.progressIndicatorComponent.status).toEqual(0);

        const hostCompDe = testHostFixture.debugElement;

        const progressEl = hostCompDe.query(
            By.directive(ProgressIndicatorComponent)
        );

        const divProgressElement = progressEl.query(
            By.css('.app-progress-indicator')
        );

        const submitEl = divProgressElement.query(By.css('div'));

        const spinnerEl = submitEl.query(By.css('div'));

        expect(spinnerEl.styles.borderTopColor).toEqual('red');
        expect(spinnerEl.styles.borderLeftColor).toEqual('red');
    });

    it('should change the color of the progress indicator from red to blue', () => {
        expect(testHostComponent.progressIndicatorComponent).toBeTruthy();
        expect(testHostComponent.progressIndicatorComponent.color).toEqual(
            'red'
        );
        expect(testHostComponent.progressIndicatorComponent.status).toEqual(0);

        const hostCompDe = testHostFixture.debugElement;

        const progressEl = hostCompDe.query(
            By.directive(ProgressIndicatorComponent)
        );

        const divProgressElement = progressEl.query(
            By.css('.app-progress-indicator')
        );

        const submitEl = divProgressElement.query(By.css('div'));

        const spinnerEl = submitEl.query(By.css('div'));

        expect(spinnerEl.styles.borderTopColor).toEqual('red');
        expect(spinnerEl.styles.borderLeftColor).toEqual('red');

        // change the color of the spinner
        testHostComponent.progressIndicatorComponent.color = 'blue';

        testHostFixture.detectChanges();

        // expect the spinner to be blue
        expect(spinnerEl.styles.borderTopColor).toEqual('blue');
        expect(spinnerEl.styles.borderLeftColor).toEqual('blue');
    });

    it('should update the progress indicator according to the status value', () => {
        expect(testHostComponent.progressIndicatorComponent).toBeTruthy();
        expect(testHostComponent.progressIndicatorComponent.color).toEqual(
            'red'
        );
        expect(testHostComponent.progressIndicatorComponent.status).toEqual(0);

        const hostCompDe = testHostFixture.debugElement;

        const progressEl = hostCompDe.query(
            By.directive(ProgressIndicatorComponent)
        );

        const divProgressElement = progressEl.query(
            By.css('.app-progress-indicator')
        );

        const submitEl = divProgressElement.query(By.css('div'));

        const spinnerEl = submitEl.query(By.css('div'));

        expect(spinnerEl.attributes.class).toEqual('spinner');

        // update status value to 1
        testHostComponent.progressIndicatorComponent.status = 1;

        testHostFixture.detectChanges();

        const divEl = divProgressElement.query(By.css('div'));

        const matIconEl = divProgressElement.query(By.css('mat-icon'));

        // new status: done
        expect(matIconEl.attributes.class).toEqual(
            'mat-icon notranslate after-submit material-icons mat-ligature-font mat-icon-no-color'
        );
        expect(matIconEl.nativeElement.innerText).toEqual('done');
        expect(matIconEl.styles.color).toEqual('red');
    });

    it('should display the default progress indicator when the status is undefined', () => {
        expect(testHostComponent.progressIndicatorComponent).toBeTruthy();
        expect(testHostComponent.progressIndicatorComponent.color).toEqual(
            'red'
        );
        expect(testHostComponent.progressIndicatorComponent.status).toEqual(0);

        // change the status to undefined
        testHostComponent.progressIndicatorComponent.status = undefined;

        expect(testHostComponent.progressIndicatorComponent.status).toEqual(
            undefined
        );

        testHostFixture.detectChanges();

        const hostCompDe = testHostFixture.debugElement;

        const progressEl = hostCompDe.query(
            By.directive(ProgressIndicatorComponent)
        );

        const divProgressElement = progressEl.query(
            By.css('.app-progress-indicator')
        );

        const svgEl =
            divProgressElement.nativeElement.getElementsByTagName('svg');
        expect(svgEl).not.toBe(null);

        // const gEl = divProgressElement.nativeElement.getElementsByTagName('g');
        const gEl = progressEl.query(By.css('g'));
        // const gEl = svgEl.getElementsByTagName('g');

        // // expect the default progress indicator in red
        expect(gEl.attributes.stroke).toEqual('red');
    });
});
