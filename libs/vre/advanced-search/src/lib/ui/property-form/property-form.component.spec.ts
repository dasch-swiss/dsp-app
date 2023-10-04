import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PropertyFormComponent } from './property-form.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('PropertyFormComponent', () => {
    let component: PropertyFormComponent;
    let fixture: ComponentFixture<PropertyFormComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PropertyFormComponent, BrowserAnimationsModule],
        }).compileComponents();

        fixture = TestBed.createComponent(PropertyFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
