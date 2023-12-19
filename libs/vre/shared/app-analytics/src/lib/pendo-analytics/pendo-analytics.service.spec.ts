import { TestBed } from '@angular/core/testing';

import { DspInstrumentationToken } from '@dasch-swiss/vre/shared/app-config';
import { AuthService } from '@dasch-swiss/vre/shared/app-session';
import { MockProvider } from 'ng-mocks';
import { BehaviorSubject, Observable } from 'rxjs';
import { PendoAnalyticsService } from './pendo-analytics.service';

describe('PendoAnalyticsService', () => {
  let service: PendoAnalyticsService;

  const isSessionValidResult: Observable<boolean> | null = new BehaviorSubject(
    true
  ).asObservable();

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MockProvider(DspInstrumentationToken, {}),
        MockProvider(AuthService, {
          isSessionValid: () => isSessionValidResult,
        }),
      ],
    });
    service = TestBed.inject(PendoAnalyticsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
