import { HttpClientModule } from '@angular/common/http';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterTestingModule } from '@angular/router/testing';
import { KuiActionModule } from '@knora/action';
import { KnoraApiConnection } from '@knora/api';
import { KnoraApiConfigToken, KnoraApiConnectionToken, KuiCoreModule } from '@knora/core';
import { KuiSearchModule } from '@knora/search';
import { TranslateModule } from '@ngx-translate/core';
import { AppInitService } from 'src/app/app-init.service';
import { UserMenuComponent } from 'src/app/user/user-menu/user-menu.component';
import { TestConfig } from 'test.config';
import { SelectLanguageComponent } from '../select-language/select-language.component';
import { HeaderComponent } from './header.component';
import { By } from '@angular/platform-browser';

describe('HeaderComponent', () => {
    let component: HeaderComponent;
    let fixture: ComponentFixture<HeaderComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                HeaderComponent,
                SelectLanguageComponent,
                UserMenuComponent
            ],
            imports: [
                HttpClientModule,
                KuiActionModule,
                KuiCoreModule,
                KuiSearchModule,
                MatIconModule,
                MatListModule,
                MatMenuModule,
                MatToolbarModule,
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

    beforeEach(() => {
        fixture = TestBed.createComponent(HeaderComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should display the lamp icon button', () => {
        const lampIconBtn = fixture.debugElement.query(By.css('button.home-button'));
        expect(lampIconBtn).toBeDefined();
    });

    it('should display the link to the help page', () => {
        const helpBtn = fixture.debugElement.query(By.css('button.help'));
        expect(helpBtn).toBeDefined();

        const helpBtnLabel = helpBtn.nativeElement.innerHTML;
        expect(helpBtnLabel).toEqual('Help');
    });

    it('should display the login button', () => {
        const loginBtn = fixture.debugElement.query(By.css('button.login-button'));
        expect(loginBtn).toBeDefined();

        const loginBtnLabel = loginBtn.nativeElement.innerHTML;
        expect(loginBtnLabel).toEqual('LOGIN');
    });

    it('should display the search panel', () => {
        const searchPanel = fixture.debugElement.query(By.css('kui-search-panel'));
        expect(searchPanel).toBeDefined();
    });

});
