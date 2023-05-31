import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacySnackBarModule as MatSnackBarModule } from '@angular/material/legacy-snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { TranslateModule } from '@ngx-translate/core';
import { AppConfigService } from '@dasch-swiss/vre/shared/app-config';
import {
    DspApiConfigToken,
    DspApiConnectionToken,
} from '@dasch-swiss/vre/shared/app-config';
import { DialogComponent } from '@dsp-app/src/app/main/dialog/dialog.component';
import { StatusComponent } from '@dsp-app/src/app/main/status/status.component';
import { TestConfig } from '@dsp-app/src/test.config';
import { PasswordFormComponent } from './password-form.component';

describe('PasswordFormComponent', () => {
    let component: PasswordFormComponent;
    let fixture: ComponentFixture<PasswordFormComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [
                PasswordFormComponent,
                DialogComponent,
                StatusComponent,
            ],
            imports: [
                BrowserAnimationsModule,
                MatDialogModule,
                MatIconModule,
                MatInputModule,
                MatFormFieldModule,
                MatSnackBarModule,
                ReactiveFormsModule,
                RouterTestingModule,
                TranslateModule.forRoot(),
            ],
            providers: [
                AppConfigService,
                {
                    provide: DspApiConfigToken,
                    useValue: TestConfig.ApiConfig,
                },
                {
                    provide: DspApiConnectionToken,
                    useValue: new KnoraApiConnection(TestConfig.ApiConfig),
                },
            ],
        }).compileComponents();
    }));

    beforeEach(() => {
        localStorage.setItem(
            'session',
            JSON.stringify(TestConfig.CurrentSession)
        );

        fixture = TestBed.createComponent(PasswordFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
