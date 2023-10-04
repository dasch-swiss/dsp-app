import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PropertyFormLinkValueComponent } from './property-form-link-value.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('PropertyFormLinkValueComponent', () => {
    let component: PropertyFormLinkValueComponent;
    let fixture: ComponentFixture<PropertyFormLinkValueComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PropertyFormLinkValueComponent, BrowserAnimationsModule],
        }).compileComponents();

        fixture = TestBed.createComponent(PropertyFormLinkValueComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
