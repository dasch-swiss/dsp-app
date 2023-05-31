import { Component } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyListModule as MatListModule } from '@angular/material/legacy-list';
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu';
import { MatLegacySnackBarModule as MatSnackBarModule } from '@angular/material/legacy-snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { AppConfigService } from '@dasch-swiss/vre/shared/app-config';
import {
    DspApiConfigToken,
    DspApiConnectionToken,
} from '@dasch-swiss/vre/shared/app-config';
import { DatadogRumService } from '@dsp-app/src/app/main/services/datadog-rum.service';
import { SessionService } from '@dsp-app/src/app/main/services/session.service';
import { TestConfig } from '@dsp-app/src/test.config';
import { UserMenuComponent } from './user-menu.component';

/**
 * test component to simulate login form component.
 */
@Component({
    selector: 'app-login-form',
    template: '',
})
class TestLoginFormComponent {}

describe('UserMenuComponent', () => {
    let component: UserMenuComponent;
    let fixture: ComponentFixture<UserMenuComponent>;

    const datadogRumServiceSpy = jasmine.createSpyObj('datadogRumService', [
        'setActiveUser',
        'removeActiveUser',
    ]);

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [UserMenuComponent, TestLoginFormComponent],
            imports: [
                BrowserAnimationsModule,
                MatButtonModule,
                MatDialogModule,
                MatIconModule,
                MatListModule,
                MatMenuModule,
                MatSnackBarModule,
                RouterTestingModule,
            ],
            providers: [
                AppConfigService,
                SessionService,
                {
                    provide: DspApiConfigToken,
                    useValue: TestConfig.ApiConfig,
                },
                {
                    provide: DspApiConnectionToken,
                    useValue: new KnoraApiConnection(TestConfig.ApiConfig),
                },
                {
                    provide: DatadogRumService,
                    useValue: datadogRumServiceSpy,
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

        fixture = TestBed.createComponent(UserMenuComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect<any>(localStorage.getItem('session')).toBe(
            JSON.stringify(TestConfig.CurrentSession)
        );
        expect(component).toBeTruthy();
    });

    // it('should display the login button', () => {
    //     const loginBtn = fixture.debugElement.query(By.css('button.login-button'));
    //     expect(loginBtn).toBeTruthy();

    //     const loginBtnLabel = loginBtn.nativeElement.innerHTML;
    //     expect(loginBtnLabel).toEqual('LOGIN');
    // });

    // todo: should display the different menu sections (system displayed only for system admin)
});
