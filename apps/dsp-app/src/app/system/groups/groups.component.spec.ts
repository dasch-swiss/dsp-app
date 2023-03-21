import { Component } from '@angular/core';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { MatLegacySnackBarModule as MatSnackBarModule } from '@angular/material/legacy-snack-bar';
import { RouterTestingModule } from '@angular/router/testing';
import { GroupsListComponent } from './groups-list/groups-list.component';

/**
 * mocks GroupsComponent
 */
@Component({ selector: 'app-groups', template: '' })
class MockGroupsComponent {}

describe('GroupsComponent', () => {
    let component: MockGroupsComponent;
    let fixture: ComponentFixture<MockGroupsComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [GroupsListComponent],
            imports: [MatDialogModule, MatSnackBarModule, RouterTestingModule],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(MockGroupsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
