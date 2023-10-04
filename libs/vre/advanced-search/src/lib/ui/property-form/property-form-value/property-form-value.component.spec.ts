import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PropertyFormValueComponent } from './property-form-value.component';

describe('PropertyFormValueComponent', () => {
    let component: PropertyFormValueComponent;
    let fixture: ComponentFixture<PropertyFormValueComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PropertyFormValueComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(PropertyFormValueComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
