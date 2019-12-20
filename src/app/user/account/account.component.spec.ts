import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { KuiActionModule } from '@knora/action';
import { KnoraApiConnection } from '@knora/api';
import { KnoraApiConfigToken, KnoraApiConnectionToken, KuiCoreModule } from '@knora/core';
import { TranslateModule } from '@ngx-translate/core';
import { AppInitService } from 'src/app/app-init.service';
import { TestConfig } from 'test.config';
import { PasswordFormComponent } from '../user-form/password-form/password-form.component';
import { AccountComponent } from './account.component';


describe('AccountComponent', () => {
    let component: AccountComponent;
    let fixture: ComponentFixture<AccountComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                AccountComponent,
                PasswordFormComponent
            ],
            imports: [
                KuiActionModule,
                KuiCoreModule,
                MatButtonModule,
                MatDialogModule,
                MatFormFieldModule,
                MatIconModule,
                MatInputModule,
                ReactiveFormsModule,
                TranslateModule.forRoot()
            ],
            providers: [
                AppInitService,
                {
                    provide: KnoraApiConfigToken,
                    useValue: TestConfig.ApiConfig
                },
                {
                    provide: KnoraApiConnectionToken,
                    useValue: new KnoraApiConnection(TestConfig.ApiConfig)
                }
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AccountComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
