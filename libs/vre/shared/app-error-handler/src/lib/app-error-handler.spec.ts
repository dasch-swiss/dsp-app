import {
    HttpClientTestingModule,
    HttpTestingController,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import {
    BrowserAnimationsModule,
    NoopAnimationsModule,
} from '@angular/platform-browser/animations';
import {
    ApiResponseData,
    ApiResponseError,
    HealthResponse,
} from '@dasch-swiss/dsp-js';
import { of } from 'rxjs';
import { AppErrorHandler } from './app-error-handler';
import { AppLoggingService } from '@dasch-swiss/vre/shared/app-logging';
import { NotificationService } from '@dasch-swiss/vre/shared/app-notification';
import { HttpStatusMsg } from '@dasch-swiss/vre/shared/assets/status-msg';
import { SessionService } from '@dasch-swiss/vre/shared/app-session';
import { DataAccessService } from './data-access.service';
import { AjaxResponse } from 'rxjs/ajax';
import { MockProvider, MockService } from 'ng-mocks';

describe('AppErrorHandler', () => {
    let httpTestingController: HttpTestingController;
    let service: AppErrorHandler;
    const notificationMock = MockService(NotificationService);
    const dataAccessMock = MockService(DataAccessService);

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                BrowserAnimationsModule,
                HttpClientTestingModule,
                MatSnackBarModule,
                NoopAnimationsModule,
            ],
            providers: [
                MockProvider(AppLoggingService),
                MockProvider(NotificationService, notificationMock),
                MockProvider(DataAccessService, dataAccessMock),
                MockProvider(SessionService),
                {
                    provide: HttpStatusMsg,
                },
            ],
        });
        service = TestBed.inject(AppErrorHandler);
        httpTestingController = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpTestingController.verify();
        jest.clearAllMocks();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    // https://www.beyondjava.net/jest-mocking-an-angular-service
    it('api is healthy: should call notification service', () => {
        const getStatusSpy = jest.spyOn(dataAccessMock, 'getHealthStatus');
        const response = new HealthResponse();
        response.status = true;
        getStatusSpy.mockImplementation(() =>
            of(
                ApiResponseData.fromAjaxResponse({
                    response,
                } as AjaxResponse)
            )
        );
        const expectedMessage = <ApiResponseError>{ error: 'gaga' };
        service.showMessage(expectedMessage);
        expect(getStatusSpy).toHaveBeenCalled();
        expect(notificationMock.openSnackBar).toHaveBeenCalledWith(
            expectedMessage
        );
    });
});
