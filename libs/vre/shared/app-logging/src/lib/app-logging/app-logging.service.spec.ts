import { TestBed } from '@angular/core/testing';

import { AppLoggingService } from './app-logging.service';

describe('AppLoggingService', () => {
    let service: AppLoggingService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(AppLoggingService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
