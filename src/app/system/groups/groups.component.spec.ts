import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { GroupsListComponent } from './groups-list/groups-list.component';
import { GroupsComponent } from './groups.component';
import { DspActionModule } from '@dasch-swiss/dsp-ui';

describe('GroupsComponent', () => {
    let component: GroupsComponent;
    let fixture: ComponentFixture<GroupsComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                GroupsComponent,
                GroupsListComponent
            ],
            imports: [
                DspActionModule,
                RouterTestingModule
            ]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(GroupsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
