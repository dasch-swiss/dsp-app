import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTreeModule } from '@angular/material/tree';
import { KuiActionModule } from '@knora/action';
import { TranslateModule } from '@ngx-translate/core';
import { ListInfoFormComponent } from 'src/app/project/list/list-info-form/list-info-form.component';
import { ListItemFormComponent } from 'src/app/project/list/list-item-form/list-item-form.component';
import { ListItemComponent } from 'src/app/project/list/list-item/list-item.component';
import { OntologyFormComponent } from 'src/app/project/ontology/ontology-form/ontology-form.component';
import { SourceTypeFormComponent } from 'src/app/project/ontology/source-type-form/source-type-form.component';
import { SourceTypePropertyComponent } from 'src/app/project/ontology/source-type-form/source-type-property/source-type-property.component';
import { ProjectFormComponent } from 'src/app/project/project-form/project-form.component';
import { MembershipComponent } from 'src/app/user/membership/membership.component';
import { PasswordFormComponent } from 'src/app/user/user-form/password-form/password-form.component';
import { UserFormComponent } from 'src/app/user/user-form/user-form.component';
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
                MembershipComponent,
                PasswordFormComponent,
                ProjectFormComponent,
                ListItemComponent,
                ListItemFormComponent,
                ListInfoFormComponent,
                OntologyFormComponent,
                SourceTypeFormComponent,
                SourceTypePropertyComponent
            ],
            imports: [
                KuiActionModule,
                MatAutocompleteModule,
                MatButtonModule,
                MatChipsModule,
                MatDialogModule,
                MatDividerModule,
                MatFormFieldModule,
                MatIconModule,
                MatInputModule,
                MatListModule,
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
