import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { RouterTestingModule } from '@angular/router/testing';
import { DspApiConnectionToken } from '../declarations/dsp-api-tokens';
import { ErrorComponent } from './error.component';

describe('ErrorComponent', () => {
    let component: ErrorComponent;
    let fixture: ComponentFixture<ErrorComponent>;

    const systemEndpointSpyObj = {
        health: {
            healthEndpoint: jasmine.createSpyObj('healthEndpoint', ['getHealthStatus'])
        }
    };

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [ErrorComponent],
            imports: [
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
                    useValue: systemEndpointSpyObj
                },
            ]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ErrorComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    // todo: check the input, check the switch (display 403 template if we get a 403 error, same for 404)
});
