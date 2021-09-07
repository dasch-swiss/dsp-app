import { Component } from '@angular/core';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { AppInitService } from 'src/app/app-init.service';
import { TestConfig } from 'test.config';
import { DspApiConfigToken, DspApiConnectionToken } from '../declarations/dsp-api-tokens';
import { LoginComponent } from './login.component';

/**
 * test host component to simulate parent component.
 */
@Component({
    template: '<app-login></app-login>'
})
class TestHostLoginComponent { }

/**
 * test component to simulate child component.
 */
@Component({
    selector: 'app-login-form',
    template: ''
})
class TestLoginFormComponent { }

describe('LoginComponent', () => {
    let testHostComponent: TestHostLoginComponent;
    let testHostFixture: ComponentFixture<TestHostLoginComponent>;
    let hostCompDe;
    let loginComponentDe;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [
                LoginComponent,
                TestHostLoginComponent,
                TestLoginFormComponent
            ],
            imports: [
                RouterTestingModule
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

    beforeEach(() => {
        testHostFixture = TestBed.createComponent(TestHostLoginComponent);
        testHostComponent = testHostFixture.componentInstance;
        testHostFixture.detectChanges();

        hostCompDe = testHostFixture.debugElement;
        loginComponentDe = hostCompDe.query(By.directive(LoginComponent));

        expect(testHostComponent).toBeTruthy();
    });

    it('should create', () => {
        expect(testHostComponent).toBeTruthy();
    });

    it('should define the login form', () => {
        const loginForm = testHostFixture.debugElement.query(By.css('app-login app-login-form'));
        expect(loginForm).toBeTruthy();
    });

});
