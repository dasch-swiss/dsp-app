import { Component } from '@angular/core';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TextValueHtmlLinkDirective } from './text-value-html-link.directive';

/**
 * test host component to simulate parent component.
 */
@Component({
  template: ` <div
    [innerHTML]="html"
    appHtmlLink
    (internalLinkClicked)="clicked($event)"
    (internalLinkHovered)="hovered($event)"></div>`,
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
    directive = testHostFixture.debugElement
      .query(By.directive(TextValueHtmlLinkDirective))
      .injector.get(TextValueHtmlLinkDirective);

    testHostFixture.detectChanges();

    expect(testHostComponent).toBeTruthy();
    expect(directive).toBeTruthy();

    // resetting the internalLinkClickedIri
    testHostComponent.internalLinkClickedIri = undefined;
  });

  it('should create an instance', () => {
    expect(testHostComponent).toBeTruthy();
  });

  it('should emit a left mouse click on an internal link', () => {
    // fake the link element
    const fakeEventTarget = {
      nodeName: 'A',
      className: 'salsah-link',
      href: 'http://rdfh.ch/0001/H6gBWUuJSuuO-CilHV8kQw',
    };

    // fake a left mouse click
    const fakeEvent = {
      target: fakeEventTarget,
      button: 0, // left mouse button
      preventDefault: jasmine.createSpy('preventDefault'),
    };

    // Create a spy on the emit method
    spyOn(directive.internalLinkClicked, 'emit');

    // Call the onClick method directly with the fake event without using/testing the @HostListener decorator
    // or outputs
    directive.onClick(fakeEvent as any);

    // Check if emit was called
    expect(directive.internalLinkClicked.emit).toHaveBeenCalled();

    // check the value; no need to test Angular EventEmitter
    expect(directive.internalLinkClicked.emit).toHaveBeenCalledWith(
      'http://rdfh.ch/0001/H6gBWUuJSuuO-CilHV8kQw'
    );

    // Check if the default action (i.e. window open of 'http://rdfh.ch/0001/H6gBWUuJSuuO-CilHV8kQw') was prevented.
    // This must happen in case of an internal link.
    expect(fakeEvent.preventDefault).toHaveBeenCalled();
  });

  it('should emit right mouse down on an internal link', () => {
    // fake the link element
    const fakeEventTarget = {
      nodeName: 'A',
      className: 'salsah-link',
      href: 'http://rdfh.ch/0001/H6gBWUuJSuuO-CilHV8kQw',
    };

    // fake a left mouse down event
    const fakeMouseDownEvent = {
      target: fakeEventTarget,
      button: 2, // left mouse button
      preventDefault: jasmine.createSpy('preventDefault'),
    };

    // Create a spy on the emit method
    spyOn(directive.internalLinkClicked, 'emit');

    // Call the onClick method directly with the fake event without using/testing the @HostListener decorator
    // or outputs
    directive.onMouseDown(fakeMouseDownEvent as any);

    // Check if emit was called
    expect(directive.internalLinkClicked.emit).toHaveBeenCalled();

    // check the value; no need to test Angular EventEmitter
    expect(directive.internalLinkClicked.emit).toHaveBeenCalledWith(
      'http://rdfh.ch/0001/H6gBWUuJSuuO-CilHV8kQw'
    );

    // Check if the default action (i.e. window open of 'http://rdfh.ch/0001/H6gBWUuJSuuO-CilHV8kQw') was prevented.
    // This must happen in case of an internal link.
    expect(fakeMouseDownEvent.preventDefault).toHaveBeenCalled();
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

  it('should not emit on click on an external link', () => {
    expect(testHostComponent).toBeTruthy();
    expect(testHostComponent.internalLinkClickedIri).toBeUndefined();

    const hostCompDe = testHostFixture.debugElement;
    const directiveDe = hostCompDe.query(
      By.directive(TextValueHtmlLinkDirective)
    );

    const externalLinkDe = directiveDe.query(By.css('a:not(.salsah-link)'));

    // left mouse event
    externalLinkDe.nativeElement.dispatchEvent(
      new MouseEvent('click', { bubbles: true, button: 0 })
    );

    testHostFixture.detectChanges();

    // as the link is external, the internalLinkClickedIri should not still be set to undefined
    expect(testHostComponent.internalLinkClickedIri).toEqual(undefined);
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
