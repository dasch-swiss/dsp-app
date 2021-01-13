import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { PersonTemplateComponent } from '../person-template/person-template.component';
import { AttributionTabViewComponent } from './attribution-tab-view.component';


describe('AttributionTabViewComponent', () => {
    let component: AttributionTabViewComponent;
    let fixture: ComponentFixture<AttributionTabViewComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                AttributionTabViewComponent, PersonTemplateComponent
            ]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AttributionTabViewComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
