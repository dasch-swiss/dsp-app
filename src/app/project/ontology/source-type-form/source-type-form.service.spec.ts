import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { SourceTypeFormService } from './source-type-form.service';

describe('SourceTypeFormService', () => {
    beforeEach(() => TestBed.configureTestingModule({
        imports: [
            ReactiveFormsModule
        ]
    }));

    it('should be created', () => {
        const service: SourceTypeFormService = TestBed.get(SourceTypeFormService);
        expect(service).toBeTruthy();
    });
});
