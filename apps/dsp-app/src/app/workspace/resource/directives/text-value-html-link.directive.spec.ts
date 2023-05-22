import { Component } from '@angular/core';
import { TextValueHtmlLinkDirective } from './text-value-html-link.directive';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';

/**
 * test host component to simulate parent component.
 */
@Component({
    template: ` <div
        [innerHTML]="html"
        appHtmlLink
        (internalLinkClicked)="clicked($event)"
        (internalLinkHovered)="hovered($event)"
    ></div>`,
})
class TestHostComponent {
    // the href attribute of the external link is empty
    // because otherwise the test browser would attempt to access it
    html =
        'This is a test <a>external link</a> and a test <a class="salsah-link" href="http://rdfh.ch/0001/H6gBWUuJSuuO-CilHV8kQw">internal link</a>';

    internalLinkClickedIri: string;

    internalLinkHoveredIri: string;

    clicked(iri: string) {
        this.internalLinkClickedIri = iri;
    }

    hovered(iri: string) {
        this.internalLinkHoveredIri = iri;
    }
}

describe('TextValueHtmlLinkDirective', () => {
    let testHostComponent: TestHostComponent;
    let testHostFixture: ComponentFixture<TestHostComponent>;
    let directive: TextValueHtmlLinkDirective;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [BrowserAnimationsModule],
            declarations: [TextValueHtmlLinkDirective, TestHostComponent],
        }).compileComponents();

    }));

    beforeEach(() => {
        testHostFixture = TestBed.createComponent(TestHostComponent);
        testHostComponent = testHostFixture.componentInstance;
        directive = testHostFixture.debugElement.query(By.directive(TextValueHtmlLinkDirective)).injector.get(TextValueHtmlLinkDirective);

        testHostFixture.detectChanges();

        expect(testHostComponent).toBeTruthy();
        expect(directive).toBeTruthy();

        // resetting the internalLinkClickedIri
        testHostComponent.internalLinkClickedIri = undefined;
    });

    it('should create an instance', () => {
        expect(testHostComponent).toBeTruthy();
    });

    it('should emit a left mouse button click on an internal link', () => {

        expect(testHostComponent).toBeTruthy();
        expect(testHostComponent.internalLinkClickedIri).toBeUndefined();

        const hostCompDe = testHostFixture.debugElement;
        const directiveDe = hostCompDe.query(
            By.directive(TextValueHtmlLinkDirective)
        );

        const internalLinkDe = directiveDe.query(By.css('a.salsah-link'));

        // left mouse event
        internalLinkDe.nativeElement.dispatchEvent(
            new MouseEvent('mousedown', { bubbles: true, button: 0 })
    );

        testHostFixture.detectChanges();

        expect(testHostComponent.internalLinkClickedIri).toEqual(
            'http://rdfh.ch/0001/H6gBWUuJSuuO-CilHV8kQw'
        );
    });

    it('should emit a right mouse button click on an internal link', () => {
        expect(testHostComponent).toBeTruthy();
        expect(testHostComponent.internalLinkClickedIri).toBeUndefined();

        const hostCompDe = testHostFixture.debugElement;
        const directiveDe = hostCompDe.query(
            By.directive(TextValueHtmlLinkDirective)
        );

        const internalLinkDe = directiveDe.query(By.css('a.salsah-link'));

        // left mouse event
        internalLinkDe.nativeElement.dispatchEvent(
            new MouseEvent('mousedown', { bubbles: true, button: 2 })
        );

        testHostFixture.detectChanges();

        expect(testHostComponent.internalLinkClickedIri).toEqual(
            'http://rdfh.ch/0001/H6gBWUuJSuuO-CilHV8kQw'
        );
    });

    it('should emit a middle mouse button click on an internal link', () => {
        expect(testHostComponent).toBeTruthy();
        expect(testHostComponent.internalLinkClickedIri).toBeUndefined();

        const hostCompDe = testHostFixture.debugElement;
        const directiveDe = hostCompDe.query(
            By.directive(TextValueHtmlLinkDirective)
        );

        const internalLinkDe = directiveDe.query(By.css('a.salsah-link'));

        // left mouse event
        internalLinkDe.nativeElement.dispatchEvent(
            new MouseEvent('mousedown', { bubbles: true, button: 1 })
        );

        testHostFixture.detectChanges();

        expect(testHostComponent.internalLinkClickedIri).toEqual(
            'http://rdfh.ch/0001/H6gBWUuJSuuO-CilHV8kQw'
        );
    });

    it('should not react to clicking on an external link', () => {
        expect(testHostComponent).toBeTruthy();

        const hostCompDe = testHostFixture.debugElement;
        const directiveDe = hostCompDe.query(
            By.directive(TextValueHtmlLinkDirective)
        );

        const externalLinkDe = directiveDe.query(By.css('a:not(.salsah-link)'));

        externalLinkDe.nativeElement.click();

        testHostFixture.detectChanges();

        expect(testHostComponent.internalLinkClickedIri).toBeUndefined();
    });

    it('should react to hovering over an internal link', () => {
        expect(testHostComponent).toBeTruthy();

        const hostCompDe = testHostFixture.debugElement;
        const directiveDe = hostCompDe.query(
            By.directive(TextValueHtmlLinkDirective)
        );

        const internalLinkDe = directiveDe.query(By.css('a.salsah-link'));

        internalLinkDe.nativeElement.dispatchEvent(
            new MouseEvent('mouseover', {
                view: window,
                bubbles: true,
                cancelable: true,
            })
        );

        testHostFixture.detectChanges();

        expect(testHostComponent.internalLinkHoveredIri).toEqual(
            'http://rdfh.ch/0001/H6gBWUuJSuuO-CilHV8kQw'
        );
    });

    it('should not react to hovering over an external link', () => {
        expect(testHostComponent).toBeTruthy();

        const hostCompDe = testHostFixture.debugElement;
        const directiveDe = hostCompDe.query(
            By.directive(TextValueHtmlLinkDirective)
        );

        const externalLinkDe = directiveDe.query(By.css('a:not(.salsah-link)'));

        externalLinkDe.nativeElement.dispatchEvent(
            new MouseEvent('mouseover', {
                view: window,
                bubbles: true,
                cancelable: true,
            })
        );

        testHostFixture.detectChanges();

        expect(testHostComponent.internalLinkHoveredIri).toBeUndefined();
    });
});
