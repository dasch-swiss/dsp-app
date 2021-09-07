import { HttpClientModule } from '@angular/common/http';
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { DspActionModule } from '@dasch-swiss/dsp-ui';
import { TranslateModule } from '@ngx-translate/core';
import { AppInitService } from 'src/app/app-init.service';
import { ComponentCommunicationEventService, EmitEvent, Events } from 'src/app/main/services/component-communication-event.service';
import { UserMenuComponent } from 'src/app/user/user-menu/user-menu.component';
import { TestConfig } from 'test.config';
import { DspApiConfigToken, DspApiConnectionToken } from '../declarations/dsp-api-tokens';
import { SelectLanguageComponent } from '../select-language/select-language.component';
import { HeaderComponent } from './header.component';

/**
 * test host component to simulate parent component.
 */
@Component({
    template: '<app-header #header></app-header>'
})
class TestHostHeaderComponent {
    @ViewChild('header') headerComp: HeaderComponent;
}

/**
 * test component to simulate search panel component.
 */
@Component({
    selector: 'app-search-panel',
    template: ''
})
class TestSearchPanelComponent {
    @Input() projectfilter?: boolean = false;
    @Input() filterbyproject?: string;
    @Input() limitToProject?: string;
    @Input() advanced?: boolean = false;
    @Input() expert?: boolean = false;
}

describe('HeaderComponent', () => {
    let testHostComponent: TestHostHeaderComponent;
    let testHostFixture: ComponentFixture<TestHostHeaderComponent>;
    let hostCompDe;
    let headerCompDe;

    let componentCommsService: ComponentCommunicationEventService;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [
                HeaderComponent,
                TestHostHeaderComponent,
                TestSearchPanelComponent,
                SelectLanguageComponent,
                UserMenuComponent
            ],
            imports: [
                BrowserAnimationsModule,
                HttpClientModule,
                DspActionModule,
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
                    provide: DspApiConfigToken,
                    useValue: TestConfig.ApiConfig
                },
                {
                    provide: DspApiConnectionToken,
                    useValue: new KnoraApiConnection(TestConfig.ApiConfig)
                },
                ComponentCommunicationEventService
            ]
        }).compileComponents();

        componentCommsService = TestBed.inject(ComponentCommunicationEventService);
    }));

    beforeEach(() => {
        testHostFixture = TestBed.createComponent(TestHostHeaderComponent);
        testHostComponent = testHostFixture.componentInstance;
        testHostFixture.detectChanges();

        hostCompDe = testHostFixture.debugElement;
        headerCompDe = hostCompDe.query(By.directive(HeaderComponent));
    });

    it('should create', () => {
        expect(testHostComponent).toBeTruthy();
    });

    it('should display the lamp icon button', () => {
        const lampIconBtn = testHostFixture.debugElement.query(By.css('button.home-button'));
        expect(lampIconBtn).toBeTruthy();
    });

    it('should display the link to the help page', () => {
        const helpBtn = testHostFixture.debugElement.query(By.css('button.help'));
        expect(helpBtn).toBeTruthy();

        const helpBtnLabel = helpBtn.nativeElement.innerHTML;
        expect(helpBtnLabel).toEqual('Help');
    });

    it('should display the login button', () => {
        const loginBtn = testHostFixture.debugElement.query(By.css('button.login-button'));
        expect(loginBtn).toBeTruthy();

        const loginBtnLabel = loginBtn.nativeElement.innerHTML;
        expect(loginBtnLabel).toEqual('LOGIN');
    });

    it('should display search panel', () => {
        const searchPanel = testHostFixture.debugElement.query(By.css('app-search-panel'));
        expect(searchPanel).toBeTruthy();
    });

    it('should subscribe to component communication when the loginSuccess event is emitted', () => {
        componentCommsService.emit(new EmitEvent(Events.loginSuccess));
        testHostFixture.detectChanges();
        expect(testHostComponent.headerComp.componentCommsSubscription.closed).toBe(false);
    });

    it('should unsubscribe from changes on destruction', () => {

        expect(testHostComponent.headerComp.componentCommsSubscription.closed).toBe(false);

        testHostFixture.destroy();

        expect(testHostComponent.headerComp.componentCommsSubscription.closed).toBe(true);

    });

});

