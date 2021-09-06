import { TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DspActionModule } from '@dasch-swiss/dsp-ui';
import { DspApiConnectionToken } from '../declarations/dsp-api-tokens';
import { ErrorHandlerService } from './error-handler.service';

describe('ErrorHandlerService', () => {
    let service: ErrorHandlerService;

    beforeEach(() => {

        const apiEndpointSpyObj = {
            v2: {
                auth: jasmine.createSpyObj('auth', ['logout'])
            }
        };

        TestBed.configureTestingModule({
            imports: [
                BrowserAnimationsModule,
                DspActionModule,
                MatDialogModule,
                MatSnackBarModule
            ],
            providers: [
                {
                    provide: DspApiConnectionToken,
                    useValue: apiEndpointSpyObj
                },
            ]
        });
        service = TestBed.inject(ErrorHandlerService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
