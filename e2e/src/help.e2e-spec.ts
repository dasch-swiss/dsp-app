import { HelpPage } from './page-objects/help.po';
import { browser } from 'protractor';

const { version: appVersion, name: appName } = require('../../package.json');

describe('help page', () => {
    let page: HelpPage;

    beforeEach(() => {
        page = new HelpPage();
    });

    it('should display page title', async () => {
        await browser.waitForAngularEnabled(false);
        page.navigateTo();
        await browser.waitForAngularEnabled(true);

        expect(page.getPageTitle()).toEqual('Need help?');
    });

    it('should route to project management documentation', async () => {
        await browser.waitForAngularEnabled(false);
        page.navigateTo();
        await browser.waitForAngularEnabled(true);

        browser.getWindowHandle().then(function (parentGUID) {
            // click the link that opens in a new window
            page.getProjManagementDocButton().click();
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
                expect(browser.driver.getCurrentUrl()).toMatch('https://docs.dasch.swiss/user-guide/project/');

                // close the new tab
                browser.close();

                // switch back to the parent tab
                browser.switchTo().window(parentGUID);
            });
        });
    });

    it('should route to knora-app release note page', async () => {
        await browser.waitForAngularEnabled(false);
        page.navigateTo();
        await browser.waitForAngularEnabled(true);

        browser.getWindowHandle().then(function (parentGUID) {
            // click the link that opens in a new window
            page.getKnoraAppReleaseNotesButton().click();
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
                expect(browser.driver.getCurrentUrl()).toMatch('https://github.com/dasch-swiss/' + appName + '/releases/tag/v' + appVersion);

                // close the new tab
                browser.close();

                // switch back to the parent tab
                browser.switchTo().window(parentGUID);
            });
        });
    });

    it('should route to sipi release note page', async () => {
        await browser.waitForAngularEnabled(false);
        page.navigateTo();
        await browser.waitForAngularEnabled(true);

        browser.getWindowHandle().then(function (parentGUID) {
            // click the link that opens in a new window
            page.getSipiReleaseNotesButton().click();
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
                expect(browser.driver.getCurrentUrl()).toMatch('https://github.com/dasch-swiss/Sipi/releases/tag/v2.0.0');

                // close the new tab
                browser.close();

                // switch back to the parent tab
                browser.switchTo().window(parentGUID);
            });
        });
    });

    it('should route to the dasch forum', async () => {
        await browser.waitForAngularEnabled(false);
        page.navigateTo();
        await browser.waitForAngularEnabled(true);

        browser.getWindowHandle().then(function (parentGUID) {
            // click the link that opens in a new window
            page.getDaschForumButton().click();
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
                expect(browser.driver.getCurrentUrl()).toMatch('https://discuss.dasch.swiss/');

                // close the new tab
                browser.close();

                // switch back to the parent tab
                browser.switchTo().window(parentGUID);
            });
        });
    });

    it('should route to the DaSCH website', async () => {
        await browser.waitForAngularEnabled(false);
        page.navigateTo();
        await browser.waitForAngularEnabled(true);

        browser.getWindowHandle().then(function (parentGUID) {
            // click the link that opens in a new window
            page.getDaschSwissButton().click();
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
                expect(browser.driver.getCurrentUrl()).toMatch('https://dasch.swiss/');

                // close the new tab
                browser.close();

                // switch back to the parent tab
                browser.switchTo().window(parentGUID);
            });
        });
    });

    it('should route to the dasch-swiss Github repo', async () => {
        await browser.waitForAngularEnabled(false);
        page.navigateTo();
        await browser.waitForAngularEnabled(true);

        browser.getWindowHandle().then(function (parentGUID) {
            // click the link that opens in a new window
            page.getGithubContributeButton().click();
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
                expect(browser.driver.getCurrentUrl()).toMatch('https://github.com/dasch-swiss');

                // close the new tab
                browser.close();

                // switch back to the parent tab
                browser.switchTo().window(parentGUID);
            });
        });
    });

});
