import { TestBed } from '@angular/core/testing';
import { KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { AppConfigService } from '@dasch-swiss/vre/shared/app-config';
import { CacheService } from '@dsp-app/src/app/main/cache/cache.service';
import {
    DspApiConfigToken,
    DspApiConnectionToken,
} from '@dasch-swiss/vre/shared/app-config';
import { TestConfig } from '@dsp-app/src/test.config';
import { OntologyService } from './ontology.service';

describe('OntologyService', () => {
    let service: OntologyService;

    const cacheServiceSpy = jasmine.createSpyObj('CacheService', ['get']);

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                AppConfigService,
                {
                    provide: DspApiConfigToken,
                    useValue: TestConfig.ApiConfig,
                },
                {
                    provide: DspApiConnectionToken,
                    useValue: new KnoraApiConnection(TestConfig.ApiConfig),
                },
                {
                    provide: CacheService,
                    useValue: cacheServiceSpy,
                },
            ],
        });
        service = TestBed.inject(OntologyService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
