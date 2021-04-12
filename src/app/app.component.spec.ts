import { HttpClientTestingModule } from '@angular/common/http/testing';
import { waitForAsync, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterTestingModule } from '@angular/router/testing';
import { KnoraApiConnection } from '@dasch-swiss/dsp-js';
import {
    AppInitService,
    DspActionModule,
    DspApiConfigToken,
    DspApiConnectionToken,
    DspSearchModule
} from '@dasch-swiss/dsp-ui';
import { TranslateModule } from '@ngx-translate/core';
import { TestConfig } from 'test.config';
import { AppComponent } from './app.component';
import { HeaderComponent } from './main/header/header.component';
import { SelectLanguageComponent } from './main/select-language/select-language.component';
import { UserMenuComponent } from './user/user-menu/user-menu.component';

describe('AppComponent', () => {

    beforeEach(waitForAsync(() => {
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
                DspActionModule,
                DspSearchModule,
                RouterTestingModule,
                TranslateModule.forRoot()
            ],
            providers: [
                AppInitService,
                {
                    provide: DspApiConfigToken,
                    useValue: TestConfig.ApiConfig
                },
                {
                    provide: DspApiConnectionToken,
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
