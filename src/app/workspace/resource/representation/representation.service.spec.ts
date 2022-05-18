import { TestBed } from '@angular/core/testing';

import { RepresentationService } from './representation.service';

describe('RepresentationService', () => {
    let service: RepresentationService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(RepresentationService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
