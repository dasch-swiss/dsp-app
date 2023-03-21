import { browser, element, by } from 'protractor';

export class FooterPage {
    navigateTo() {
        return browser.get('/');
    }

    getFooterText() {
        return element(by.css('div.about p')).getText();
    }

    getAngularLink() {
        return element(by.css('a[href*="https://angular.io"]'));
    }

    getMaterialLink() {
        return element(by.css('a[href*="https://material.angular.io"]'));
    }

    getKnoraLink() {
        return element(by.css('a[href*="https://www.knora.org"]'));
    }

    getSipiLink() {
        return element(by.css('a[href*="https://sipi.io"]'));
    }

    getSAGWLink() {
        return element(by.css('a[href*="http://sagw.ch"]'));
    }

    getSwissUniversitiesLink() {
        return element(by.css('a[href*="http://swissuniversities.ch"]'));
    }

    getSNFLink() {
        return element(by.css('a[href*="http://snf.ch"]'));
    }

    getDaSCHLink() {
        return element(by.css('a[href*="https://dasch.swiss"]'));
    }

    getDaSCHgitHubLink() {
        return element(by.css('a[href*="https://www.github.com/dasch-swiss"]'));
    }

    getTwitterLink() {
        return element(by.css('a[href*="https://twitter.com/DaSCHSwiss"]'));
    }

    getFacebookLink() {
        return element(by.css('a[href*="https://facebook.com/dasch.swiss"]'));
    }

    getBernoulistrasseMapLink() {
        return element(
            by.css(
                'a[href*="https://www.google.com/maps/place/Bernoullistrasse+32%2C+4056+Basel"]'
            )
        );
    }
}
