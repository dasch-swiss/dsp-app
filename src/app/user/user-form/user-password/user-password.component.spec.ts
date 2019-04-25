import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import {
    MatFormFieldModule,
    MatIconModule,
    MatInputModule
} from '@angular/material';
import { KuiActionModule } from '@knora/action';
import { Session } from '@knora/authentication';
import { KuiCoreConfig, KuiCoreConfigToken, KuiCoreModule } from '@knora/core';
import { TranslateModule } from '@ngx-translate/core';
import { UserPasswordComponent } from './user-password.component';

describe('UserPasswordComponent', () => {
    let component: UserPasswordComponent;
    let fixture: ComponentFixture<UserPasswordComponent>;

    const currentTestSession: Session = {
        id: 1555226377250,
        user: {
            jwt: '',
            lang: 'en',
            name: 'root',
            projectAdmin: [],
            sysAdmin: false
        }
    };

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [UserPasswordComponent],
            imports: [
                KuiActionModule,
                KuiCoreModule,
                MatIconModule,
                MatInputModule,
                MatFormFieldModule,
                ReactiveFormsModule,
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

    // Mock localStorage
    beforeEach(() => {
        let store = {};

        spyOn(localStorage, 'getItem').and.callFake(
            (key: string): String => {
                return store[key] || null;
            }
        );
        spyOn(localStorage, 'removeItem').and.callFake(
            (key: string): void => {
                delete store[key];
            }
        );
        spyOn(localStorage, 'setItem').and.callFake(
            (key: string, value: string): string => {
                return (store[key] = <any>value);
            }
        );
        spyOn(localStorage, 'clear').and.callFake(() => {
            store = {};
        });
    });

    beforeEach(() => {
        localStorage.setItem('session', JSON.stringify(currentTestSession));

        fixture = TestBed.createComponent(UserPasswordComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect<any>(localStorage.getItem('session')).toBe(
            JSON.stringify(currentTestSession)
        );
        expect(component).toBeTruthy();
    });
});
