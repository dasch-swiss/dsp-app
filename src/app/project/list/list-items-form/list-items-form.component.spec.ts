import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule, MatInputModule } from '@angular/material';
import { KuiActionModule } from '@knora/action';
import { KuiCoreConfig, KuiCoreConfigToken, KuiCoreModule } from '@knora/core';
import { ListItemFormComponent } from '../list-item-form/list-item-form.component';
import { ListItemComponent } from '../list-item/list-item.component';
import { ListItemsFormComponent } from './list-items-form.component';

describe('ListItemsFormComponent', () => {
    let component: ListItemsFormComponent;
    let fixture: ComponentFixture<ListItemsFormComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                ListItemsFormComponent,
                ListItemComponent,
                ListItemFormComponent
            ],
            imports: [
                KuiActionModule,
                KuiCoreModule,
                MatIconModule,
                MatInputModule,
                ReactiveFormsModule
            ],
            providers: [
                {
                    provide: KuiCoreConfigToken,
                    useValue: KuiCoreConfig
                }
            ]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ListItemsFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
