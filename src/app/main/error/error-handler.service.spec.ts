import { TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ErrorHandlerService } from './error-handler.service';

describe('ErrorHandlerService', () => {
    let service: ErrorHandlerService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                BrowserAnimationsModule,
                MatDialogModule,
                MatSnackBarModule
            ]
        });
        service = TestBed.inject(ErrorHandlerService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
