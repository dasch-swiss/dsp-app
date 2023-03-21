import { browser } from 'protractor';
import { HelpPage } from './page-objects/help.po';
import packageJson from '../../../package.json';

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
                expect(browser.driver.getCurrentUrl()).toMatch(
                    'https://docs.dasch.swiss/user-guide/project/'
                );

                // close the new tab
                browser.close();

                // switch back to the parent tab
                browser.switchTo().window(parentGUID);
            });
        });
    });

    it('should route to dsp-app release note page', async () => {
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
                expect(browser.driver.getCurrentUrl()).toMatch(
                    'https://github.com/dasch-swiss/' +
                        packageJson.name +
                        '/releases/tag/v' +
                        packageJson.version
                );

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
                expect(browser.driver.getCurrentUrl()).toMatch(
                    'https://github.com/dasch-swiss/Sipi/releases/tag/v2.0.0'
                );

                // close the new tab
                browser.close();

                // switch back to the parent tab
                browser.switchTo().window(parentGUID);
            });
        });
    });

    it('should have a mailto link to support@dasch.swiss', async () => {
        await browser.waitForAngularEnabled(false);
        page.navigateTo();
        await browser.waitForAngularEnabled(true);

        browser.getWindowHandle().then(function (parentGUID) {
            // click the link that opens in a new window
            page.getDaschContactButton().click();
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
                // --> TODO: why is still working? The address doesn't exist anymore. It was replaced by "mailto:support@dasch.swiss?subject=...."
                expect(browser.driver.getCurrentUrl()).toMatch(
                    'https://discuss.dasch.swiss/'
                );
                // todo: check if link is still alive or broken

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
                expect(browser.driver.getCurrentUrl()).toMatch(
                    'https://dasch.ch/'
                );

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
                expect(browser.driver.getCurrentUrl()).toMatch(
                    'https://github.com/dasch-swiss'
                );

                // close the new tab
                browser.close();

                // switch back to the parent tab
                browser.switchTo().window(parentGUID);
            });
        });
    });
});
