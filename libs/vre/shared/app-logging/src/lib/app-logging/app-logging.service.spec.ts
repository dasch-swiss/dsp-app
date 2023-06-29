import { TestBed } from '@angular/core/testing';

import { AppLoggingService } from './app-logging.service';
import {
    BuildTag,
    BuildTagToken,
    DspInstrumentationConfig,
    DspInstrumentationToken,
} from '@dasch-swiss/vre/shared/app-config';
import { BehaviorSubject, Observable } from 'rxjs';
import { subscribeSpyTo } from '@hirez_io/observer-spy';

describe('AppLoggingService', () => {
    let service: AppLoggingService;

    const prodConfig: DspInstrumentationConfig = {
        environment: 'production',
        dataDog: {
            enabled: true,
            applicationId: 'app_id',
            clientToken: 'client_token',
            site: 'datadoghq.eu',
            service: 'dsp-app',
        },
        rollbar: {
            enabled: true,
            accessToken: 'rollbar_token',
        },
    };

    const buildTag$: Observable<BuildTag> = new BehaviorSubject({
        build_tag: '1234',
    }).asObservable();

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                {
                    provide: DspInstrumentationToken,
                    useValue: prodConfig,
                },
                {
                    provide: BuildTagToken,
                    useValue: buildTag$,
                },
            ],
        });
        service = TestBed.inject(AppLoggingService);
    });

    it('should be created', () => {
        const observerSpy = subscribeSpyTo(buildTag$);
        expect(observerSpy.getLastValue()).toEqual({ build_tag: '1234' });
        expect(service).toBeTruthy();
    });
});
