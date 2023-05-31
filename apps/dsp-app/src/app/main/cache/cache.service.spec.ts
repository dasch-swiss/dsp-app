import { TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { MatLegacySnackBarModule as MatSnackBarModule } from '@angular/material/legacy-snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { CacheService } from './cache.service';

describe('CacheService', () => {
    beforeEach(() => {
        const apiEndpointSpyObj = {
            v2: {
                auth: jasmine.createSpyObj('auth', ['logout']),
            },
        };

        TestBed.configureTestingModule({
            imports: [
                BrowserAnimationsModule,
                MatDialogModule,
                MatSnackBarModule,
            ],
            providers: [
                {
                    provide: DspApiConnectionToken,
                    useValue: apiEndpointSpyObj,
                },
            ],
        });
    });

    it('should be created', () => {
        const service: CacheService = TestBed.inject(CacheService);
        expect(service).toBeTruthy();
    });

    // todo: get cache, set cache, delete cache, check if the key exists, destroy cache
});
