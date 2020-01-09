import { AppPage } from './app.po';
import { browser, element, by } from 'protractor';

describe('logged out dashboard', () => {
    let page: AppPage;

    beforeEach(() => {
        page = new AppPage();
    });

    it('should display welcome title', () => {
        page.navigateTo();
        expect(page.getMainTitle()).toEqual('BRING ALL TOGETHER AND SIMPLIFY YOUR RESEARCH');
    });

    it('should display help button', () => {
        page.navigateTo();
        expect(page.getHelpButton().getText()).toEqual('Help');
    });

    it('should route to help page', () => {
        page.navigateTo();
        page.getHelpButton().click();
        expect(page.getHelpPageTitle()).toEqual('Need help?');
    });

    it('should display login button', () => {
        page.navigateTo();
        expect(page.getLoginButton().getText()).toEqual('LOGIN');
    });

    it('should route to login page', () => {
        page.navigateTo();
        page.getLoginButton().click();
        expect(page.getLoginPageTitle()).toEqual('Login here');
    });

    it('should display accept button in the cookie banner', () => {
        page.navigateTo();
        expect(page.getAcceptCookieButton().getText()).toEqual('ACCEPT');
    });

    it('should go back to home page', () => {
        page.navigateTo();
        page.getAcceptCookieButton().click();
        expect(page.getSubtitle()).toContain('a software framework for storing');
    });

    it('should display dasch logo', () => {
        page.navigateTo();
        expect(page.getUnibasLogo().getAttribute('class')).toEqual('logo logo-unibas');
    });

    it('should route to the dasch website and check the URL', () => {
        page.navigateTo();

        browser.getWindowHandle().then(function (parentGUID) {
            // click the link that opens in a new window
            element(by.css('img[src="/assets/images/logo-unibas.jpg"]')).click();
            browser.sleep(5000);
            // get the all the session ids of the opened tabs
            browser.getAllWindowHandles().then(function (allGUID) {
                console.log('Number of tabs opened: ' + allGUID.length);
                // iterate through the tabs
                for (const guid of allGUID) {
                    // find the new browser tab
                    if (guid !== parentGUID) {
                        // switch to the tab
                        browser.switchTo().window(guid);
                        // break the loop
                        break;
                    }
                }
                // perform here any actions needed on the new tab
                expect(browser.driver.getCurrentUrl()).toMatch('https://www.unibas.ch/de');

                // close the new tab
                browser.close();

                // switch back to the parent tab
                browser.switchTo().window(parentGUID);
            });
        });
    });
});
