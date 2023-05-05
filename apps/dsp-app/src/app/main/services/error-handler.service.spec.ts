import {
    HttpClientTestingModule,
    HttpTestingController,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
    MatLegacyDialog as MatDialog,
    MatLegacyDialogModule as MatDialogModule,
    MatLegacyDialogRef as MatDialogRef,
} from '@angular/material/legacy-dialog';
import { MatLegacySnackBarModule as MatSnackBarModule } from '@angular/material/legacy-snack-bar';
import {
    BrowserAnimationsModule,
    NoopAnimationsModule,
} from '@angular/platform-browser/animations';
import { HealthEndpointSystem, MockHealth } from '@dasch-swiss/dsp-js';
import { of } from 'rxjs';
import { DspApiConnectionToken } from '../declarations/dsp-api-tokens';
import { DialogComponent } from '../dialog/dialog.component';
import { ErrorHandlerService } from './error-handler.service';

describe('ErrorHandlerService', () => {
    let httpTestingController: HttpTestingController;
    let service: ErrorHandlerService;

    let dialog: MatDialog;

    beforeEach(() => {
        const apiEndpointSpyObj = {
            v2: {
                auth: jasmine.createSpyObj('auth', ['logout']),
            },
            system: {
                healthEndpoint: jasmine.createSpyObj('healthEndpoint', [
                    'getHealthStatus',
                ]),
            },
        };

        TestBed.configureTestingModule({
            imports: [
                BrowserAnimationsModule,
                HttpClientTestingModule,
                MatDialogModule,
                MatSnackBarModule,
                NoopAnimationsModule,
            ],
            providers: [
                {
                    provide: MatDialog,
                    useValue: { open: () => of({ id: 1 }) },
                },
                {
                    provide: DspApiConnectionToken,
                    useValue: apiEndpointSpyObj,
                },
            ],
        });
        service = TestBed.inject(ErrorHandlerService);

        httpTestingController = TestBed.inject(HttpTestingController);

        const dspConnSpy = TestBed.inject(DspApiConnectionToken);
        (
            dspConnSpy.system
                .healthEndpoint as jasmine.SpyObj<HealthEndpointSystem>
        ).getHealthStatus.and.callFake(() => {
            const health = MockHealth.mockRunning();
            return of(health);
        });

        dialog = TestBed.inject(MatDialog);
    });

    afterEach(() => {
        httpTestingController.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    xit('api is not healthy: should return 503 server error', () => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const error = require('../../../assets/test-data/api-error-0.json');

        service.showMessage(error);

        spyOn(dialog, 'open').and.returnValue({
            afterClosed: () => of({ id: 1 }),
        } as MatDialogRef<typeof DialogComponent>);
        expect(dialog).toBeDefined();
    });
});
