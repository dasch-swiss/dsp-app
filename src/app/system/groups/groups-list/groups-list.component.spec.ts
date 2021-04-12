import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { DspActionModule } from '@dasch-swiss/dsp-ui';
import { GroupsListComponent } from './groups-list.component';

describe('GroupsListComponent', () => {
    let component: GroupsListComponent;
    let fixture: ComponentFixture<GroupsListComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [
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
        fixture = TestBed.createComponent(GroupsListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
