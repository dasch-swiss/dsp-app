import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PropertyFormListValueComponent } from './property-form-list-value.component';

describe('PropertyFormListValueComponent', () => {
    let component: PropertyFormListValueComponent;
    let fixture: ComponentFixture<PropertyFormListValueComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PropertyFormListValueComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(PropertyFormListValueComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
