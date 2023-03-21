import { browser, by, element } from 'protractor';

export class HelpPage {
    navigateTo() {
        return browser.get('/help');
    }

    getPageTitle() {
        return element(by.css('app-help h1')).getText();
    }

    getProjManagementDocButton() {
        const appGridDocEl = element.all(
            by.css('#app-grid-documentation .app-grid-item')
        );
        const projManagementEl = appGridDocEl.get(0);

        return projManagementEl.element(by.css('.action .mat-button'));
    }

    getKnoraAppReleaseNotesButton() {
        const appGridEl = element.all(by.css('#app-grid-tools .app-grid-item'));
        const knoraAppEl = appGridEl.get(0);

        return knoraAppEl.element(by.css('.action .mat-button'));
    }

    getSipiReleaseNotesButton() {
        const appGridEl = element.all(by.css('#app-grid-tools .app-grid-item'));
        const sipiEl = appGridEl.get(2);

        return sipiEl.element(by.css('.action .mat-button'));
    }

    getDaschContactButton() {
        const appGridEl = element.all(by.css('#app-grid-tools .app-grid-item'));
        const daschContactEl = appGridEl.get(3);

        return daschContactEl.element(by.css('.action .mat-button'));
    }

    getDaschSwissButton() {
        const appGridEl = element.all(by.css('#app-grid-tools .app-grid-item'));
        const daschSwissEl = appGridEl.get(4);

        return daschSwissEl.element(by.css('.action .mat-button'));
    }

    getGithubContributeButton() {
        const appGridEl = element.all(by.css('#app-grid-tools .app-grid-item'));
        const githubEl = appGridEl.get(5);

        return githubEl.element(by.css('.action .mat-button'));
    }
}
