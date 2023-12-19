import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ExternalLinksDirective } from './external-links.directive';

@Component({
  template: `
    <a class="external" href="http://dasch.swiss/">{{ externalLinkLabel }}</a>
    <a
      class="internal"
      href="http://localhost:4200/resource/http%253A%252F%252Frdfh.ch%252F0001%252FLOV-6aLYQFW15jwdyS51Yw"
      >{{ internalLinkLabel }}</a
    >
  `,
})
class TestLinkHostComponent {
  externalLinkLabel = 'DaSCH website';
  internalLinkLabel = 'Resource link';
  constructor() {}
}

describe('ExternalLinksDirective', () => {
  let testHostComponent: TestLinkHostComponent;
  let testHostFixture: ComponentFixture<TestLinkHostComponent>;
  let extLinkEl: DebugElement;
  let intLinkEl: DebugElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ExternalLinksDirective, TestLinkHostComponent],
    });

    testHostFixture = TestBed.createComponent(TestLinkHostComponent);
    testHostComponent = testHostFixture.componentInstance;
    testHostFixture.detectChanges();

    expect(testHostComponent).toBeTruthy();
  });

  it('should create an instance', () => {
    expect(testHostComponent).toBeTruthy();
  });

  it('should get the correct attributes for an external link', () => {
    expect(testHostComponent).toBeTruthy();
    extLinkEl = testHostFixture.debugElement.query(By.css('.external'));

    expect(extLinkEl.attributes.rel).toEqual('noopener');
    expect(extLinkEl.attributes.target).toEqual('_blank');
    expect(extLinkEl.attributes.href).toEqual('http://dasch.swiss/');
  });

  it('should get the correct attributes for an internal link', () => {
    expect(testHostComponent).toBeTruthy();
    intLinkEl = testHostFixture.debugElement.query(By.css('.internal'));

    expect(intLinkEl.attributes.rel).toBeFalsy();
    expect(intLinkEl.attributes.target).toBeFalsy();
    expect(intLinkEl.attributes.href).toEqual(
      'http://localhost:4200/resource/http%253A%252F%252Frdfh.ch%252F0001%252FLOV-6aLYQFW15jwdyS51Yw'
    );
  });
});
