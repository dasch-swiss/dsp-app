import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PropertyFormLinkMatchPropertyComponent } from './property-form-link-match-property.component';

describe('PropertyFormLinkMatchPropertyComponent', () => {
    let component: PropertyFormLinkMatchPropertyComponent;
    let fixture: ComponentFixture<PropertyFormLinkMatchPropertyComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PropertyFormLinkMatchPropertyComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(
            PropertyFormLinkMatchPropertyComponent
        );
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
