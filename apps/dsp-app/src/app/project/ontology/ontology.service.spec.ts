import { TestBed } from '@angular/core/testing';
import { KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { AppConfigService } from '@dasch-swiss/vre/shared/app-config';
import { ApplicationStateService } from '@dsp-app/src/app/main/cache/application-state.service';
import {
    DspApiConfigToken,
    DspApiConnectionToken,
} from '@dasch-swiss/vre/shared/app-config';
import { TestConfig } from '@dsp-app/src/test.config';
import { OntologyService } from './ontology.service';

describe('OntologyService', () => {
    let service: OntologyService;

    const applicationStateServiceSpy = jasmine.createSpyObj('ApplicationStateService', ['get']);

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
                    provide: ApplicationStateService,
                    useValue: applicationStateServiceSpy,
                },
            ],
        });
        service = TestBed.inject(OntologyService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
