import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ResourceClassFormService } from './resource-class-form.service';

describe('ResourceClassFormService', () => {
    beforeEach(() => TestBed.configureTestingModule({
        imports: [
            ReactiveFormsModule
        ]
    }));

    it('should be created', () => {
        const service: ResourceClassFormService = TestBed.inject(ResourceClassFormService);
        expect(service).toBeTruthy();
    });
});
