import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { RouterTestingModule } from '@angular/router/testing';
import { KuiActionModule } from '@knora/action';
import { KnoraApiConnection } from '@knora/api';
import { KnoraApiConfigToken, KnoraApiConnectionToken, KuiCoreModule, Session } from '@knora/core';
import { AppInitService } from 'src/app/app-init.service';
import { TestConfig } from 'test.config';
import { UserMenuComponent } from './user-menu.component';

describe('UserMenuComponent', () => {
    let component: UserMenuComponent;
    let fixture: ComponentFixture<UserMenuComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [UserMenuComponent],
            imports: [
                KuiActionModule,
                KuiCoreModule,
                MatButtonModule,
                MatIconModule,
                MatListModule,
                MatMenuModule,
                RouterTestingModule
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

    // mock localStorage
    beforeEach(() => {
        let store = {};

        spyOn(localStorage, 'getItem').and.callFake(
            (key: string): string => {
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
        localStorage.setItem('session', JSON.stringify(TestConfig.CurrentSession));

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
});
