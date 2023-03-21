import { browser } from 'protractor';
import { FooterPage } from './page-objects/footer.po';

describe('footer', () => {
    let footer: FooterPage;

    beforeEach(() => {
        footer = new FooterPage();
    });

    it('should start the description with "DSP-APP is built with"', async () => {
        await browser.waitForAngularEnabled(false);
        footer.navigateTo();
        await browser.waitForAngularEnabled(true);
        expect(footer.getFooterText()).toContain('DSP-APP is built with');
    });

    it('should route to Angular page', async () => {
        await browser.waitForAngularEnabled(false);
        footer.navigateTo();
        await browser.waitForAngularEnabled(true);

        browser.getWindowHandle().then(function (parentGUID) {
            // click the link that opens in a new window
            footer.getAngularLink().click();
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
                expect(browser.driver.getCurrentUrl()).toEqual(
                    'https://angular.io'
                );

                // close the new tab
                browser.close();

                // switch back to the parent tab
                browser.switchTo().window(parentGUID);
            });
        });
    });

    it('should route to Angular Material page', async () => {
        await browser.waitForAngularEnabled(false);
        footer.navigateTo();
        await browser.waitForAngularEnabled(true);

        browser.getWindowHandle().then(function (parentGUID) {
            // click the link that opens in a new window
            footer.getMaterialLink().click();
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
                expect(browser.driver.getCurrentUrl()).toEqual(
                    'https://material.angular.io'
                );

                // close the new tab
                browser.close();

                // switch back to the parent tab
                browser.switchTo().window(parentGUID);
            });
        });
    });

    it('should route to DSP-API doc page', async () => {
        await browser.waitForAngularEnabled(false);
        footer.navigateTo();
        await browser.waitForAngularEnabled(true);

        browser.getWindowHandle().then(function (parentGUID) {
            // click the link that opens in a new window
            footer.getKnoraLink().click();
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
                expect(browser.driver.getCurrentUrl()).toEqual(
                    'https://www.knora.org'
                );

                // close the new tab
                browser.close();

                // switch back to the parent tab
                browser.switchTo().window(parentGUID);
            });
        });
    });

    it('should route to Sipi page', async () => {
        await browser.waitForAngularEnabled(false);
        footer.navigateTo();
        await browser.waitForAngularEnabled(true);

        browser.getWindowHandle().then(function (parentGUID) {
            // click the link that opens in a new window
            footer.getSipiLink().click();
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
                expect(browser.driver.getCurrentUrl()).toEqual(
                    'https://sipi.io'
                );

                // close the new tab
                browser.close();

                // switch back to the parent tab
                browser.switchTo().window(parentGUID);
            });
        });
    });

    it('should route to SAGW page', async () => {
        await browser.waitForAngularEnabled(false);
        footer.navigateTo();
        await browser.waitForAngularEnabled(true);

        browser.getWindowHandle().then(function (parentGUID) {
            // click the link that opens in a new window
            footer.getSAGWLink().click();
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
                expect(browser.driver.getCurrentUrl()).toEqual(
                    'http://sagw.ch'
                );

                // close the new tab
                browser.close();

                // switch back to the parent tab
                browser.switchTo().window(parentGUID);
            });
        });
    });

    it('should route to SwissUniversities page', async () => {
        await browser.waitForAngularEnabled(false);
        footer.navigateTo();
        await browser.waitForAngularEnabled(true);

        browser.getWindowHandle().then(function (parentGUID) {
            // click the link that opens in a new window
            footer.getSwissUniversitiesLink().click();
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
                expect(browser.driver.getCurrentUrl()).toEqual(
                    'http://swissuniversities.ch'
                );

                // close the new tab
                browser.close();

                // switch back to the parent tab
                browser.switchTo().window(parentGUID);
            });
        });
    });

    it('should route to SNF page', async () => {
        await browser.waitForAngularEnabled(false);
        footer.navigateTo();
        await browser.waitForAngularEnabled(true);

        browser.getWindowHandle().then(function (parentGUID) {
            // click the link that opens in a new window
            footer.getSNFLink().click();
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
                expect(browser.driver.getCurrentUrl()).toEqual('http://snf.ch');

                // close the new tab
                browser.close();

                // switch back to the parent tab
                browser.switchTo().window(parentGUID);
            });
        });
    });

    it('should route to DaSCH page', async () => {
        await browser.waitForAngularEnabled(false);
        footer.navigateTo();
        await browser.waitForAngularEnabled(true);

        browser.getWindowHandle().then(function (parentGUID) {
            // click the link that opens in a new window
            footer.getDaSCHLink().click();
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
                expect(browser.driver.getCurrentUrl()).toEqual(
                    'https://dasch.swiss'
                );

                // close the new tab
                browser.close();

                // switch back to the parent tab
                browser.switchTo().window(parentGUID);
            });
        });
    });

    it('should route to DaSCH github page', async () => {
        await browser.waitForAngularEnabled(false);
        footer.navigateTo();
        await browser.waitForAngularEnabled(true);

        browser.getWindowHandle().then(function (parentGUID) {
            // click the link that opens in a new window
            footer.getDaSCHgitHubLink().click();
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
                expect(browser.driver.getCurrentUrl()).toEqual(
                    'https://www.github.com/dasch-swiss'
                );

                // close the new tab
                browser.close();

                // switch back to the parent tab
                browser.switchTo().window(parentGUID);
            });
        });
    });

    it('should route to DaSCH twitter page', async () => {
        await browser.waitForAngularEnabled(false);
        footer.navigateTo();
        await browser.waitForAngularEnabled(true);

        browser.getWindowHandle().then(function (parentGUID) {
            // click the link that opens in a new window
            footer.getTwitterLink().click();
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
                expect(browser.driver.getCurrentUrl()).toEqual(
                    'https://twitter.com/DaSCHSwiss'
                );

                // close the new tab
                browser.close();

                // switch back to the parent tab
                browser.switchTo().window(parentGUID);
            });
        });
    });

    it('should route to DaSCH facebook page', async () => {
        await browser.waitForAngularEnabled(false);
        footer.navigateTo();
        await browser.waitForAngularEnabled(true);

        browser.getWindowHandle().then(function (parentGUID) {
            // click the link that opens in a new window
            footer.getFacebookLink().click();
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
                expect(browser.driver.getCurrentUrl()).toEqual(
                    'https://facebook.com/dasch.swiss'
                );

                // close the new tab
                browser.close();

                // switch back to the parent tab
                browser.switchTo().window(parentGUID);
            });
        });
    });

    it('should route to Bernoullistrasse google map page', async () => {
        await browser.waitForAngularEnabled(false);
        footer.navigateTo();
        await browser.waitForAngularEnabled(true);

        browser.getWindowHandle().then(function (parentGUID) {
            // click the link that opens in a new window
            footer.getBernoulistrasseMapLink().click();
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
                expect(browser.driver.getCurrentUrl()).toEqual(
                    'https://www.google.com/maps/place/Bernoullistrasse+32%2C+4056+Basel'
                );

                // close the new tab
                browser.close();

                // switch back to the parent tab
                browser.switchTo().window(parentGUID);
            });
        });
    });
});
