import { TestBed } from '@angular/core/testing';

import { ComponentCommunicationEventService } from './component-communication-event.service';

describe('ComponentCommunicationEventService', () => {
    let service: ComponentCommunicationEventService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(ComponentCommunicationEventService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
