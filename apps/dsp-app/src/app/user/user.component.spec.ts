import { Component } from '@angular/core';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu';
import { MatLegacySnackBarModule as MatSnackBarModule } from '@angular/material/legacy-snack-bar';
import { MatLegacyTabsModule as MatTabsModule } from '@angular/material/legacy-tabs';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { TranslateModule } from '@ngx-translate/core';
import { TestConfig } from '@dsp-app/src/test.config';
import { AppConfigService } from '@dasch-swiss/vre/shared/app-config';
import {
    DspApiConfigToken,
    DspApiConnectionToken,
} from '@dasch-swiss/vre/shared/app-config';
import { DialogComponent } from '../main/dialog/dialog.component';
import { StatusComponent } from '../main/status/status.component';
import { ProjectsListComponent } from '../system/projects/projects-list/projects-list.component';
import { ProjectsComponent } from '../system/projects/projects.component';
import { AccountComponent } from './account/account.component';
import { CollectionListComponent } from './collection-list/collection-list.component';
import { ProfileComponent } from './profile/profile.component';
import { PasswordFormComponent } from './user-form/password-form/password-form.component';
import { UserComponent } from './user.component';

/**
 * test component to simulate child component, here progress-indicator from action module.
 */
@Component({
    selector: 'app-progress-indicator',
    template: '',
})
class TestProgressIndicatorComponent {}

describe('UserComponent', () => {
    let component: UserComponent;
    let fixture: ComponentFixture<UserComponent>;

    const route = 'account';

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [
                AccountComponent,
                CollectionListComponent,
                DialogComponent,
                StatusComponent,
                PasswordFormComponent,
                ProfileComponent,
                ProjectsComponent,
                ProjectsListComponent,
                UserComponent,
                TestProgressIndicatorComponent,
            ],
            imports: [
                BrowserAnimationsModule,
                MatButtonModule,
                MatChipsModule,
                MatDialogModule,
                MatDividerModule,
                MatFormFieldModule,
                MatIconModule,
                MatInputModule,
                MatMenuModule,
                MatSnackBarModule,
                MatTabsModule,
                ReactiveFormsModule,
                RouterTestingModule,
                TranslateModule.forRoot(),
            ],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: {
                        pathFromRoot: [
                            {
                                snapshot: {
                                    url: [],
                                },
                            },
                            {
                                snapshot: {
                                    url: [
                                        {
                                            path: route,
                                        },
                                    ],
                                },
                            },
                        ],
                    },
                },
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

    // mock localStorage
    beforeEach(() => {
        let store = {};

        spyOn(localStorage, 'getItem').and.callFake(
            (key: string): string => store[key] || null
        );
        spyOn(localStorage, 'removeItem').and.callFake((key: string): void => {
            delete store[key];
        });
        spyOn(localStorage, 'setItem').and.callFake(
            (key: string, value: string): string => (store[key] = <any>value)
        );
        spyOn(localStorage, 'clear').and.callFake(() => {
            store = {};
        });
    });

    beforeEach(() => {
        localStorage.setItem(
            'session',
            JSON.stringify(TestConfig.CurrentSession)
        );

        fixture = TestBed.createComponent(UserComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect<any>(localStorage.getItem('session')).toBe(
            JSON.stringify(TestConfig.CurrentSession)
        );
        expect(component).toBeTruthy();
    });
});
