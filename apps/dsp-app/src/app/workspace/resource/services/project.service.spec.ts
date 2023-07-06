import { TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppConfigService } from '@dasch-swiss/vre/shared/app-config';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { ProjectService } from './project.service';
import { MockProvider } from 'ng-mocks';
import { AppLoggingService } from '@dasch-swiss/vre/shared/app-logging';

describe('ProjectService', () => {
    let service: ProjectService;

    const appInitSpy = {
        dspAppConfig: {
            iriBase: 'http://rdfh.ch',
        },
    };

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
                    provide: AppConfigService,
                    useValue: appInitSpy,
                },
                MockProvider(AppLoggingService),
                {
                    provide: DspApiConnectionToken,
                    useValue: apiEndpointSpyObj,
                },
            ],
        });
        service = TestBed.inject(ProjectService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
