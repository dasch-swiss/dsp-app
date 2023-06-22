import { CommonModule } from '@angular/common';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatLegacyAutocompleteModule as MatAutocompleteModule } from '@angular/material/legacy-autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import {
    MatDialogModule,
    MatDialogRef,
    MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatListModule } from '@angular/material/list';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTreeModule } from '@angular/material/tree';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule } from '@ngx-translate/core';
import { ListInfoFormComponent } from '@dsp-app/src/app/project/list/list-info-form/list-info-form.component';
import { ListItemFormComponent } from '@dsp-app/src/app/project/list/list-item-form/list-item-form.component';
import { ListItemComponent } from '@dsp-app/src/app/project/list/list-item/list-item.component';
import { OntologyFormComponent } from '@dsp-app/src/app/project/ontology/ontology-form/ontology-form.component';
import { PropertyFormComponent } from '@dsp-app/src/app/project/ontology/property-form/property-form.component';
import { ResourceClassFormComponent } from '@dsp-app/src/app/project/ontology/resource-class-form/resource-class-form.component';
import { ProjectFormComponent } from '@dsp-app/src/app/project/project-form/project-form.component';
import { MembershipComponent } from '@dsp-app/src/app/user/membership/membership.component';
import { PasswordFormComponent } from '@dsp-app/src/app/user/user-form/password-form/password-form.component';
import { UserFormComponent } from '@dsp-app/src/app/user/user-form/user-form.component';
import { StatusComponent } from '../status/status.component';
import { DialogHeaderComponent } from './dialog-header/dialog-header.component';
import { DialogComponent } from './dialog.component';

describe('DialogComponent', () => {
    let component: DialogComponent;
    let fixture: ComponentFixture<DialogComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [
                DialogComponent,
                DialogHeaderComponent,
                StatusComponent,
                UserFormComponent,
                MembershipComponent,
                PasswordFormComponent,
                ProjectFormComponent,
                ListItemComponent,
                ListItemFormComponent,
                ListInfoFormComponent,
                OntologyFormComponent,
                ResourceClassFormComponent,
                PropertyFormComponent,
            ],
            imports: [
                CommonModule,
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
                MatTooltipModule,
                MatTreeModule,
                ReactiveFormsModule,
                RouterTestingModule,
                TranslateModule.forRoot(),
            ],
            providers: [
                { provide: MatDialogRef, useValue: {} },
                { provide: MAT_DIALOG_DATA, useValue: [] },
            ],
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
