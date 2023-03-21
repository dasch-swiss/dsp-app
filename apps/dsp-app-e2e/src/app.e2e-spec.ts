import { AppPage } from './page-objects/app.po';
import { browser, element, by, protractor } from 'protractor';

describe('landing page', () => {
    let page: AppPage;

    beforeEach(() => {
        page = new AppPage();
    });

    it('should display welcome title', async () => {
        await browser.waitForAngularEnabled(false);
        page.navigateTo();
        await browser.waitForAngularEnabled(true);
        expect(page.getMainTitle()).toEqual(
          'BRING ALL TOGETHER AND SIMPLIFY YOUR RESEARCH'
        );
    });

    it('should display help button', async () => {
        await browser.waitForAngularEnabled(false);
        page.navigateTo();
        await browser.waitForAngularEnabled(true);
        expect(page.getHelpButton().getText()).toEqual('Help');
    });

    it('should route to help page', async () => {
        const EC = protractor.ExpectedConditions;
        const isClickable = EC.elementToBeClickable(page.getHelpButton());

        await browser.waitForAngularEnabled(false);
        page.navigateTo();
        browser.wait(isClickable, 5000);
        page.getHelpButton().click();
        await browser.waitForAngularEnabled(true);
        expect(page.getHelpPageTitle()).toEqual('Need help?');
    });

    it('should display login button', async () => {
        await browser.waitForAngularEnabled(false);
        page.navigateTo();
        await browser.waitForAngularEnabled(true);
        expect(page.getLoginButton().getText()).toEqual('LOGIN');
    });

    it('should route to login page', async () => {
        await browser.waitForAngularEnabled(false);
        page.navigateTo();
        page.getLoginButton().click();
        await browser.waitForAngularEnabled(true);
        expect(page.getLoginPageTitle()).toEqual('Login here');
    });

    it('should display accept button in the cookie banner', async () => {
        await browser.waitForAngularEnabled(false);
        page.navigateTo();
        await browser.waitForAngularEnabled(true);
        expect(page.getAcceptCookieButton().getText()).toEqual('ACCEPT');
    });

    it('should go back to home page', async () => {
        await browser.waitForAngularEnabled(false);
        page.navigateTo();
        page.getAcceptCookieButton().click();
        await browser.waitForAngularEnabled(true);
        expect(page.getSubtitle()).toContain(
            'a software framework for storing'
        );
    });

    it('should display dasch logo', async () => {
        await browser.waitForAngularEnabled(false);
        page.navigateTo();
        await browser.waitForAngularEnabled(true);
        expect(page.getUnibasLogo().getAttribute('class')).toEqual(
            'logo logo-unibas'
        );
    });

    it('should route to the dasch website and check the URL', async () => {
        await browser.waitForAngularEnabled(false);
        page.navigateTo();
        await browser.waitForAngularEnabled(true);

        browser.getWindowHandle().then(function (parentGUID) {
            // click the link that opens in a new window
            element(
                by.css('img[src="/assets/images/logo-unibas.jpg"]')
            ).click();
            browser.sleep(5000);
            // get the all the session ids of the opened tabs
            browser.getAllWindowHandles().then(function (allGUID) {
                // console.log('Number of tabs opened: ' + allGUID.length);
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
                expect(browser.driver.getCurrentUrl()).toMatch(
                    'https://www.unibas.ch/de'
                );

                // close the new tab
                browser.close();

                // switch back to the parent tab
                browser.switchTo().window(parentGUID);
            });
        });
    });

    it('should display 5 dasch public projects', async () => {
        await browser.waitForAngularEnabled(false);
        page.navigateTo();
        await browser.waitForAngularEnabled(true);
        expect(page.getProjects().count()).toEqual(5);
    });

    it('should get the name of the second project of the list (which is BEOL project)', async () => {
        await browser.waitForAngularEnabled(false);
        page.navigateTo();
        await browser.waitForAngularEnabled(true);
        expect(page.getBEOLProjectTitle().getText()).toEqual(
            'Bernoulli-Euler Online'
        );
    });

    it('should route to the beol page', async () => {
        await browser.waitForAngularEnabled(false);
        page.navigateTo();
        page.getReadMoreBtnOfBEOL().click();
        await browser.waitForAngularEnabled(true);
        expect(page.getBEOLProjectPageTitle()).toEqual(
          'Bernoulli-Euler Online'
        );
    });
});
