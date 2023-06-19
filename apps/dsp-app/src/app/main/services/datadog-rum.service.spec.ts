import { TestBed } from '@angular/core/testing';

import { DatadogRumService } from './datadog-rum.service';
import { SessionService } from '@dasch-swiss/vre/shared/app-session';

describe('DatadogRumService', () => {
    let service: DatadogRumService;
    const mockdatadogRumService = jasmine.createSpyObj('datadogRumService', [
        'initializeRum',
        'setActiveUser',
        'removeActiveUser',
    ]);

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                SessionService,
                {
                    provide: DatadogRumService,
                    useValue: mockdatadogRumService,
                },
            ],
        });
        service = TestBed.inject(DatadogRumService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('setActiveUser', () => {
        it('should set the active user', () => {
            const identifier = 'test';
            const identifierType = 'email';
            mockdatadogRumService.setActiveUser.and.callThrough();
            service.setActiveUser(identifier, identifierType);
            expect(service.setActiveUser).toHaveBeenCalledOnceWith(
                identifier,
                identifierType
            );
        });
    });

    describe('removeActiveUser', () => {
        it('should remove the active user', () => {
            mockdatadogRumService.removeActiveUser.and.callThrough();
            service.removeActiveUser();
            expect(service.removeActiveUser).toHaveBeenCalled();
        });
    });
});
