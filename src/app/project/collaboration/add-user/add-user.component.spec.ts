import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatDialogModule, MatIconModule, MatInputModule } from '@angular/material';
import { RouterTestingModule } from '@angular/router/testing';
import { KuiActionModule } from '@knora/action';
import { KuiCoreConfig, KuiCoreConfigToken, KuiCoreModule } from '@knora/core';
import { TranslateModule } from '@ngx-translate/core';
import { AddUserComponent } from './add-user.component';

describe('AddUserComponent', () => {
    let component: AddUserComponent;
    let fixture: ComponentFixture<AddUserComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [AddUserComponent],
            imports: [
                KuiActionModule,
                KuiCoreModule,
                MatAutocompleteModule,
                MatDialogModule,
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
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AddUserComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
