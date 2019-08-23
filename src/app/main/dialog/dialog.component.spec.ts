import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule, MatChipsModule, MatDialogModule, MatDialogRef, MatDividerModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule, MatSlideToggleModule, MatTreeModule, MAT_DIALOG_DATA } from '@angular/material';
import { KuiActionModule } from '@knora/action';
import { TranslateModule } from '@ngx-translate/core';
import { ListInfoFormComponent } from 'src/app/project/list/list-info-form/list-info-form.component';
import { ListItemFormComponent } from 'src/app/project/list/list-item-form/list-item-form.component';
import { ListItemComponent } from 'src/app/project/list/list-item/list-item.component';
import { ListItemsFormComponent } from 'src/app/project/list/list-items-form/list-items-form.component';
import { ListItemsComponent } from 'src/app/project/list/list-items/list-items.component';
import { ProjectFormComponent } from 'src/app/project/project-form/project-form.component';
import { UserFormComponent } from 'src/app/user/user-form/user-form.component';
import { UserPasswordComponent } from 'src/app/user/user-form/user-password/user-password.component';
import { DialogHeaderComponent } from './dialog-header/dialog-header.component';
import { DialogComponent } from './dialog.component';

describe('DialogComponent', () => {
    let component: DialogComponent;
    let fixture: ComponentFixture<DialogComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                DialogComponent,
                DialogHeaderComponent,
                UserFormComponent,
                UserPasswordComponent,
                ProjectFormComponent,
                ListItemComponent,
                ListItemFormComponent,
                ListItemsComponent,
                ListItemsFormComponent,
                ListInfoFormComponent
            ],
            imports: [
                KuiActionModule,
                MatButtonModule,
                MatChipsModule,
                MatDialogModule,
                MatDividerModule,
                MatFormFieldModule,
                MatIconModule,
                MatInputModule,
                MatSelectModule,
                MatSlideToggleModule,
                MatTreeModule,
                ReactiveFormsModule,
                TranslateModule.forRoot()
            ],
            providers: [
                { provide: MatDialogRef, useValue: {} },
                { provide: MAT_DIALOG_DATA, useValue: [] }
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(DialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
