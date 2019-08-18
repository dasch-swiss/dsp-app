import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule, MatInputModule } from '@angular/material';
import { RouterTestingModule } from '@angular/router/testing';
import { KuiActionModule } from '@knora/action';
import { KuiCoreConfig, KuiCoreConfigToken, KuiCoreModule } from '@knora/core';
import { TranslateModule } from '@ngx-translate/core';
import { ListItemFormComponent } from '../list-item-form/list-item-form.component';
import { ListItemComponent } from '../list-item/list-item.component';
import { ListItemsFormComponent } from '../list-items-form/list-items-form.component';
import { ListInfoFormComponent } from './list-info-form.component';

describe('ListInfoFormComponent', () => {
    let component: ListInfoFormComponent;
    let fixture: ComponentFixture<ListInfoFormComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                ListInfoFormComponent,
                ListItemsFormComponent,
                ListItemComponent,
                ListItemFormComponent
            ],
            imports: [
                KuiActionModule,
                KuiCoreModule,
                MatIconModule,
                MatInputModule,
                ReactiveFormsModule,
                RouterTestingModule,
                TranslateModule.forRoot()
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
        fixture = TestBed.createComponent(ListInfoFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
