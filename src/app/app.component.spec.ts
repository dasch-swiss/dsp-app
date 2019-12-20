import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterTestingModule } from '@angular/router/testing';
import { KuiActionModule } from '@knora/action';
import { KnoraApiConnection } from '@knora/api';
import { KnoraApiConfigToken, KnoraApiConnectionToken } from '@knora/core';
import { KuiSearchModule } from '@knora/search';
import { TranslateModule } from '@ngx-translate/core';
import { TestConfig } from 'test.config';
import { AppInitService } from './app-init.service';
import { AppComponent } from './app.component';
import { HeaderComponent } from './main/header/header.component';
import { SelectLanguageComponent } from './main/select-language/select-language.component';
import { UserMenuComponent } from './user/user-menu/user-menu.component';

describe('AppComponent', () => {

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                AppComponent,
                HeaderComponent,
                SelectLanguageComponent,
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

    it('should create the app', () => {
        const fixture = TestBed.createComponent(AppComponent);
        const app = fixture.debugElement.componentInstance;
        expect(app).toBeTruthy();
    });
});
