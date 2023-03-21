import { LoginPage } from './page-objects/login.po';
import { browser, by, protractor } from 'protractor';

describe('login page', () => {
    let page: LoginPage;

    function performLogin() {
        const loginBtn = page.getLoginButton();
        const EC = protractor.ExpectedConditions;
        const isClickable = EC.elementToBeClickable(loginBtn);

        browser.wait(isClickable, 7000);
        loginBtn.click();
        browser.waitForAngular();
    }

    function performLogout() {
        const userMenuBtn = browser.findElement(
            by.css('app-user-menu button.user-menu')
        );
        userMenuBtn.click();

        browser.executeScript(`
            const button = document.querySelector('.menu-action.logout');
            button.click();`);
    }

    beforeEach(() => {
        page = new LoginPage();
    });

    it('should display page title', async () => {
        await browser.waitForAngularEnabled(false);
        page.navigateToLogin();
        await browser.waitForAngularEnabled(true);
        expect(page.getPageTitle()).toEqual('Login here');
    });

    it('should log in', async () => {
        const username = page.getUsername();
        const password = page.getPassword();

        await browser.waitForAngularEnabled(false);
        page.navigateToLogin();

        // fill input fields
        username.sendKeys('root');
        password.sendKeys('test');

        await browser.waitForAngularEnabled(true);

        // check fields contain the entered value
        expect(username.getAttribute('value')).toEqual('root');
        expect(password.getAttribute('value')).toEqual('test');

        // log in
        await browser.waitForAngularEnabled(false);
        performLogin();
        await browser.waitForAngularEnabled(true);

        // check the user has been redirected to the dashboard
        expect(browser.driver.getCurrentUrl()).toMatch('/dashboard');
        expect(page.getDashboardTitle()).toContain('Welcome');

        // check the session
        await browser.waitForAngularEnabled(false);
        const value = browser.executeScript(
            "return window.localStorage.getItem('session');"
        );
        await browser.waitForAngularEnabled(true);

        expect(value).toBeTruthy();
        expect(value).toContain('"name":"root"');
    });

    // TODO: find another solution to target the logout button
    /* xit('should log out', async () => {

        const username = page.getUsername();
        const password = page.getPassword();

        await browser.waitForAngularEnabled(false);
        page.navigateToLogin();

        // fill input fields
        username.sendKeys('root');
        password.sendKeys('test');

        await browser.waitForAngularEnabled(true);

        // log in
        await browser.waitForAngularEnabled(false);
        performLogin();
        await browser.waitForAngularEnabled(true);

        // to FIX: log out > logout button cannot be found
        await browser.waitForAngularEnabled(false);
        performLogout();
        await browser.waitForAngularEnabled(true);

        expect(page.getPageTitle()).toEqual('Login here');
        expect(browser.getCurrentUrl()).toContain('/login?returnUrl=%2Fdashboard');

        // check the session
        const value = await browser.executeScript("return window.localStorage.getItem('session');");
        expect(value).toBe(null);
    }); */
});
