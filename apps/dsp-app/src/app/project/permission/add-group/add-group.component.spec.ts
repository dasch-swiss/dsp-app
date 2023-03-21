import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddGroupComponent } from './add-group.component';

describe('AddGroupComponent', () => {
    let component: AddGroupComponent;
    let fixture: ComponentFixture<AddGroupComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [AddGroupComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AddGroupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
