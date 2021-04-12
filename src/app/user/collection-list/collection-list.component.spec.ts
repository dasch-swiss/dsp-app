import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { DspActionModule } from '@dasch-swiss/dsp-ui';
import { CollectionListComponent } from './collection-list.component';

describe('CollectionListComponent', () => {
    let component: CollectionListComponent;
    let fixture: ComponentFixture<CollectionListComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [CollectionListComponent],
            imports: [
                DspActionModule
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(CollectionListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
