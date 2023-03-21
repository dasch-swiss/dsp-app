import { browser, by, element } from 'protractor';

export class LoginPage {
    navigateToLogin() {
        return browser.get('/login');
    }

    navigateToDashboard() {
        return browser.driver.get('/dashboard');
    }

    getPageTitle() {
        return element(by.css('app-login h2')).getText();
    }

    getDashboardTitle() {
        return element(by.css('app-dashboard h1')).getText();
    }

    getUsername() {
        return element(by.css('input[formControlName=username]'));
    }

    getPassword() {
        return element(by.css('input[formControlName=password]'));
    }

    getLoginButton() {
        return element(by.css('dsp-login-form form button'));
    }
}
