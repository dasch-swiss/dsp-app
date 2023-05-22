import {
    Component,
    OnInit,
    Pipe,
    PipeTransform,
    ViewChild,
} from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { HealthEndpointSystem, MockHealth } from '@dasch-swiss/dsp-js';
import { of } from 'rxjs';
import { HttpStatusMsg } from '@dsp-app/src/assets/http/statusMsg';
import { DspApiConnectionToken } from '../declarations/dsp-api-tokens';
import { StatusComponent } from './status.component';

/**
 * mocked linkify pipe from main/pipes.
 */
@Pipe({ name: 'appLinkify' })
class MockPipe implements PipeTransform {
    transform(value: string): string {
        // do stuff here, if you want
        return value;
    }
}

/**
 * test host component to simulate parent component.
 * dsp specific http status message
 */
@Component({
    template: ` <app-status #warning [status]="204"></app-status>`,
})
class NoContentTestHostComponent implements OnInit {
    @ViewChild('warning', { static: false }) StatusComponent: StatusComponent;

    constructor() {}

    ngOnInit() {}
}

/**
 * test host component to simulate parent component.
 * default http status message
 */
@Component({
    template: ` <app-status #error [status]="418"></app-status>`,
})
class TeapotTestHostComponent implements OnInit {
    @ViewChild('error', { static: false }) StatusComponent: StatusComponent;

    constructor() {}

    ngOnInit() {}
}

describe('StatusComponent', () => {
    let noContentTestHostComponent: NoContentTestHostComponent;
    let noContentTestHostFixture: ComponentFixture<NoContentTestHostComponent>;

    let teapotTestHostComponent: TeapotTestHostComponent;
    let teapotTestHostFixture: ComponentFixture<TeapotTestHostComponent>;

    const apiEndpointSpyObj = {
        system: {
            healthEndpoint: jasmine.createSpyObj('healthEndpoint', [
                'getHealthStatus',
            ]),
        },
    };

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [
                StatusComponent,
                NoContentTestHostComponent,
                TeapotTestHostComponent,
                MockPipe,
            ],
            imports: [
                BrowserAnimationsModule,
                MatIconModule,
                RouterTestingModule,
            ],
            providers: [
                HttpStatusMsg,
                {
                    provide: MatDialogRef,
                    useValue: {},
                },
                {
                    provide: DspApiConnectionToken,
                    useValue: apiEndpointSpyObj,
                },
            ],
        }).compileComponents();
    }));

    beforeEach(() => {
        noContentTestHostFixture = TestBed.createComponent(
            NoContentTestHostComponent
        );
        noContentTestHostComponent = noContentTestHostFixture.componentInstance;
        noContentTestHostFixture.detectChanges();

        teapotTestHostFixture = TestBed.createComponent(
            TeapotTestHostComponent
        );
        teapotTestHostComponent = teapotTestHostFixture.componentInstance;
        teapotTestHostFixture.detectChanges();

        const dspConnSpy = TestBed.inject(DspApiConnectionToken);
        (
            dspConnSpy.system
                .healthEndpoint as jasmine.SpyObj<HealthEndpointSystem>
        ).getHealthStatus.and.callFake(() => {
            const health = MockHealth.mockRunning();
            return of(health);
        });
    });

    it('should create', () => {
        expect(noContentTestHostComponent).toBeTruthy();
    });

    it('should display "warning 204 | no content"', () => {
        expect(noContentTestHostComponent.StatusComponent).toBeTruthy();
        expect(
            noContentTestHostComponent.StatusComponent.message.status
        ).toEqual(204);
        expect(noContentTestHostComponent.StatusComponent.message.type).toEqual(
            'warning'
        );

        const hostCompDe = noContentTestHostFixture.debugElement;

        const messageEl = hostCompDe.query(By.directive(StatusComponent));

        const titleEle = messageEl.query(By.css('.mat-headline-6'));

        expect(titleEle.nativeElement.innerText).toEqual(
            ' WARNING 204 | No Content '
        );
    });

    it('should display "error 418 | I\'m a teapot"', () => {
        expect(teapotTestHostComponent.StatusComponent).toBeTruthy();
        expect(teapotTestHostComponent.StatusComponent.message.status).toEqual(
            418
        );
        expect(teapotTestHostComponent.StatusComponent.message.type).toEqual(
            'error'
        );

        const hostCompDe = teapotTestHostFixture.debugElement;

        const messageEl = hostCompDe.query(By.directive(StatusComponent));

        const titleEle = messageEl.query(By.css('.mat-headline-6'));

        expect(titleEle.nativeElement.innerText).toEqual(
            "ERROR 418 | I'm a teapot"
        );
    });

    // todo: check the input, check the switch (display 403 template if we get a 403 error, same for 404)
});
