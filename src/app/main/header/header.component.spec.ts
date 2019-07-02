import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterTestingModule } from '@angular/router/testing';
import { KuiActionModule } from '@knora/action';
import { KuiCoreConfig, KuiCoreConfigToken } from '@knora/core';
import { KuiSearchModule } from '@knora/search';
import { TranslateModule } from '@ngx-translate/core';
import { UserMenuComponent } from 'src/app/user/user-menu/user-menu.component';
import { SelectLanguageComponent } from '../select-language/select-language.component';
import { HeaderComponent } from './header.component';
import { InfoMenuComponent } from '../info-menu/info-menu.component';

describe('HeaderComponent', () => {
    let component: HeaderComponent;
    let fixture: ComponentFixture<HeaderComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                HeaderComponent,
                SelectLanguageComponent,
                InfoMenuComponent,
                UserMenuComponent
            ],
            imports: [
                KuiActionModule,
                KuiSearchModule,
                MatIconModule,
                MatListModule,
                MatMenuModule,
                MatToolbarModule,
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

    beforeEach(() => {
        fixture = TestBed.createComponent(HeaderComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
