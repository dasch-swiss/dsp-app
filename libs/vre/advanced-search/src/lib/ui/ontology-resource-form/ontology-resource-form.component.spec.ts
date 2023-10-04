import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OntologyResourceFormComponent } from './ontology-resource-form.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('OntologyResourceFormComponent', () => {
    let component: OntologyResourceFormComponent;
    let fixture: ComponentFixture<OntologyResourceFormComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [OntologyResourceFormComponent, BrowserAnimationsModule],
        }).compileComponents();

        fixture = TestBed.createComponent(OntologyResourceFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
