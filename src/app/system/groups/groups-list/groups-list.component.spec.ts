import { Component, Input } from '@angular/core';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { GroupsListComponent } from './groups-list.component';


@Component({ selector: 'app-status', template: '' })
class MockStatusComponent {
    @Input() status: number;
    @Input() comment?: string;
    @Input() url?: string;
    @Input() representation?;
    constructor() { }
}

describe('GroupsListComponent', () => {
    let component: GroupsListComponent;
    let fixture: ComponentFixture<GroupsListComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [
                GroupsListComponent,
                MockStatusComponent
            ],
            imports: [
                RouterTestingModule
            ]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(GroupsListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
