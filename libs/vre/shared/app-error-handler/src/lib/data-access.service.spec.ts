import { TestBed } from '@angular/core/testing';

import { DataAccessService } from './data-access.service';
import { MockProvider } from 'ng-mocks';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';

describe('DataAccessService', () => {
    let service: DataAccessService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [MockProvider(DspApiConnectionToken, {})],
        });
        service = TestBed.inject(DataAccessService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
