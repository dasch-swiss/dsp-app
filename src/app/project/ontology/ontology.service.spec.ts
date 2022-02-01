import { TestBed } from '@angular/core/testing';
import { CacheService } from 'src/app/main/cache/cache.service';
import { OntologyService } from './ontology.service';


describe('OntologyService', () => {
    let service: OntologyService;

    const cacheServiceSpy = jasmine.createSpyObj('CacheService', ['get']);

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                {
                    provide: CacheService,
                    useValue: cacheServiceSpy
                },
            ]
        });
        service = TestBed.inject(OntologyService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
