import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, TestBed } from '@angular/core/testing';
import { MatIconModule, MatListModule, MatMenuModule, MatToolbarModule } from '@angular/material';
import { RouterTestingModule } from '@angular/router/testing';
import { KuiActionModule } from '@knora/action';
import { KuiCoreConfig, KuiCoreConfigToken } from '@knora/core';
import { KuiSearchModule } from '@knora/search';
import { TranslateModule } from '@ngx-translate/core';
import { AppComponent } from './app.component';
import { HeaderComponent } from './main/header/header.component';
import { SelectLanguageComponent } from './main/select-language/select-language.component';
import { UserMenuComponent } from './user/user-menu/user-menu.component';
import { InfoMenuComponent } from './main/info-menu/info-menu.component';

describe('AppComponent', () => {
    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                AppComponent,
                HeaderComponent,
                SelectLanguageComponent,
                InfoMenuComponent,
                UserMenuComponent
            ],
            imports: [
                HttpClientTestingModule,
                MatIconModule,
                MatListModule,
                MatMenuModule,
                MatToolbarModule,
                KuiActionModule,
                KuiSearchModule,
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

    it('should create the app', () => {
        const fixture = TestBed.createComponent(AppComponent);
        const app = fixture.debugElement.componentInstance;
        expect(app).toBeTruthy();
    });
});
