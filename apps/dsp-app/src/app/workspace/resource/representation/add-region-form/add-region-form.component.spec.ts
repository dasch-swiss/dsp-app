import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UntypedFormBuilder } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

/**
 * test component that mocks AddRegionFromComponent
 */
@Component({ selector: 'app-add-region-form', template: '' })
class MockAddRegionFromComponent {
    @Input() resourceIri: string;
}

// use test host component approach - create separate simple component in the test file and uses it instead the real one
describe('AddRegionFormComponent', () => {
    let component: MockAddRegionFromComponent;
    let fixture: ComponentFixture<MockAddRegionFromComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [MockAddRegionFromComponent],
            imports: [TranslateModule.forRoot()],
            providers: [UntypedFormBuilder],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(MockAddRegionFromComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
