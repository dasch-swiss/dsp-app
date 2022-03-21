import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { HealthEndpointSystem, MockHealth } from '@dasch-swiss/dsp-js';
import { of } from 'rxjs';
import { DspApiConnectionToken } from '../declarations/dsp-api-tokens';
import { ErrorComponent } from './error.component';

describe('ErrorComponent', () => {
    let component: ErrorComponent;
    let fixture: ComponentFixture<ErrorComponent>;

    const apiEndpointSpyObj = {
        system: {
            healthEndpoint: jasmine.createSpyObj('healthEndpoint', ['getHealthStatus'])
        }
    };

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [ErrorComponent],
            imports: [
                BrowserAnimationsModule,
                MatIconModule,
                RouterTestingModule
            ],
            providers: [
                {
                    provide: MatDialogRef,
                    useValue: {}
                },
                {
                    provide: DspApiConnectionToken,
                    useValue: apiEndpointSpyObj
                },
            ]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ErrorComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();

        const dspConnSpy = TestBed.inject(DspApiConnectionToken);
        (dspConnSpy.system.healthEndpoint as jasmine.SpyObj<HealthEndpointSystem>).getHealthStatus.and.callFake(
            () => {
                const health = MockHealth.mockRunning();
                return of(health);
            }
        );
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    // todo: check the input, check the switch (display 403 template if we get a 403 error, same for 404)
});
