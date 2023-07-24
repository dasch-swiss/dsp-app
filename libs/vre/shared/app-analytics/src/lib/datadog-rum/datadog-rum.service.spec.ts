import { TestBed } from '@angular/core/testing';

import { DatadogRumService } from './datadog-rum.service';
import { MockProvider, MockService } from 'ng-mocks';
import {
    BuildTag,
    BuildTagToken,
    DspInstrumentationToken,
} from '@dasch-swiss/vre/shared/app-config';
import { SessionService } from '@dasch-swiss/vre/shared/app-session';
import { BehaviorSubject, Observable } from 'rxjs';

describe('DatadogRumService', () => {
    let service: DatadogRumService;

    const buildTag$: Observable<BuildTag> = new BehaviorSubject({
        build_tag: '1234',
    }).asObservable();

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                MockProvider(BuildTagToken, buildTag$),
                MockProvider(DspInstrumentationToken, {}),
                MockProvider(SessionService),
            ],
        });
        service = TestBed.inject(DatadogRumService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
