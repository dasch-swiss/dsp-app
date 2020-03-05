import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { KuiActionModule } from '@knora/action';

import { CollectionListComponent } from './collection-list.component';

describe('CollectionListComponent', () => {
    let component: CollectionListComponent;
    let fixture: ComponentFixture<CollectionListComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [CollectionListComponent],
            imports: [
                KuiActionModule
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
