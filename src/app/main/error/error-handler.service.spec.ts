import { OverlayContainer } from '@angular/cdk/overlay';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HealthEndpointSystem, MockHealth } from '@dasch-swiss/dsp-js';
import { of } from 'rxjs';
import { DspApiConnectionToken } from '../declarations/dsp-api-tokens';
import { DialogComponent } from '../dialog/dialog.component';
import { ErrorHandlerService } from './error-handler.service';

describe('ErrorHandlerService', () => {
    let httpTestingController: HttpTestingController;
    let service: ErrorHandlerService;
    let overlayContainer: OverlayContainer;

    let dialog: MatDialog;

    beforeEach(() => {

        const apiEndpointSpyObj = {
            v2: {
                auth: jasmine.createSpyObj('auth', ['logout'])
            },
            system: {
                healthEndpoint: jasmine.createSpyObj('healthEndpoint', ['getHealthStatus'])
            }
        };

        TestBed.configureTestingModule({
            imports: [
                BrowserAnimationsModule,
                HttpClientTestingModule,
                MatDialogModule,
                MatSnackBarModule
            ],
            providers: [
                {
                    provide: DspApiConnectionToken,
                    useValue: apiEndpointSpyObj
                },
                {
                    provide: MatDialog,
                    useValue: { open: () => of({ id: 1 }) }
                }
            ]
        });
        service = TestBed.inject(ErrorHandlerService);

        httpTestingController = TestBed.inject(HttpTestingController);

        const dspConnSpy = TestBed.inject(DspApiConnectionToken);
        (dspConnSpy.system.healthEndpoint as jasmine.SpyObj<HealthEndpointSystem>).getHealthStatus.and.callFake(
            () => {
                const health = MockHealth.mockStopped();
                return of(health);
            }
        );

        overlayContainer = TestBed.inject(OverlayContainer);

        dialog = TestBed.inject(MatDialog);
    });

    afterEach(() => {
        httpTestingController.verify();
    });

    afterEach(async () => {
        // angular won't call this for us so we need to do it ourselves to avoid leaks.
        overlayContainer.ngOnDestroy();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('api is not healthy: should return 503 server error', () => {

        const error = require('../../../assets/test-data/api-error-0.json');

        service.showMessage(error);

        spyOn(dialog, 'open').and.returnValue({ afterClosed: () => of({ id: 1 }) } as MatDialogRef<typeof DialogComponent>);
        expect(dialog).toBeDefined();

    });
});
